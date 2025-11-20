import type { Result } from "@/domain/types/result";
import type { FoundryJournalEntry } from "../types";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for accessing Foundry's game object functionality.
 * Abstracts access to game collections like journals, actors, etc.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 */
export interface FoundryGame extends Disposable {
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

  /**
   * Invalidates the journal entries cache.
   * Forces the next getJournalEntries() call to fetch fresh data.
   */
  invalidateCache(): void;
}
