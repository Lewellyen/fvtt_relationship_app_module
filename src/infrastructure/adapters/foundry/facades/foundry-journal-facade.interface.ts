/**
 * Facade interface for journal-related Foundry operations.
 *
 * Groups related Foundry services to reduce dependency counts.
 *
 * **Design Rationale:**
 * - Facade Pattern: Simplified interface to complex subsystem
 * - Reduces dependency count from 3 (Game, Document, UI) to 1
 * - Provides journal-specific operations only
 * - Easier to mock in tests
 *
 * @see FoundryJournalFacade for implementation
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";
import type * as v from "valibot";

/**
 * Facade for journal-related Foundry operations.
 *
 * Combines operations from FoundryGame, FoundryDocument, and FoundryUI
 * into a single, cohesive interface for journal management.
 *
 * @example
 * ```typescript
 * const facade = container.resolve(foundryJournalFacadeToken);
 * const entries = facade.getJournalEntries();
 * if (entries.ok) {
 *   for (const entry of entries.value) {
 *     const hidden = facade.getEntryFlag<boolean>(entry, 'hidden');
 *     if (hidden.ok && hidden.value) {
 *       facade.removeJournalElement(entry.id, entry.name, htmlElement);
 *     }
 *   }
 * }
 * ```
 */
export interface FoundryJournalFacade {
  /**
   * Get all journal entries from Foundry.
   */
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;

  /**
   * Get a module flag from a journal entry with runtime validation.
   *
   * @template T - The flag value type
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param schema - Valibot schema for runtime validation
   */
  getEntryFlag<T>(
    entry: FoundryJournalEntry,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError>;

  /**
   * Remove a journal element from the UI.
   *
   * @param id - Journal entry ID
   * @param name - Journal entry name (for logging)
   * @param html - HTML container element
   */
  removeJournalElement(id: string, name: string, html: HTMLElement): Result<void, FoundryError>;

  /**
   * Set a module flag on a journal entry.
   *
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param value - The boolean value to set
   * @returns Result indicating success or error
   */
  setEntryFlag(
    entry: FoundryJournalEntry,
    key: string,
    value: boolean
  ): Promise<Result<void, FoundryError>>;
}
