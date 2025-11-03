import type { Result } from "@/types/result";
import type { FoundryJournalEntry } from "../types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Interface for accessing Foundry's game object functionality.
 * Abstracts access to game collections like journals, actors, etc.
 */
export interface FoundryGame {
  /**
   * Gets all journal entries.
   * @returns Result containing all journal entries or a FoundryError
   */
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;

  /**
   * Gets a journal entry by its ID.
   * @param id - The ID of the journal entry
   * @returns Result containing the journal entry or null if not found, or a FoundryError
   */
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError>;
}
