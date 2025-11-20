import type { Result } from "@/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";

/**
 * Port for journal visibility operations.
 *
 * Abstraction that allows the domain to work with journal entries
 * without knowing about the underlying platform (Foundry).
 *
 * Implementations should be placed in platform-specific adapters
 * (e.g., foundry/adapters/FoundryJournalVisibilityAdapter).
 */
export interface JournalVisibilityPort {
  /**
   * Gets all journal entries from the platform.
   * @returns Result with array of journal entries or error
   */
  getAllEntries(): Result<JournalEntry[], JournalVisibilityError>;

  /**
   * Reads a boolean flag from a journal entry.
   * @param entry - The journal entry
   * @param flagKey - The flag key to read
   * @returns Result with flag value (null if not set) or error
   */
  getEntryFlag(
    entry: JournalEntry,
    flagKey: string
  ): Result<boolean | null, JournalVisibilityError>;

  /**
   * Removes a journal entry from the DOM.
   * @param entryId - The journal entry ID
   * @param entryName - The journal entry name (for logging)
   * @param htmlElement - The HTML container element
   * @returns Result indicating success or error
   */
  removeEntryFromDOM(
    entryId: string,
    entryName: string | null,
    htmlElement: HTMLElement
  ): Result<void, JournalVisibilityError>;
}
