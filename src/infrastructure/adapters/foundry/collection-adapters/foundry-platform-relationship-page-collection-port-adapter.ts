/**
 * Foundry implementation of PlatformRelationshipPageCollectionPort.
 *
 * Wraps FoundryRelationshipPageCollectionAdapter and converts FoundryJournalEntryPage
 * to domain RelationshipPage type.
 */

import type { PlatformRelationshipPageCollectionPort } from "@/domain/ports/repositories/platform-relationship-page-collection-port.interface";
import type { RelationshipPage } from "@/domain/ports/repositories/platform-relationship-page-collection-port.interface";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import type { Result } from "@/domain/types/result";
import type { RelationshipPageCollectionAdapter } from "./relationship-page-collection-adapter.interface";
import type { FoundryJournalEntryPage } from "@/infrastructure/adapters/foundry/types";
import { relationshipPageCollectionAdapterToken } from "@/infrastructure/shared/tokens/foundry/relationship-page-collection-adapter.token";
import {
  isRelationshipNodePage,
  isRelationshipGraphPage,
  castFoundryJournalEntryPageToRecord,
} from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * Helper function to convert FoundryJournalEntryPage to RelationshipPage.
 *
 * @param foundryPage - The Foundry journal entry page
 * @param journalId - The ID of the journal entry this page belongs to
 * @returns The domain RelationshipPage
 */
function convertToRelationshipPage(
  foundryPage: FoundryJournalEntryPage,
  journalId: string
): RelationshipPage {
  // Determine page type
  const pageType: "node" | "graph" = isRelationshipNodePage(foundryPage)
    ? "node"
    : isRelationshipGraphPage(foundryPage)
      ? "graph"
      : "graph"; // Default to graph if type cannot be determined

  // Create domain page with all properties from foundry page
  const foundryPageRecord = castFoundryJournalEntryPageToRecord(foundryPage);
  return {
    ...foundryPageRecord,
    id: foundryPage.id,
    type: pageType,
    journalId,
  };
}

/**
 * Foundry implementation of PlatformRelationshipPageCollectionPort.
 *
 * Wraps RelationshipPageCollectionAdapter and converts Foundry types to domain types.
 */
export class FoundryPlatformRelationshipPageCollectionPortAdapter implements PlatformRelationshipPageCollectionPort {
  constructor(private readonly adapter: RelationshipPageCollectionAdapter) {}

  async findPagesByType(
    type: "node" | "graph"
  ): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findPagesByType(type);
    if (!result.ok) {
      return result;
    }

    // Convert FoundryJournalEntryPage[] to RelationshipPage[]
    // We need to extract journalId from each page
    const domainPages: RelationshipPage[] = result.value.map((page) => {
      // Extract journalId from page (Foundry pages have a parent property or we need to find it)
      // For now, we'll use a fallback approach: try to get journalId from page properties
      const journalId =
        // type-coverage:ignore-next-line - Foundry API: FoundryJournalEntryPage has complex type structure, runtime property access requires type casts
        (page as { parent?: { id?: string }; journalId?: string; journal?: { id?: string } }).parent
          ?.id ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journalId?: string }).journalId ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journal?: { id?: string } }).journal?.id ||
        "";

      return convertToRelationshipPage(page, journalId);
    });

    return { ok: true, value: domainPages };
  }

  async findNodePages(): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findNodePages();
    if (!result.ok) {
      return result;
    }

    // Convert and extract journalId for each page
    const domainPages: RelationshipPage[] = result.value.map((page) => {
      const journalId =
        // type-coverage:ignore-next-line - Foundry API: FoundryJournalEntryPage has complex type structure, runtime property access requires type casts
        (page as { parent?: { id?: string }; journalId?: string; journal?: { id?: string } }).parent
          ?.id ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journalId?: string }).journalId ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journal?: { id?: string } }).journal?.id ||
        "";

      return convertToRelationshipPage(page, journalId);
    });

    return { ok: true, value: domainPages };
  }

  async findGraphPages(): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findGraphPages();
    if (!result.ok) {
      return result;
    }

    // Convert and extract journalId for each page
    const domainPages: RelationshipPage[] = result.value.map((page) => {
      const journalId =
        // type-coverage:ignore-next-line - Foundry API: FoundryJournalEntryPage has complex type structure, runtime property access requires type casts
        (page as { parent?: { id?: string }; journalId?: string; journal?: { id?: string } }).parent
          ?.id ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journalId?: string }).journalId ||
        // type-coverage:ignore-next-line - Foundry API: Runtime property access
        (page as { journal?: { id?: string } }).journal?.id ||
        "";

      return convertToRelationshipPage(page, journalId);
    });

    return { ok: true, value: domainPages };
  }

  async findPagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findPagesByJournalEntry(journalId);
    if (!result.ok) {
      return result;
    }

    // Convert FoundryJournalEntryPage[] to RelationshipPage[]
    const domainPages: RelationshipPage[] = result.value.map((page) =>
      convertToRelationshipPage(page, journalId)
    );

    return { ok: true, value: domainPages };
  }

  async findNodePagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findNodePagesByJournalEntry(journalId);
    if (!result.ok) {
      return result;
    }

    // Convert FoundryJournalEntryPage[] to RelationshipPage[]
    const domainPages: RelationshipPage[] = result.value.map((page) =>
      convertToRelationshipPage(page, journalId)
    );

    return { ok: true, value: domainPages };
  }

  async findGraphPagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>> {
    const result = await this.adapter.findGraphPagesByJournalEntry(journalId);
    if (!result.ok) {
      return result;
    }

    // Convert FoundryJournalEntryPage[] to RelationshipPage[]
    const domainPages: RelationshipPage[] = result.value.map((page) =>
      convertToRelationshipPage(page, journalId)
    );

    return { ok: true, value: domainPages };
  }
}

/**
 * DI-Wrapper for FoundryPlatformRelationshipPageCollectionPortAdapter.
 *
 * Provides dependency injection support by declaring static dependencies.
 */
export class DIFoundryPlatformRelationshipPageCollectionPortAdapter extends FoundryPlatformRelationshipPageCollectionPortAdapter {
  static dependencies = [relationshipPageCollectionAdapterToken] as const;

  constructor(adapter: RelationshipPageCollectionAdapter) {
    super(adapter);
  }
}
