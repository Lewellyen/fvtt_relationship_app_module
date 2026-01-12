/**
 * Interface for relationship page repository adapter.
 *
 * Provides operations for loading and saving relationship node and graph page content,
 * as well as managing marker flags for quick identification.
 *
 * This interface is platform-agnostic and can be implemented for different platforms
 * (Foundry, Roll20, etc.). The Foundry-specific implementation is in
 * FoundryRelationshipPageRepositoryAdapter.
 */

import type { Result } from "@/domain/types/result";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";

/**
 * Repository adapter for relationship page operations.
 *
 * Handles:
 * - Loading and saving node page content
 * - Loading and saving graph page content
 * - Setting and getting marker flags for quick identification
 */
export interface RelationshipPageRepositoryAdapter {
  /**
   * Gets the content of a relationship node page.
   *
   * @param pageId - The ID of the page
   * @returns Result with RelationshipNodeData or error
   */
  getNodePageContent(pageId: string): Promise<Result<RelationshipNodeData, EntityRepositoryError>>;

  /**
   * Updates the content of a relationship node page.
   *
   * @param pageId - The ID of the page
   * @param data - The node data to save
   * @returns Result indicating success or error
   */
  updateNodePageContent(
    pageId: string,
    data: RelationshipNodeData
  ): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Gets the content of a relationship graph page.
   *
   * @param pageId - The ID of the page
   * @returns Result with RelationshipGraphData or error
   */
  getGraphPageContent(
    pageId: string
  ): Promise<Result<RelationshipGraphData, EntityRepositoryError>>;

  /**
   * Updates the content of a relationship graph page.
   *
   * @param pageId - The ID of the page
   * @param data - The graph data to save
   * @returns Result indicating success or error
   */
  updateGraphPageContent(
    pageId: string,
    data: RelationshipGraphData
  ): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Sets the node marker flag on a page.
   *
   * @param pageId - The ID of the page
   * @param hasNode - Whether the page has a node
   * @returns Result indicating success or error
   */
  setNodeMarker(pageId: string, hasNode: boolean): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Sets the graph marker flag on a page.
   *
   * @param pageId - The ID of the page
   * @param hasGraph - Whether the page has a graph
   * @returns Result indicating success or error
   */
  setGraphMarker(pageId: string, hasGraph: boolean): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Gets the node marker flag from a page.
   *
   * @param pageId - The ID of the page
   * @returns Result with boolean value or error
   */
  getNodeMarker(pageId: string): Promise<Result<boolean, EntityRepositoryError>>;

  /**
   * Gets the graph marker flag from a page.
   *
   * @param pageId - The ID of the page
   * @returns Result with boolean value or error
   */
  getGraphMarker(pageId: string): Promise<Result<boolean, EntityRepositoryError>>;
}
