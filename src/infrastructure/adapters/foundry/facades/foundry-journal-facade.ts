/**
 * Implementation of FoundryJournalFacade.
 *
 * Combines FoundryGame, FoundryDocument, and FoundryUI services
 * into a unified facade for journal operations.
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { FoundryJournalEntry } from "../types";
import type { FoundryGame } from "../interfaces/FoundryGame";
import type { FoundryDocument } from "../interfaces/FoundryDocument";
import type { FoundryUI } from "../interfaces/FoundryUI";
import type { FoundryJournalFacade as IFoundryJournalFacade } from "./foundry-journal-facade.interface";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { moduleIdToken } from "@/infrastructure/shared/tokens/infrastructure/module-id.token";
import { castFoundryDocumentForFlag } from "@/infrastructure/adapters/foundry/runtime-casts";
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
    private readonly ui: FoundryUI,
    private readonly moduleId: string
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
    const documentResult = castFoundryDocumentForFlag(entry);
    if (!documentResult.ok) {
      return documentResult; // Propagate error
    }
    return this.document.getFlag<T>(documentResult.value, this.moduleId, key, schema);
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

  /**
   * Set a module flag on a journal entry.
   *
   * Delegates to FoundryDocument.setFlag() with module scope.
   *
   * @param entry - The Foundry journal entry
   * @param key - The flag key
   * @param value - The boolean value to set
   * @returns Result indicating success or error
   */
  async setEntryFlag(
    entry: FoundryJournalEntry,
    key: string,
    value: boolean
  ): Promise<Result<void, FoundryError>> {
    const documentResult = castFoundryDocumentForFlag(entry);
    if (!documentResult.ok) {
      return documentResult; // Propagate error
    }
    return await this.document.setFlag(documentResult.value, this.moduleId, key, value);
  }
}

export class DIFoundryJournalFacade extends FoundryJournalFacade {
  static dependencies = [
    foundryGameToken,
    foundryDocumentToken,
    foundryUIToken,
    moduleIdToken,
  ] as const;

  constructor(game: FoundryGame, document: FoundryDocument, ui: FoundryUI, moduleId: string) {
    super(game, document, ui, moduleId);
  }
}
