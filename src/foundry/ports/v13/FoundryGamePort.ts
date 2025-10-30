import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import { tryCatch } from "@/utils/result";

/**
 * v13 implementation of FoundryGame interface.
 * Encapsulates Foundry v13-specific game API access.
 */
export class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], string> {
    return tryCatch(
      () => {
        debugger;
        if (!game?.journal) {
          throw new Error("game.journal is not available");
        }
        const collection = game.journal as any;
        const entries = Array.isArray(collection)
          ? (collection as unknown as FoundryJournalEntry[]).slice()
          : Array.from(collection.contents ?? []);
        return entries as FoundryJournalEntry[];
      },
      (error) =>
        `Failed to get journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, string> {
    return tryCatch(
      () => {
        if (!game?.journal) {
          throw new Error("game.journal is not available");
        }
        const entry = game.journal.get(id);
        return (entry as FoundryJournalEntry | undefined) ?? null;
      },
      (error) =>
        `Failed to get journal entry by ID ${id}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
