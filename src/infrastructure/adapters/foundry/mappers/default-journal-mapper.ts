import type { JournalMapper } from "./journal-mapper.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

/**
 * Default mapper for Foundry journal entries.
 *
 * Handles the standard mapping: id and name fields.
 * This is the fallback mapper that should be registered last in the registry
 * (lowest priority) to handle standard journal entries.
 *
 * Conversion rules:
 * - `id` is copied as-is
 * - `name` is converted: `undefined` → `null` (domain requires `string | null`)
 */
export class DefaultJournalMapper implements JournalMapper {
  /**
   * Type guard: checks if entity is a Foundry journal entry.
   *
   * Supports any object with an `id` property (basic check).
   * More specific mappers should be registered before this one.
   *
   * @param entity - The entity to check
   * @returns True if entity has id property
   */
  supports(entity: unknown): entity is FoundryJournalEntry {
    return (
      typeof entity === "object" &&
      entity !== null &&
      "id" in entity &&
      typeof (entity as { id: unknown }).id === "string"
    );
  }

  /**
   * Maps a Foundry journal entry to a domain journal entry.
   *
   * @param entity - The Foundry journal entry
   * @returns The domain journal entry
   */
  toDomain(entity: FoundryJournalEntry): JournalEntry {
    return {
      id: entity.id,
      name: entity.name ?? null,
    };
  }
}
