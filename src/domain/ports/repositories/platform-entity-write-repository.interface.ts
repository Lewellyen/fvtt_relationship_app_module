import type { Result } from "@/domain/types/result";
import type {
  CreateEntityData,
  EntityChanges,
  EntityRepositoryError,
} from "./platform-entity-repository.types";

/**
 * Generic port for write-only entity repository operations.
 *
 * Provides create, update, delete, and flag operations for entities.
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 *
 * @template TEntity - The entity type this repository manages
 *
 * @example
 * ```typescript
 * // Write-only Journal Repository
 * interface PlatformJournalWriteRepository extends PlatformEntityWriteRepository<JournalEntry> {}
 * ```
 */
export interface PlatformEntityWriteRepository<TEntity> {
  // ===== CREATE Operations =====

  /**
   * Create a new entity.
   *
   * Platform mappings:
   * - Foundry: JournalEntry.create(data)
   * - Roll20: createObj("handout", data)
   * - CSV: writeFile(newId.json, data)
   *
   * @param data - Entity data to create
   * @returns Created entity or error
   */
  create(data: CreateEntityData<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;

  /**
   * Create multiple entities in a batch operation.
   *
   * Performance optimization: Create multiple entities at once.
   * Platform implementations can optimize this (e.g., transaction).
   *
   * @param data - Array of entity data to create
   * @returns Array of created entities or error
   */
  createMany(data: CreateEntityData<TEntity>[]): Promise<Result<TEntity[], EntityRepositoryError>>;

  // ===== UPDATE Operations =====

  /**
   * Update an existing entity.
   *
   * Platform mappings:
   * - Foundry: entry.update(changes)
   * - Roll20: getObj(...).set(changes)
   * - CSV: readFile + merge + writeFile
   *
   * **Deleting Properties:**
   * To delete a **normal property**, use the special `-=` notation in the key name.
   * Foundry VTT uses differences and merges, so a special notation is needed to signal
   * that a value is being intentionally deleted (omitting a value means "don't update").
   *
   * **Syntax:** `'propertyName.-=key': null` or `'system.-=key': null` for nested properties.
   * The `-=` before the key signals the database to delete the key.
   *
   * **Important:**
   * - For **normal properties**: Use `'propertyName.-=key': null` syntax
   * - For **flags**: Use `unsetFlag()` (recommended) or `'flags.scope.-=key': null`
   * - For **arrays**: Arrays must be written as a cohesive whole (cannot modify specific indexes)
   *
   * @example
   * ```typescript
   * // Delete a top-level property using -= notation
   * await repository.update("journal-1", {
   *   'description.-=': null  // Deletes the 'description' property
   * });
   *
   * // Delete a nested property (e.g., in system object)
   * await repository.update("journal-1", {
   *   'system.-=key': null  // Deletes system.key
   * });
   *
   * // Update and delete in one call
   * await repository.update("journal-1", {
   *   name: "New Name",
   *   'description.-=': null  // Delete description
   * });
   *
   * // Working with arrays: must write the entire array
   * const currentEntity = await repository.getById("journal-1");
   * const updatedArray = [...currentEntity.value.items, newItem];  // Edit copy
   * await repository.update("journal-1", {
   *   items: updatedArray  // Write entire array
   * });
   * ```
   *
   * @param id - Entity ID
   * @param changes - Partial entity data to update (use `null` to delete properties)
   * @returns Updated entity or error
   */
  update(
    id: string,
    changes: EntityChanges<TEntity>
  ): Promise<Result<TEntity, EntityRepositoryError>>;

  /**
   * Update multiple entities in a batch operation.
   *
   * Performance optimization: Update multiple entities at once.
   *
   * @param updates - Array of { id, changes } pairs
   * @returns Array of updated entities or error
   */
  updateMany(
    updates: Array<{ id: string; changes: EntityChanges<TEntity> }>
  ): Promise<Result<TEntity[], EntityRepositoryError>>;

  /**
   * Partial update (alias for update with clearer semantics).
   *
   * @param id - Entity ID
   * @param partial - Partial entity data
   * @returns Updated entity or error
   */
  patch(id: string, partial: Partial<TEntity>): Promise<Result<TEntity, EntityRepositoryError>>;

  /**
   * Upsert: Create if not exists, update if exists.
   *
   * Convenience method that combines create/update logic.
   *
   * @param id - Entity ID (used for existence check)
   * @param data - Entity data (used for both create and update)
   * @returns Created or updated entity or error
   */
  upsert(
    id: string,
    data: CreateEntityData<TEntity>
  ): Promise<Result<TEntity, EntityRepositoryError>>;

  // ===== DELETE Operations =====

  /**
   * Delete an entity.
   *
   * Platform mappings:
   * - Foundry: entry.delete()
   * - Roll20: getObj(...).remove()
   * - CSV: unlink(id.json)
   *
   * @param id - Entity ID
   * @returns Success or error
   */
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Delete multiple entities in a batch operation.
   *
   * Performance optimization: Delete multiple entities at once.
   *
   * @param ids - Array of entity IDs to delete
   * @returns Success or error
   */
  deleteMany(ids: string[]): Promise<Result<void, EntityRepositoryError>>;

  // ===== Flag Convenience Methods =====

  /**
   * Get a flag value from an entity.
   *
   * Convenience wrapper around getById() + flag access.
   *
   * @param id - Entity ID
   * @param scope - Flag scope (e.g., module ID)
   * @param key - Flag key
   * @returns Flag value or null if not set, or error
   */
  getFlag(id: string, scope: string, key: string): Result<unknown | null, EntityRepositoryError>;

  /**
   * Set a flag value on an entity.
   *
   * Convenience method that abstracts platform-specific flag handling.
   * In Foundry, this uses document.setFlag() (not update()).
   *
   * @param id - Entity ID
   * @param scope - Flag scope (e.g., module ID)
   * @param key - Flag key
   * @param value - Flag value to set
   * @returns Success or error
   */
  setFlag(
    id: string,
    scope: string,
    key: string,
    value: unknown
  ): Promise<Result<void, EntityRepositoryError>>;

  /**
   * Unset (remove) a flag value from an entity.
   *
   * Convenience method that abstracts platform-specific flag handling.
   * In Foundry, this uses `document.unsetFlag()` (recommended) or the equivalent
   * `update({'flags.scope.-=key': null})` syntax.
   *
   * **Foundry VTT Flag Deletion:**
   * - Recommended: `document.unsetFlag(scope, key)` - includes safety checks
   * - Alternative: `document.update({'flags.scope.-=key': null})` - less safe
   *
   * This method uses the recommended `unsetFlag()` approach.
   *
   * @param id - Entity ID
   * @param scope - Flag scope (e.g., module ID)
   * @param key - Flag key to remove
   * @returns Success or error
   *
   * @example
   * ```typescript
   * // Delete a flag (recommended way)
   * await repository.unsetFlag("journal-1", "myModule", "hidden");
   *
   * // Equivalent Foundry call (not recommended, but possible):
   * // await document.update({'flags.myModule.-=hidden': null});
   * ```
   */
  unsetFlag(id: string, scope: string, key: string): Promise<Result<void, EntityRepositoryError>>;
}
