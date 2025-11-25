import type { Result } from "@/domain/types/result";
import type { EntitySearchQuery } from "./entity-search-query.interface";
import type { EntityQueryBuilder } from "./entity-query-builder.interface";

/**
 * Generic port for read-only entity collection access.
 *
 * Provides query operations for any entity type (Journal, Actor, Item, Scene...).
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 *
 * @template TEntity - The entity type this collection manages
 *
 * @example
 * ```typescript
 * // Journal Collection
 * interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
 *
 * // Actor Collection
 * interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {}
 * ```
 */
export interface PlatformEntityCollectionPort<TEntity> {
  /**
   * Get all entities in the collection.
   *
   * Platform mappings:
   * - Foundry: game.journal.contents, game.actors.contents
   * - Roll20: findObjs({_type: "handout"}), findObjs({_type: "character"})
   * - CSV: readdir + parse all files
   *
   * @returns All entities or error
   */
  getAll(): Result<TEntity[], EntityCollectionError>;

  /**
   * Get a specific entity by its ID.
   *
   * Platform mappings:
   * - Foundry: game.journal.get(id), game.actors.get(id)
   * - Roll20: getObj("handout", id), getObj("character", id)
   * - CSV: readFile(id.json) + parse
   *
   * @param id - Entity ID
   * @returns Entity or null if not found, or error
   */
  getById(id: string): Result<TEntity | null, EntityCollectionError>;

  /**
   * Get multiple entities by their IDs.
   *
   * Performance optimization: Fetch multiple entities in one operation.
   * Platform implementations can optimize this (e.g., batch queries).
   *
   * @param ids - Array of entity IDs
   * @returns Array of found entities (may be shorter than ids array if some don't exist)
   */
  getByIds(ids: string[]): Result<TEntity[], EntityCollectionError>;

  /**
   * Check if an entity exists.
   *
   * Convenience method for existence checks without fetching full entity.
   * Platform implementations can optimize this (e.g., index lookup).
   *
   * @param id - Entity ID
   * @returns true if exists, false if not, or error
   */
  exists(id: string): Result<boolean, EntityCollectionError>;

  /**
   * Get the total count of entities in the collection.
   *
   * Convenience method for counting without fetching all entities.
   * Platform implementations can optimize this (e.g., collection.size).
   *
   * @returns Count of entities or error
   */
  count(): Result<number, EntityCollectionError>;

  /**
   * Search entities with a query object.
   *
   * Flexible search with filters, sorting, pagination.
   *
   * @param query - Search query with filters, sorting, pagination
   * @returns Matching entities or error
   */
  search(query: EntitySearchQuery<TEntity>): Result<TEntity[], EntityCollectionError>;

  /**
   * Create a query builder for fluent API.
   *
   * @returns Query builder instance
   *
   * @example
   * ```typescript
   * // Simple AND query
   * const results = collection
   *   .query()
   *   .where("name", "contains", "Quest")
   *   .where("type", "equals", "journal")
   *   .limit(10)
   *   .sortBy("name", "asc")
   *   .execute();
   *
   * // OR query
   * const results = collection
   *   .query()
   *   .where("type", "equals", "journal")
   *   .orWhere("name", "contains", "Quest")
   *   .orWhere("name", "contains", "Item")
   *   .execute();
   * // Equivalent to: type equals "journal" AND (name contains "Quest" OR name contains "Item")
   *
   * // Complex OR group
   * const results = collection
   *   .query()
   *   .where("type", "equals", "journal")
   *   .or((qb) => {
   *     qb.where("name", "contains", "Quest")
   *       .where("name", "contains", "Item")
   *   })
   *   .execute();
   * // Equivalent to: type equals "journal" AND (name contains "Quest" OR name contains "Item")
   * ```
   */
  query(): EntityQueryBuilder<TEntity>;
}

/**
 * Platform-agnostic error for entity collection operations.
 */
export interface EntityCollectionError {
  code:
    | "COLLECTION_NOT_AVAILABLE" // Platform not initialized
    | "ENTITY_NOT_FOUND" // Specific entity not found
    | "INVALID_ENTITY_DATA" // Entity data corrupted
    | "INVALID_QUERY" // Search query invalid
    | "PLATFORM_ERROR"; // Generic platform error
  message: string;
  details?: unknown;
}
