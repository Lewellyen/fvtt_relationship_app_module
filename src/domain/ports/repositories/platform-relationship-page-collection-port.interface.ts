/**
 * Domain port for relationship page collection operations.
 *
 * Platform-agnostic interface for querying relationship pages by type or journal entry.
 * This port should be implemented by infrastructure adapters (e.g., FoundryRelationshipPageCollectionAdapter).
 *
 * Domain layer does not know about FoundryJournalEntryPage - it uses a generic page type.
 */

import type { Result } from "@/domain/types/result";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";

/**
 * Generic page type for domain operations.
 * Infrastructure adapters will map this to platform-specific types (e.g., FoundryJournalEntryPage).
 */
export type RelationshipPage = {
  /** Page ID (UUID in Foundry) */
  id: string;
  /** Page type: "node" or "graph" */
  type: "node" | "graph";
  /** UUID of the journal entry this page belongs to */
  journalId: string;
  /** Additional page properties (platform-specific, opaque to domain) */
  [key: string]: unknown;
};

/**
 * Platform-agnostic port for relationship page collection operations.
 *
 * Provides query operations for finding relationship pages by type or journal entry.
 * Implementations are platform-specific (Foundry, Roll20, etc.).
 *
 * @example
 * ```typescript
 * // Find all node pages in a journal
 * const result = await pageCollection.findNodePagesByJournalEntry("journal-id");
 * if (result.ok) {
 *   console.log(`Found ${result.value.length} node pages`);
 * }
 * ```
 */
export interface PlatformRelationshipPageCollectionPort {
  /**
   * Finds all pages of a specific type (node or graph).
   *
   * @param type - The page type to find ("node" or "graph")
   * @returns Result with array of pages or error
   */
  findPagesByType(
    type: "node" | "graph"
  ): Promise<Result<RelationshipPage[], EntityCollectionError>>;

  /**
   * Finds all relationship node pages.
   *
   * @returns Result with array of node pages or error
   */
  findNodePages(): Promise<Result<RelationshipPage[], EntityCollectionError>>;

  /**
   * Finds all relationship graph pages.
   *
   * @returns Result with array of graph pages or error
   */
  findGraphPages(): Promise<Result<RelationshipPage[], EntityCollectionError>>;

  /**
   * Finds all pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of pages or error
   */
  findPagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>>;

  /**
   * Finds all relationship node pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of node pages or error
   */
  findNodePagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>>;

  /**
   * Finds all relationship graph pages in a specific journal entry.
   *
   * @param journalId - The ID of the journal entry
   * @returns Result with array of graph pages or error
   */
  findGraphPagesByJournalEntry(
    journalId: string
  ): Promise<Result<RelationshipPage[], EntityCollectionError>>;
}
