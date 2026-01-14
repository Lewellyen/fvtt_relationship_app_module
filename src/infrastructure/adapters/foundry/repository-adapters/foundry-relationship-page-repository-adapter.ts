/**
 * Foundry-specific implementation of RelationshipPageRepositoryAdapter.
 *
 * Provides operations for loading and saving relationship node and graph page content,
 * as well as managing marker flags for quick identification.
 */

import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";
import type { FoundryJournalEntryPage } from "@/infrastructure/adapters/foundry/types";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import {
  castFoundryDocumentForFlag,
  castRelationshipNodePage,
  castRelationshipGraphPage,
} from "@/infrastructure/adapters/foundry/runtime-casts";
import {
  JOURNAL_ENTRY_PAGE_FLAGS,
  RELATIONSHIP_FLAGS_MODULE_ID,
} from "@/domain/constants/relationship-flags";
import * as v from "valibot";

/**
 * Helper function to find a page by ID in a journal entry.
 *
 * @param journal - The journal entry
 * @param pageId - The page ID to find
 * @returns The page if found, null otherwise
 */
function findPageById(
  journal: FoundryJournalEntry,
  pageId: string
): FoundryJournalEntryPage | null {
  // In Foundry VTT, journal.pages is an EmbeddedCollection
  // It has a get() method and can be iterated
  const pages =
    // type-coverage:ignore-next-line - Runtime cast required for Foundry EmbeddedCollection
    (journal as { pages?: { get?: (id: string) => FoundryJournalEntryPage | undefined } }).pages;

  if (!pages) {
    return null;
  }

  // Try get() method first (EmbeddedCollection)
  if (typeof pages.get === "function") {
    const page = pages.get(pageId);
    return page ?? null;
  }

  // Fallback: Iterate over pages array
  if (Array.isArray(pages)) {
    return (
      // type-coverage:ignore-next-line - Runtime cast required for Foundry page array find
      (pages.find((p) => (p as { id?: string })?.id === pageId) as
        | FoundryJournalEntryPage
        | undefined) ?? null
    );
  }

  return null;
}

/**
 * Helper function to extract flag key from full flag path.
 *
 * @param fullFlagPath - Full flag path (e.g., "fvtt_relationship_app_module.isRelationshipNode")
 * @returns The key part (e.g., "isRelationshipNode")
 *
 * @internal
 * Exported for testing purposes only.
 */
export function extractFlagKey(fullFlagPath: string): string {
  if (fullFlagPath.includes(".")) {
    const parts = fullFlagPath.split(".");
    const lastPart = parts.pop();
    if (lastPart === undefined) {
      return "";
    }
    return lastPart;
  }
  return fullFlagPath;
}

/**
 * Foundry-specific implementation of RelationshipPageRepositoryAdapter.
 */
export class FoundryRelationshipPageRepositoryAdapter implements PlatformRelationshipPageRepositoryPort {
  constructor(
    private readonly foundryGame: FoundryGame,
    private readonly foundryDocument: FoundryDocument
  ) {}

  async getNodePageContent(
    pageId: string
  ): Promise<Result<RelationshipNodeData, EntityRepositoryError>> {
    // Find the page
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      let errorCode: "ENTITY_NOT_FOUND" | "OPERATION_FAILED";
      if (pageResult.error.code === "ENTITY_NOT_FOUND") {
        errorCode = "ENTITY_NOT_FOUND";
      } else {
        errorCode = "OPERATION_FAILED";
      }
      return err({
        code: errorCode,
        message: `Failed to find page ${pageId}: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Validate that it's a node page
    const castResult = castRelationshipNodePage(page);
    if (!castResult.ok) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Page ${pageId} is not a relationship node page: ${castResult.error.message}`,
        details: castResult.error,
      });
    }

    // Extract system data
    // type-coverage:ignore-next-line - Runtime cast required for Foundry page.system access
    const pageWithSystem = page as unknown as { system?: RelationshipNodeData };
    const systemData = pageWithSystem.system;
    if (!systemData) {
      return err({
        code: "INVALID_ENTITY_DATA",
        message: `Page ${pageId} has no system data`,
      });
    }

    // TODO: Schema validation with Valibot (Phase 1 schemas need to be created)
    // For now, return the data as-is
    return ok(systemData);
  }

  async updateNodePageContent(
    pageId: string,
    data: RelationshipNodeData
  ): Promise<Result<void, EntityRepositoryError>> {
    // Find the page
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      let errorCode: "ENTITY_NOT_FOUND" | "OPERATION_FAILED";
      if (pageResult.error.code === "ENTITY_NOT_FOUND") {
        errorCode = "ENTITY_NOT_FOUND";
      } else {
        errorCode = "OPERATION_FAILED";
      }
      return err({
        code: errorCode,
        message: `Failed to find page ${pageId}: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Validate that it's a node page
    const castResult = castRelationshipNodePage(page);
    if (!castResult.ok) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Page ${pageId} is not a relationship node page: ${castResult.error.message}`,
        details: castResult.error,
      });
    }

    // Update system data
    // Cast page to unknown first to avoid type errors with Foundry's complex types
    const pageForUpdate =
      // type-coverage:ignore-next-line - Runtime cast required for Foundry document update
      page as unknown as {
        update: (changes: unknown, options?: { render?: boolean }) => Promise<{ id: string }>;
      };
    // render: false verhindert Re-Render, da Svelte reaktiv ist und kein Re-Render nötig ist
    const updateResult = await this.foundryDocument.update(
      pageForUpdate,
      {
        system: data,
      },
      { render: false }
    );

    if (!updateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to update page ${pageId}: ${updateResult.error.message}`,
        details: updateResult.error,
      });
    }

    return ok(undefined);
  }

  async getGraphPageContent(
    pageId: string
  ): Promise<Result<RelationshipGraphData, EntityRepositoryError>> {
    // Find the page
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      let errorCode: "ENTITY_NOT_FOUND" | "OPERATION_FAILED";
      if (pageResult.error.code === "ENTITY_NOT_FOUND") {
        errorCode = "ENTITY_NOT_FOUND";
      } else {
        errorCode = "OPERATION_FAILED";
      }
      return err({
        code: errorCode,
        message: `Failed to find page ${pageId}: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Validate that it's a graph page
    const castResult = castRelationshipGraphPage(page);
    if (!castResult.ok) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Page ${pageId} is not a relationship graph page: ${castResult.error.message}`,
        details: castResult.error,
      });
    }

    // Extract system data
    // type-coverage:ignore-next-line - Runtime cast required for Foundry page.system access
    const pageWithSystem = page as unknown as { system?: RelationshipGraphData };
    const systemData = pageWithSystem.system;
    if (!systemData) {
      return err({
        code: "INVALID_ENTITY_DATA",
        message: `Page ${pageId} has no system data`,
      });
    }

    // TODO: Schema validation with Valibot (Phase 1 schemas need to be created)
    // For now, return the data as-is
    return ok(systemData);
  }

  async updateGraphPageContent(
    pageId: string,
    data: RelationshipGraphData
  ): Promise<Result<void, EntityRepositoryError>> {
    // Find the page
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      let errorCode: "ENTITY_NOT_FOUND" | "OPERATION_FAILED";
      if (pageResult.error.code === "ENTITY_NOT_FOUND") {
        errorCode = "ENTITY_NOT_FOUND";
      } else {
        errorCode = "OPERATION_FAILED";
      }
      return err({
        code: errorCode,
        message: `Failed to find page ${pageId}: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Validate that it's a graph page
    const castResult = castRelationshipGraphPage(page);
    if (!castResult.ok) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Page ${pageId} is not a relationship graph page: ${castResult.error.message}`,
        details: castResult.error,
      });
    }

    // Update system data
    // Cast page to unknown first to avoid type errors with Foundry's complex types
    const pageForUpdate =
      // type-coverage:ignore-next-line - Runtime cast required for Foundry document update
      page as unknown as {
        update: (changes: unknown, options?: { render?: boolean }) => Promise<{ id: string }>;
      };
    // render: false verhindert Re-Render, da Svelte reaktiv ist und kein Re-Render nötig ist
    const updateResult = await this.foundryDocument.update(
      pageForUpdate,
      {
        system: data,
      },
      { render: false }
    );

    if (!updateResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to update page ${pageId}: ${updateResult.error.message}`,
        details: updateResult.error,
      });
    }

    return ok(undefined);
  }

  async setNodeMarker(
    pageId: string,
    hasNode: boolean
  ): Promise<Result<void, EntityRepositoryError>> {
    return this.setPageFlag(
      pageId,
      extractFlagKey(JOURNAL_ENTRY_PAGE_FLAGS.IS_RELATIONSHIP_NODE),
      hasNode
    );
  }

  async setGraphMarker(
    pageId: string,
    hasGraph: boolean
  ): Promise<Result<void, EntityRepositoryError>> {
    return this.setPageFlag(
      pageId,
      extractFlagKey(JOURNAL_ENTRY_PAGE_FLAGS.IS_RELATIONSHIP_GRAPH),
      hasGraph
    );
  }

  async getNodeMarker(pageId: string): Promise<Result<boolean, EntityRepositoryError>> {
    return this.getPageFlag(pageId, extractFlagKey(JOURNAL_ENTRY_PAGE_FLAGS.IS_RELATIONSHIP_NODE));
  }

  async getGraphMarker(pageId: string): Promise<Result<boolean, EntityRepositoryError>> {
    return this.getPageFlag(pageId, extractFlagKey(JOURNAL_ENTRY_PAGE_FLAGS.IS_RELATIONSHIP_GRAPH));
  }

  /**
   * Helper method to find a page by ID across all journal entries.
   *
   * @param pageId - The page ID to find
   * @returns Result with the page or error
   */
  private async findPageById(
    pageId: string
  ): Promise<Result<FoundryJournalEntryPage, EntityRepositoryError>> {
    // Get all journal entries
    const journalsResult = this.foundryGame.getJournalEntries();
    if (!journalsResult.ok) {
      return err({
        code: "PLATFORM_ERROR",
        message: `Failed to get journal entries: ${journalsResult.error.message}`,
        details: journalsResult.error,
      });
    }

    // Search through all journals for the page
    for (const journal of journalsResult.value) {
      const page = findPageById(journal, pageId);
      if (page) {
        return ok(page);
      }
    }

    return err({
      code: "ENTITY_NOT_FOUND",
      message: `Page ${pageId} not found in any journal entry`,
    });
  }

  /**
   * Helper method to set a flag on a page.
   *
   * @param pageId - The page ID
   * @param flagKey - The flag key (without scope)
   * @param value - The flag value
   * @returns Result indicating success or error
   */
  private async setPageFlag(
    pageId: string,
    flagKey: string,
    value: boolean
  ): Promise<Result<void, EntityRepositoryError>> {
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Page ${pageId} not found: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Cast to document with flag methods
    const documentResult = castFoundryDocumentForFlag(page);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Page does not support flags: ${documentResult.error.message}`,
        details: documentResult.error,
      });
    }

    // Set flag
    const flagResult = await this.foundryDocument.setFlag(
      documentResult.value,
      RELATIONSHIP_FLAGS_MODULE_ID,
      flagKey,
      value
    );

    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to set flag ${RELATIONSHIP_FLAGS_MODULE_ID}.${flagKey}: ${flagResult.error.message}`,
        details: flagResult.error,
      });
    }

    return ok(undefined);
  }

  /**
   * Helper method to get a flag from a page.
   *
   * @param pageId - The page ID
   * @param flagKey - The flag key (without scope)
   * @returns Result with flag value or error
   */
  private async getPageFlag(
    pageId: string,
    flagKey: string
  ): Promise<Result<boolean, EntityRepositoryError>> {
    const pageResult = await this.findPageById(pageId);
    if (!pageResult.ok) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Page ${pageId} not found: ${pageResult.error.message}`,
        details: pageResult.error,
      });
    }

    const page = pageResult.value;

    // Cast to document with flag methods
    const documentResult = castFoundryDocumentForFlag(page);
    if (!documentResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Page does not support flags: ${documentResult.error.message}`,
        details: documentResult.error,
      });
    }

    // Get flag with boolean schema validation
    const flagResult = this.foundryDocument.getFlag(
      documentResult.value,
      RELATIONSHIP_FLAGS_MODULE_ID,
      flagKey,
      v.boolean()
    );

    if (!flagResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to get flag ${RELATIONSHIP_FLAGS_MODULE_ID}.${flagKey}: ${flagResult.error.message}`,
        details: flagResult.error,
      });
    }

    // Return false if flag is null/undefined, true if it exists
    return ok(flagResult.value ?? false);
  }
}

/**
 * DI-Wrapper for FoundryRelationshipPageRepositoryAdapter.
 *
 * Provides dependency injection support by declaring static dependencies.
 */
export class DIRelationshipPageRepositoryAdapter extends FoundryRelationshipPageRepositoryAdapter {
  static dependencies = [foundryGameToken, foundryDocumentToken] as const;

  constructor(foundryGame: FoundryGame, foundryDocument: FoundryDocument) {
    super(foundryGame, foundryDocument);
  }
}
