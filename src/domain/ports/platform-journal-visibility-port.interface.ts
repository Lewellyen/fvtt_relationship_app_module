import type { Result } from "@/domain/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";

/**
 * Port for journal visibility operations.
 *
 * Abstraction that allows the domain to work with journal entries
 * without knowing about the underlying platform (Foundry).
 *
 * Implementations should be placed in platform-specific adapters
 * (e.g., foundry/adapters/FoundryJournalVisibilityAdapter).
 */
export interface PlatformJournalVisibilityPort {
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
   * Sets a boolean flag on a journal entry.
   * @param entry - The journal entry
   * @param flagKey - The flag key to set
   * @param value - The boolean value to set
   * @returns Result indicating success or error
   */
  setEntryFlag(
    entry: JournalEntry,
    flagKey: string,
    value: boolean
  ): Promise<Result<void, JournalVisibilityError>>;
}
