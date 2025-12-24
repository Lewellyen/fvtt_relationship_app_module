import type { PlatformEntityReadRepository } from "./platform-entity-read-repository.interface";
import type { PlatformEntityWriteRepository } from "./platform-entity-write-repository.interface";

// Re-export types for backward compatibility
export type {
  CreateEntityData,
  EntityChanges,
  EntityRepositoryError,
} from "./platform-entity-repository.types";

/**
 * Generic port for entity repository with full CRUD operations.
 *
 * Combines read and write repository operations.
 * Extends both PlatformEntityReadRepository and PlatformEntityWriteRepository.
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 *
 * @template TEntity - The entity type this repository manages
 *
 * @example
 * ```typescript
 * // Journal Repository
 * interface PlatformJournalRepository extends PlatformEntityRepository<JournalEntry> {}
 *
 * // Actor Repository
 * interface ActorRepository extends PlatformEntityRepository<Actor> {}
 * ```
 */
export interface PlatformEntityRepository<TEntity>
  extends PlatformEntityReadRepository<TEntity>, PlatformEntityWriteRepository<TEntity> {
  // Kombiniert Read- und Write-Operationen
  // Alle Methoden werden von den erweiterten Interfaces geerbt
}
