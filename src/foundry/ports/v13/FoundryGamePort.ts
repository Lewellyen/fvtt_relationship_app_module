import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import { tryCatch, err } from "@/utils/result";

/**
 * v13 implementation of FoundryGame interface.
 * Encapsulates Foundry v13-specific game API access.
 */
export class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], string> {
    if (typeof game === "undefined" || !game?.journal) {
      return err("Foundry game API not available");
    }
    return tryCatch(
      () => {
        // game.journal is typed as DocumentCollection<JournalEntry> by fvtt-types
        // DocumentCollection.contents is an array of the stored documents
        const entries = Array.from(game.journal.contents);
        return entries;
      },
      (error) =>
        `Failed to get journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, string> {
    if (typeof game === "undefined" || !game?.journal) {
      return err("Foundry game API not available");
    }
    return tryCatch(
      () => {
        // game.journal.get() is typed by fvtt-types and returns JournalEntry | undefined
        const entry = game.journal.get(id);
        return entry ?? null;
      },
      (error) =>
        `Failed to get journal entry by ID ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
