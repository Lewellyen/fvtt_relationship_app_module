/**
 * Interface for relationship page collection adapter.
 *
 * Provides query operations for finding relationship pages by type or journal entry.
 *
 * This interface is platform-agnostic and can be implemented for different platforms
 * (Foundry, Roll20, etc.). The Foundry-specific implementation is in
 * FoundryRelationshipPageCollectionAdapter.
 */

import type { Result } from "@/domain/types/result";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import type { FoundryJournalEntryPage } from "@/infrastructure/adapters/foundry/types";

/**
 * Collection adapter for relationship page query operations.
 *
 * Handles:
 * - Finding pages by type (node or graph)
 * - Finding pages by journal entry
 * - Finding specific page types within a journal entry
 */
export interface RelationshipPageCollectionAdapter {
  /**
   * Finds all pages of a specific type (node or graph).
   *
   * @param type - The page type to find ("node" or "graph")
   * @returns Result with array of pages or error
   */
  findPagesByType(
    type: "node" | "graph"
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;

  /**
   * Finds all relationship node pages.
   *
   * @returns Result with array of node pages or error
   */
  findNodePages(): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;

  /**
   * Finds all relationship graph pages.
   *
   * @returns Result with array of graph pages or error
   */
  findGraphPages(): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;

  /**
   * Finds all pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of pages or error
   */
  findPagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;

  /**
   * Finds all relationship node pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of node pages or error
   */
  findNodePagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;

  /**
   * Finds all relationship graph pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of graph pages or error
   */
  findGraphPagesByJournalEntry(
    journalId: string
  ): Promise<Result<FoundryJournalEntryPage[], EntityCollectionError>>;
}
