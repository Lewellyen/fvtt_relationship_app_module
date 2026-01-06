import type { Result } from "@/domain/types/result";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type {
  EntityRepositoryError,
  CreateEntityData,
  EntityChanges,
} from "@/domain/ports/repositories/platform-entity-repository.types";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import type { EntitySearchQuery } from "@/domain/ports/collections/entity-search-query.interface";
import type { EntityQueryBuilder } from "@/domain/ports/collections/entity-query-builder.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import { FoundryJournalCollectionAdapter } from "../collection-adapters/foundry-journal-collection-adapter";
import { JournalMapperRegistry } from "../mappers/journal-mapper-registry";
import { DefaultJournalMapper } from "../mappers/default-journal-mapper";
import { ok, err } from "@/domain/utils/result";
import { getFirstArrayElement } from "@/application/utils/array-utils";
import {
  castFoundryDocumentForFlag,
  castFoundryDocumentWithUpdate,
  castFoundryJournalEntryClass,
  castCreatedJournalEntry,
  createEntityDataWithId,
} from "@/infrastructure/adapters/foundry/runtime-casts";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import * as v from "valibot";

/**
 * Foundry-specific implementation of PlatformJournalRepository.
 *
 * Uses composition to combine collection adapter with CRUD operations.
 * Type mapping is handled by JournalMapperRegistry (OCP-compliant).
 */
export class FoundryJournalRepositoryAdapter implements PlatformJournalRepository {
  constructor(
    private readonly collection: FoundryJournalCollectionAdapter, // Injected via composition
    private readonly foundryGame: FoundryGame, // FoundryGamePort (version-agnostisch), nicht FoundryV13GamePort!
    private readonly foundryDocument: FoundryDocument, // FoundryDocumentPort (version-agnostisch), nicht FoundryV13DocumentPort!
    private readonly mapperRegistry: JournalMapperRegistry // Mapper registry for extensible mapping (OCP)
  ) {}

  // ===== Collection Methods (delegate to collection adapter) =====

  getAll(): Result<JournalEntry[], EntityCollectionError> {
    return this.collection.getAll();
  }
  getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
    return this.collection.getById(id);
  }
  getByIds(ids: string[]): Result<JournalEntry[], EntityCollectionError> {
    return this.collection.getByIds(ids);
  }
  exists(id: string): Result<boolean, EntityCollectionError> {
    return this.collection.exists(id);
  }
  count(): Result<number, EntityCollectionError> {
    return this.collection.count();
  }
  search(query: EntitySearchQuery<JournalEntry>): Result<JournalEntry[], EntityCollectionError> {
    return this.collection.search(query);
  }
  query(): EntityQueryBuilder<JournalEntry> {
    return this.collection.query();
  }

  // ===== CREATE Operations =====

  async create(
    data: CreateEntityData<JournalEntry> | (CreateEntityData<JournalEntry> & { id: string })
  ): Promise<Result<JournalEntry, EntityRepositoryError>> {
    // Foundry: JournalEntry.create() - statische Methode
    // Nutzt FoundryDocumentPort für create()
    // JournalEntry ist eine globale Foundry-Klasse
    const journalEntryClassResult = castFoundryJournalEntryClass();
    if (!journalEntryClassResult.ok) {
      return err({
        code: "PLATFORM_ERROR",
        message: `Foundry JournalEntry class not available: ${journalEntryClassResult.error.message}`,
        details: journalEntryClassResult.error,
      });
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const JournalEntryClass = journalEntryClassResult.value;

    try {
      const createResult = await this.foundryDocument.create(JournalEntryClass, data);
      if (!createResult.ok) {
        return err({
          code: "OPERATION_FAILED",
          message: `Failed to create journal: ${createResult.error.message}`,
          details: createResult.error,
        });
      }

      // Map Foundry type → Domain type using mapper registry
      // Use runtime-safe cast function to convert generic TDocument to FoundryJournalEntry
      const foundryEntry = castCreatedJournalEntry(createResult.value);
      try {
        const createdEntry = this.mapperRegistry.mapToDomain(foundryEntry);
        return ok(createdEntry);
      } catch (error) {
        return err({
          code: "OPERATION_FAILED",
          message: `Failed to map journal to domain: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
        });
      }
    } catch (error) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create journal: ${error instanceof Error ? error.message : String(error)}`,
        details: error,
      });
    }
  }

  async createMany(
    data: CreateEntityData<JournalEntry>[]
  ): Promise<Result<JournalEntry[], EntityRepositoryError>> {
    const results: JournalEntry[] = [];
    const errors: EntityRepositoryError[] = [];

    for (const item of data) {
      const result = await this.create(item);
      if (result.ok) {
        results.push(result.value);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      // errors array is guaranteed to be non-empty here, so getFirstArrayElement is safe
      const firstError = getFirstArrayElement(errors);
      return err(firstError);
    }

    return ok(results);
  }

  // ===== UPDATE Operations =====

  async update(
    id: string,
    changes: EntityChanges<JournalEntry>
  ): Promise<Result<JournalEntry, EntityRepositoryError>> {
    // Get current entity
    const currentResult = this.getById(id);
    if (!currentResult.ok) {
      return {
        ok: false,
        error: {
          code: "ENTITY_NOT_FOUND",
          message: `Journal ${id} not found`,
          details: currentResult.error,
        },
      };
    }

    if (!currentResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`,
      });
    }

    // Get Foundry entry
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found in Foundry`,
      });
    }

    const foundryEntry = foundryResult.value;

    // Prepare update data (nur normale Properties, KEINE Flags!)
    // Flags werden über setFlag()/unsetFlag() gesetzt, nicht über update()
    //
    // WICHTIG: Properties löschen durch "-=" Notation!
    // Foundry VTT verwendet Differences und Merges, daher braucht man eine spezielle
    // Notation, um zu signalisieren, dass ein Wert gelöscht werden soll.
    // Syntax: 'propertyName.-=key': null (für nested: 'system.-=key': null)
    //
    // HINWEIS:
    // - Normale Properties: 'propertyName.-=': null oder 'system.-=key': null
    // - Flags: unsetFlag() (empfohlen) oder 'flags.scope.-=key': null
    // - Arrays: Müssen als Ganzes geschrieben werden (keine Index-Modifikation möglich)
    const updateData: Record<string, unknown> = {};
    if (changes.name !== undefined) {
      if (changes.name === null) {
        // Property löschen: "-=" Notation verwenden
        updateData["name.-="] = null;
      } else {
        // Property aktualisieren: normaler Wert
        updateData.name = changes.name;
      }
    }
    // Weitere Properties hier hinzufügen...
    // ❌ KEINE Flags hier! Flags werden über setFlag()/unsetFlag() gesetzt
    // ❌ Arrays müssen als Ganzes geschrieben werden, nicht per Index!

    // Foundry: entry.update(updateData) - nur für normale Properties
    // Nutzt FoundryDocumentPort für update()
    const docWithUpdateResult = castFoundryDocumentWithUpdate<{ id: string; name?: string | null }>(
      foundryEntry
    );
    if (!docWithUpdateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support update: ${docWithUpdateResult.error.message}`,
        details: docWithUpdateResult.error,
      });
    }
    const updateResult = await this.foundryDocument.update(docWithUpdateResult.value, updateData);
    if (!updateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to update journal ${id}: ${updateResult.error.message}`,
        details: updateResult.error,
      });
    }

    // Get updated entry (mapped to domain type)
    const updatedResult = this.getById(id);
    if (!updatedResult.ok || !updatedResult.value) {
      return err({
        code: "OPERATION_FAILED",
        message: "Failed to retrieve updated journal",
      });
    }

    return ok(updatedResult.value);
  }

  async updateMany(
    updates: Array<{ id: string; changes: EntityChanges<JournalEntry> }>
  ): Promise<Result<JournalEntry[], EntityRepositoryError>> {
    const results: JournalEntry[] = [];
    const errors: EntityRepositoryError[] = [];

    for (const update of updates) {
      const result = await this.update(update.id, update.changes);
      if (result.ok) {
        results.push(result.value);
      } else {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      // errors array is guaranteed to be non-empty here, so getFirstArrayElement is safe
      const firstError = getFirstArrayElement(errors);
      return err(firstError);
    }

    return ok(results);
  }

  async patch(
    id: string,
    partial: Partial<JournalEntry>
  ): Promise<Result<JournalEntry, EntityRepositoryError>> {
    return this.update(id, partial);
  }

  async upsert(
    id: string,
    data: CreateEntityData<JournalEntry>
  ): Promise<Result<JournalEntry, EntityRepositoryError>> {
    const existsResult = this.exists(id);
    if (!existsResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to check if journal ${id} exists`,
        details: existsResult.error,
      });
    }

    if (existsResult.value) {
      // Update existing
      return this.update(id, data);
    } else {
      // Create new - id needs to be added since CreateEntityData omits id
      // For upsert, we need to provide id, so we use helper function to add it type-safely
      const createData = createEntityDataWithId(data, id);
      // Type assertion: createData is CreateEntityData<JournalEntry> & { id: string }
      type CreateDataWithId = CreateEntityData<JournalEntry> & { id: string };
      /* type-coverage:ignore-next-line -- Type narrowing: createEntityDataWithId guarantees CreateEntityData<JournalEntry> & { id: string } */
      return this.create(createData as CreateDataWithId);
    }
  }

  // ===== DELETE Operations =====

  async delete(id: string): Promise<Result<void, EntityRepositoryError>> {
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`,
      });
    }

    // Nutzt FoundryDocumentPort für delete()
    const deleteResult = await this.foundryDocument.delete(foundryResult.value);
    if (!deleteResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to delete journal ${id}: ${deleteResult.error.message}`,
        details: deleteResult.error,
      });
    }

    return ok(undefined);
  }

  async deleteMany(ids: string[]): Promise<Result<void, EntityRepositoryError>> {
    const errors: EntityRepositoryError[] = [];

    for (const id of ids) {
      const result = await this.delete(id);
      if (!result.ok) {
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      // errors array is guaranteed to be non-empty here, so getFirstArrayElement is safe
      const firstError = getFirstArrayElement(errors);
      return err(firstError);
    }

    return ok(undefined);
  }

  // ===== Flag Convenience Methods =====

  getFlag(id: string, scope: string, key: string): Result<unknown | null, EntityRepositoryError> {
    // Get Foundry entry
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`,
      });
    }

    const foundryEntry = foundryResult.value;

    // Cast to document with flag methods
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error,
      });
    }

    // Use FoundryDocument.getFlag() with unknown schema to accept any value
    const flagResult = this.foundryDocument.getFlag(documentResult.value, scope, key, v.unknown());
    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to get flag ${scope}.${key}: ${flagResult.error.message}`,
        details: flagResult.error,
      });
    }

    return ok(flagResult.value);
  }

  async setFlag(
    id: string,
    scope: string,
    key: string,
    value: unknown
  ): Promise<Result<void, EntityRepositoryError>> {
    // Get Foundry entry
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`,
      });
    }

    const foundryEntry = foundryResult.value;

    // Cast to document with flag methods
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error,
      });
    }

    // Foundry: entry.setFlag(scope, key, value) - separate API für Flags!
    const flagResult = await this.foundryDocument.setFlag(documentResult.value, scope, key, value);

    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to set flag ${scope}.${key}: ${flagResult.error.message}`,
        details: flagResult.error,
      });
    }

    return ok(undefined);
  }

  async unsetFlag(
    id: string,
    scope: string,
    key: string
  ): Promise<Result<void, EntityRepositoryError>> {
    // Get Foundry entry
    const foundryResult = this.foundryGame.getJournalEntryById(id);
    if (!foundryResult.ok || !foundryResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal ${id} not found`,
      });
    }

    const foundryEntry = foundryResult.value;

    // Cast to document with flag methods
    const documentResult = castFoundryDocumentForFlag(foundryEntry);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Document does not support flags: ${documentResult.error.message}`,
        details: documentResult.error,
      });
    }

    // Foundry: entry.unsetFlag(scope, key) - recommended method for flags!
    // Use FoundryDocument.unsetFlag() which uses the recommended approach
    const unsetResult = await this.foundryDocument.unsetFlag(documentResult.value, scope, key);

    if (!unsetResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to unset flag ${scope}.${key}: ${unsetResult.error.message}`,
        details: unsetResult.error,
      });
    }

    return ok(undefined);
  }
}

// DI-Wrapper
export class DIFoundryJournalRepositoryAdapter extends FoundryJournalRepositoryAdapter {
  static dependencies = [foundryGameToken, foundryDocumentToken] as const;

  constructor(foundryGame: FoundryGame, foundryDocument: FoundryDocument) {
    // Create mapper registry with default mapper
    // Note: Registry should be injected via DI in the future for better testability
    const mapperRegistry = new JournalMapperRegistry();
    mapperRegistry.register(new DefaultJournalMapper());
    // Create collection adapter via composition (not delegation)
    // Pass mapper registry to collection adapter so both use the same registry
    const collection = new FoundryJournalCollectionAdapter(foundryGame, mapperRegistry);
    super(collection, foundryGame, foundryDocument, mapperRegistry);
  }
}
