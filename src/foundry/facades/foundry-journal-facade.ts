/**
 * Implementation of FoundryJournalFacade.
 *
 * Combines FoundryGame, FoundryDocument, and FoundryUI services
 * into a unified facade for journal operations.
 */

import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryJournalFacade as IFoundryJournalFacade } from "./foundry-journal-facade.interface";
import { foundryGameToken, foundryDocumentToken, foundryUIToken } from "@/foundry/foundrytokens";
import { MODULE_CONSTANTS } from "@/constants";
import { castFoundryDocumentForFlag } from "@/foundry/runtime-casts";
import * as v from "valibot";

/**
 * Facade for journal-related Foundry operations.
 *
 * **Benefits:**
 * - Reduces JournalVisibilityService dependencies from 4 to 2 (facade + logger)
 * - Provides cohesive journal-specific API
 * - Easier to test (single facade mock instead of 3 service mocks)
 * - Clear boundary for journal-related operations
 */
export class FoundryJournalFacade implements IFoundryJournalFacade {
  constructor(
    private readonly game: FoundryGame,
    private readonly document: FoundryDocument,
    private readonly ui: FoundryUI
  ) {}

  /**
   * Get all journal entries from Foundry.
   *
   * Delegates to FoundryGame.getJournalEntries().
   */
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    return this.game.getJournalEntries();
  }

  /**
   * Get a module flag from a journal entry with runtime validation.
   *
   * Delegates to FoundryDocument.getFlag() with module scope and schema.
   *
   * @template T - The flag value type
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param schema - Valibot schema for validation
   */
  getEntryFlag<T>(
    entry: FoundryJournalEntry,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError> {
    // Type widening: fvtt-types JournalEntry.getFlag has overly restrictive scope type ("core" only),
    // but module flags use module ID as scope. Cast to generic interface is safe.
    return this.document.getFlag<T>(
      castFoundryDocumentForFlag(entry),
      MODULE_CONSTANTS.MODULE.ID,
      key,
      schema
    );
  }

  /**
   * Remove a journal element from the UI.
   *
   * Delegates to FoundryUI.removeJournalElement().
   *
   * @param id - Journal entry ID
   * @param name - Journal entry name (for logging)
   * @param html - HTML container element
   */
  removeJournalElement(id: string, name: string, html: HTMLElement): Result<void, FoundryError> {
    return this.ui.removeJournalElement(id, name, html);
  }
}

export class DIFoundryJournalFacade extends FoundryJournalFacade {
  static dependencies = [foundryGameToken, foundryDocumentToken, foundryUIToken] as const;

  constructor(game: FoundryGame, document: FoundryDocument, ui: FoundryUI) {
    super(game, document, ui);
  }
}
