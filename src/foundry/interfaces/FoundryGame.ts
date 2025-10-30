import type { Result } from "@/types/result";
import type { FoundryJournalEntry } from "../types";

/**
 * Interface for accessing Foundry's game object functionality.
 * Abstracts access to game collections like journals, actors, etc.
 */
export interface FoundryGame {
  /**
   * Gets all journal entries.
   * @returns Result containing all journal entries or an error message
   */
  getJournalEntries(): Result<FoundryJournalEntry[], string>;

  /**
   * Gets a journal entry by its ID.
   * @param id - The ID of the journal entry
   * @returns Result containing the journal entry or null if not found, or an error message
   */
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, string>;
}
