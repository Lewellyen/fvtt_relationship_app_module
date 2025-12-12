import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

/**
 * Interface for mapping Foundry journal entries to domain journal entries.
 *
 * Follows the Strategy Pattern to enable extensible mapping logic.
 * Each mapper can support different Foundry entity variants (e.g., folders, flags, custom fields).
 *
 * @example
 * ```typescript
 * class DefaultJournalMapper implements JournalMapper {
 *   supports(entity: unknown): entity is FoundryJournalEntry {
 *     return typeof entity === "object" && entity !== null && "id" in entity;
 *   }
 *
 *   toDomain(entity: FoundryJournalEntry): JournalEntry {
 *     return { id: entity.id, name: entity.name ?? null };
 *   }
 * }
 * ```
 */
export interface JournalMapper {
  /**
   * Type guard that determines if this mapper can handle the given entity.
   *
   * @param entity - The Foundry entity to check
   * @returns True if this mapper supports the entity, false otherwise
   */
  supports(entity: unknown): entity is FoundryJournalEntry;

  /**
   * Maps a Foundry journal entry to a domain journal entry.
   *
   * This method is only called if `supports()` returned true for the entity.
   * The mapper is responsible for extracting and transforming all relevant fields.
   *
   * @param entity - The Foundry journal entry (guaranteed to pass supports() check)
   * @returns The domain journal entry
   */
  toDomain(entity: FoundryJournalEntry): JournalEntry;
}
