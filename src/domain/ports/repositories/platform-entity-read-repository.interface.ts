import type { PlatformEntityCollectionPort } from "../collections/platform-entity-collection-port.interface";

/**
 * Generic port for read-only entity repository access.
 *
 * Extends collection port with read-only operations.
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 *
 * @template TEntity - The entity type this repository manages
 *
 * @example
 * ```typescript
 * // Read-only Journal Repository
 * interface PlatformJournalReadRepository extends PlatformEntityReadRepository<JournalEntry> {}
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PlatformEntityReadRepository<
  TEntity,
> extends PlatformEntityCollectionPort<TEntity> {
  // Nur Read-Operationen (geerbt von PlatformEntityCollectionPort)
  // getAll(), getById(), getByIds(), exists(), count(), search(), query()
}
