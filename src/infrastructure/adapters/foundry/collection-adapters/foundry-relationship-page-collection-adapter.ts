/**
 * Foundry-specific implementation of RelationshipPageCollectionAdapter.
 *
 * Provides query operations for finding relationship pages by type or journal entry.
 */

import type { RelationshipPageCollectionAdapter } from "./relationship-page-collection-adapter.interface";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import type { FoundryJournalEntryPage } from "@/infrastructure/adapters/foundry/types";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import {
  isRelationshipNodePage,
  isRelationshipGraphPage,
} from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * Helper function to extract all pages from a journal entry.
 *
 * @param journal - The journal entry
 * @returns Array of pages
 */
function extractPagesFromJournal(journal: FoundryJournalEntry): FoundryJournalEntryPage[] {
  // type-coverage:ignore-next-line - Runtime cast required for Foundry EmbeddedCollection
  const journalWithPages = journal as {
    pages?:
      | FoundryJournalEntryPage[]
      | {
          get?: (id: string) => FoundryJournalEntryPage | undefined;
          contents?: FoundryJournalEntryPage[];
        };
  };
  const pages = journalWithPages.pages;

  if (!pages) {
    return [];
  }

  // If pages is an array, return it directly
  if (Array.isArray(pages)) {
    return pages;
  }

  // If pages is an EmbeddedCollection, use contents property
  if (typeof pages === "object" && "contents" in pages && Array.isArray(pages.contents)) {
    return pages.contents;
  }

  // Fallback: Return empty array
  return [];
}

/**
 * Foundry-specific implementation of RelationshipPageCollectionAdapter.
 */
export class FoundryRelationshipPageCollectionAdapter implements RelationshipPageCollectionAdapter {
  constructor(private readonly foundryGame: FoundryGame) {}

  async findPagesByType(
    type: "node" | "graph"
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    if (type === "node") {
      return this.findNodePages();
    }
    return this.findGraphPages();
  }

  async findNodePages(): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    // Get all journal entries
    const journalsResult = this.foundryGame.getJournalEntries();
    if (!journalsResult.ok) {
      return err({
        code: "COLLECTION_NOT_AVAILABLE",
        message: `Failed to get journal entries: ${journalsResult.error.message}`,
        details: journalsResult.error,
      });
    }

    const nodePages: FoundryJournalEntryPage[] = [];

    // Iterate through all journals and their pages
    for (const journal of journalsResult.value) {
      const pages = extractPagesFromJournal(journal);
      for (const page of pages) {
        // Filter by type or use type guard
        if (isRelationshipNodePage(page)) {
          nodePages.push(page);
        }
      }
    }

    return ok(nodePages);
  }

  async findGraphPages(): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    // Get all journal entries
    const journalsResult = this.foundryGame.getJournalEntries();
    if (!journalsResult.ok) {
      return err({
        code: "COLLECTION_NOT_AVAILABLE",
        message: `Failed to get journal entries: ${journalsResult.error.message}`,
        details: journalsResult.error,
      });
    }

    const graphPages: FoundryJournalEntryPage[] = [];

    // Iterate through all journals and their pages
    for (const journal of journalsResult.value) {
      const pages = extractPagesFromJournal(journal);
      for (const page of pages) {
        // Filter by type or use type guard
        if (isRelationshipGraphPage(page)) {
          graphPages.push(page);
        }
      }
    }

    return ok(graphPages);
  }

  async findPagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    // Get the journal entry
    const journalResult = this.foundryGame.getJournalEntryById(journalId);
    if (!journalResult.ok) {
      return err({
        code: "COLLECTION_NOT_AVAILABLE",
        message: `Failed to get journal entry ${journalId}: ${journalResult.error.message}`,
        details: journalResult.error,
      });
    }

    if (!journalResult.value) {
      return err({
        code: "ENTITY_NOT_FOUND",
        message: `Journal entry ${journalId} not found`,
      });
    }

    const pages = extractPagesFromJournal(journalResult.value);
    return ok(pages);
  }

  async findNodePagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    // Get all pages from the journal entry
    const pagesResult = await this.findPagesByJournalEntry(journalId);
    if (!pagesResult.ok) {
      return pagesResult;
    }

    // Filter for node pages
    const nodePages = pagesResult.value.filter((page) => isRelationshipNodePage(page));
    return ok(nodePages);
  }

  async findGraphPagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>> {
    // Get all pages from the journal entry
    const pagesResult = await this.findPagesByJournalEntry(journalId);
    if (!pagesResult.ok) {
      return pagesResult;
    }

    // Filter for graph pages
    const graphPages = pagesResult.value.filter((page) => isRelationshipGraphPage(page));
    return ok(graphPages);
  }
}

/**
 * DI-Wrapper for FoundryRelationshipPageCollectionAdapter.
 *
 * Provides dependency injection support by declaring static dependencies.
 */
export class DIRelationshipPageCollectionAdapter extends FoundryRelationshipPageCollectionAdapter {
  static dependencies = [foundryGameToken] as const;

  constructor(foundryGame: FoundryGame) {
    super(foundryGame);
  }
}
