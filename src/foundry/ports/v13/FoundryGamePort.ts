import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { tryCatch, err } from "@/utils/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { validateJournalEntries } from "@/foundry/validation/schemas";

/**
 * v13 implementation of FoundryGame interface.
 * Encapsulates Foundry v13-specific game API access.
 */
export class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    return tryCatch(
      () => {
        // game.journal is typed as DocumentCollection<JournalEntry> by fvtt-types
        // DocumentCollection.contents is an array of the stored documents
        const entries = Array.from(game.journal.contents);

        // Validate entries to ensure they have expected structure
        const validationResult = validateJournalEntries(entries);
        if (!validationResult.ok) {
          throw new Error(validationResult.error.message);
        }

        return entries;
      },
      (error) =>
        createFoundryError("OPERATION_FAILED", "Failed to get journal entries", undefined, error)
    );
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError> {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }
    return tryCatch(
      () => {
        // game.journal.get() is typed by fvtt-types and returns JournalEntry | undefined
        const entry = game.journal.get(id);
        return entry ?? null;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to get journal entry by ID ${id}`,
          { id },
          error
        )
    );
  }
}
