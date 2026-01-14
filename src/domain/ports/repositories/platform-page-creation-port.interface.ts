/**
 * Platform-agnostic port for creating relationship pages.
 *
 * Provides operations for creating new relationship node and graph pages
 * within journal entries. This interface is platform-agnostic and can be
 * implemented for different platforms (Foundry, Roll20, etc.).
 */

import type { Result } from "@/domain/types/result";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";

/**
 * Platform-agnostic port for creating relationship pages.
 *
 * Handles:
 * - Creating new node pages in journal entries
 * - Creating new graph pages in journal entries
 */
export interface PlatformPageCreationPort {
  /**
   * Creates a new relationship node page in a journal entry.
   *
   * @param journalEntryId - The ID of the journal entry
   * @param initialData - The initial node data for the page
   * @returns Result with the created page ID (UUID) or error
   */
  createNodePage(
    journalEntryId: string,
    initialData: RelationshipNodeData
  ): Promise<Result<string, EntityRepositoryError>>;

  /**
   * Creates a new relationship graph page in a journal entry.
   *
   * @param journalEntryId - The ID of the journal entry
   * @param initialData - The initial graph data for the page
   * @returns Result with the created page ID (UUID) or error
   */
  createGraphPage(
    journalEntryId: string,
    initialData: RelationshipGraphData
  ): Promise<Result<string, EntityRepositoryError>>;
}
