import type { Result } from "@/domain/types/result";
import type { FoundryGame } from "../../interfaces/FoundryGame";
import type { FoundryJournalEntry } from "../../types";
import type { FoundryError } from "../../errors/FoundryErrors";
import { tryCatch, err } from "@/domain/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { validateJournalEntries } from "../../validation/schemas";
import { validateJournalId } from "../../validation/input-validators";
import { APP_DEFAULTS } from "@/application/constants/app-constants";

/**
 * v13 implementation of FoundryGame interface.
 * Encapsulates Foundry v13-specific game API access.
 *
 * Performance optimization: Caches validated journal entries with TTL-based invalidation
 * to avoid expensive Valibot validation on every call. Cache expires after 5 seconds.
 */
export class FoundryV13GamePort implements FoundryGame {
  #disposed = false;
  private cachedEntries: FoundryJournalEntry[] | null = null;
  private lastCheckTimestamp = 0;
  private readonly cacheTtlMs = APP_DEFAULTS.CACHE_TTL_MS;

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entries on disposed port"));
    }
    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }

    const now = Date.now();
    const cacheAge = now - this.lastCheckTimestamp;

    // Check TTL-based cache validity
    if (this.cachedEntries !== null && cacheAge < this.cacheTtlMs) {
      // Cache hit - return cached entries
      return { ok: true, value: this.cachedEntries };
    }

    // Cache miss - fetch fresh entries

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

    // Validate entries to ensure they have expected structure (expensive, cached for TTL duration)
    // IMPORTANT: Use validation as guard only, keep original Foundry objects with prototypes
    const validationResult = validateJournalEntries(entries.value);
    if (!validationResult.ok) {
      // Return validation error directly (preserves VALIDATION_FAILED code and details)
      return validationResult;
    }

    // Update cache with ORIGINAL entries (preserving Foundry prototypes like sheet.render, update, etc.)
    // Do NOT cache validationResult.value as it strips prototypes
    this.cachedEntries = entries.value;
    this.lastCheckTimestamp = now;

    return { ok: true, value: this.cachedEntries };
  }

  /**
   * Invalidates the journal entries cache.
   * Forces the next getJournalEntries() call to fetch and validate fresh data.
   */
  invalidateCache(): void {
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot get journal entry on disposed port"));
    }
    // Validate input
    const validationResult = validateJournalId(id);
    if (!validationResult.ok) {
      return validationResult;
    }

    if (typeof game === "undefined" || !game?.journal) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry game API not available"));
    }

    return tryCatch(
      () => {
        // game.journal.get() is typed by fvtt-types and returns JournalEntry | undefined
        const entry = game.journal.get(validationResult.value);
        return entry ?? null;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to get journal entry by ID ${validationResult.value}`,
          { id: validationResult.value },
          error
        )
    );
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // Invalidate cache on disposal
    this.cachedEntries = null;
    this.lastCheckTimestamp = 0;
  }
}
