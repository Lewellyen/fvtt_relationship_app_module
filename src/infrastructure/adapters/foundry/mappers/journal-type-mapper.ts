import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";

/**
 * Interface for journal type mapping operations.
 * Maps between Foundry-specific types and domain types.
 */
export interface IJournalTypeMapper {
  /**
   * Maps a Foundry journal entry to a domain journal entry.
   * @param foundry - The Foundry journal entry
   * @returns The domain journal entry
   */
  mapFoundryToDomain(foundry: FoundryJournalEntry): JournalEntry;

  /**
   * Maps a domain journal entry to a Foundry journal entry structure.
   * Note: This is primarily for data transformation, not for creating Foundry documents.
   * @param domain - The domain journal entry
   * @returns A Foundry-compatible journal entry structure
   */
  mapDomainToFoundry(domain: JournalEntry): Partial<FoundryJournalEntry>;
}

/**
 * Mapper for converting between Foundry journal entries and domain journal entries.
 *
 * Handles type conversion and null/undefined handling according to domain rules.
 */
export class JournalTypeMapper implements IJournalTypeMapper {
  /**
   * Maps a Foundry journal entry to a domain journal entry.
   *
   * Conversion rules:
   * - `id` is copied as-is
   * - `name` is converted: `undefined` → `null` (domain requires `string | null`)
   *
   * @param foundry - The Foundry journal entry
   * @returns The domain journal entry
   */
  mapFoundryToDomain(foundry: FoundryJournalEntry): JournalEntry {
    return {
      id: foundry.id,
      name: foundry.name ?? null,
    };
  }

  /**
   * Maps a domain journal entry to a Foundry journal entry structure.
   *
   * Note: This is primarily for data transformation purposes.
   * For creating Foundry documents, use FoundryDocument.create() directly.
   *
   * @param domain - The domain journal entry
   * @returns A Foundry-compatible journal entry structure
   */
  mapDomainToFoundry(domain: JournalEntry): Partial<FoundryJournalEntry> {
    const result: Partial<FoundryJournalEntry> = {
      id: domain.id,
    };
    if (domain.name !== null) {
      result.name = domain.name;
    }
    return result;
  }
}
