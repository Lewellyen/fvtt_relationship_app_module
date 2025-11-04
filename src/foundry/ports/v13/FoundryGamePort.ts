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
 *
 * Performance optimization: Caches validated journal entries to avoid expensive
 * Zod validation on every call. Cache is invalidated when journal collection changes.
 */
export class FoundryGamePortV13 implements FoundryGame {
  private cachedEntries: FoundryJournalEntry[] | null = null;
  private cacheVersion = -1;

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }

    // Check if cache is valid
    // Use timestamp as version if _source.version is not available
    const currentVersion = (game.journal as any)._source?.version ?? Date.now();
    if (this.cachedEntries !== null && this.cacheVersion === currentVersion) {
      return { ok: true, value: this.cachedEntries };
    }

    // game.journal is typed as DocumentCollection<JournalEntry> by fvtt-types
    // DocumentCollection.contents is an array of the stored documents
    const entries = tryCatch(
      () => Array.from(game.journal.contents),
      (error) =>
        createFoundryError("OPERATION_FAILED", "Failed to access journal entries", undefined, error)
    );

    if (!entries.ok) {
      return entries;
    }

    // Validate entries to ensure they have expected structure (expensive, only once per version)
    const validationResult = validateJournalEntries(entries.value);
    if (!validationResult.ok) {
      // Return validation error directly (preserves VALIDATION_FAILED code and details)
      return validationResult;
    }

    // Update cache
    this.cachedEntries = validationResult.value as FoundryJournalEntry[];
    this.cacheVersion = currentVersion;

    return { ok: true, value: this.cachedEntries };
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
