/**
 * Shared types for entity repository interfaces.
 *
 * These types are used by both read and write repository interfaces
 * to avoid circular dependencies.
 */

/**
 * Data required to create a new entity.
 * Typically omits auto-generated fields like id, createdAt, etc.
 */
export type CreateEntityData<TEntity> = Omit<TEntity, "id" | "createdAt" | "updatedAt">;

/**
 * Partial entity data for updates.
 * Only includes fields that should be changed.
 */
export type EntityChanges<TEntity> = Partial<TEntity>;

/**
 * Platform-agnostic error for entity repository operations.
 */
export interface EntityRepositoryError {
  code:
    | "COLLECTION_NOT_AVAILABLE" // Platform not initialized
    | "ENTITY_NOT_FOUND" // Entity not found for update/delete
    | "ENTITY_ALREADY_EXISTS" // Entity already exists (for create)
    | "INVALID_ENTITY_DATA" // Entity data invalid
    | "VALIDATION_FAILED" // Entity validation failed
    | "OPERATION_FAILED" // Generic operation failure
    | "PLATFORM_ERROR"; // Generic platform error
  message: string;
  details?: unknown;
}
