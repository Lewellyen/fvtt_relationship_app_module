import type { Result } from "@/types/result";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { ok } from "@/utils/result";

/**
 * Foundry VTT v13+ implementation of the i18n interface.
 *
 * Wraps `game.i18n` API with Result pattern for type-safe error handling.
 *
 * @implements {FoundryI18n}
 */
export class FoundryI18nPortV13 implements FoundryI18n {
  static dependencies = [] as const;

  /**
   * Localizes a translation key using Foundry's i18n system.
   *
   * @param key - Translation key
   * @returns Result with translated string (returns key itself if not found)
   */
  localize(key: string): Result<string, FoundryError> {
    try {
      /* c8 ignore start -- Requires Foundry game globals; tested in integration tests */
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key); // Graceful degradation: return key as-is
      }
      /* c8 ignore stop */

      /* c8 ignore next -- Foundry API call; tested in integration tests */
      const translated = game.i18n.localize(key);
      return ok(translated);
    } catch {
      /* c8 ignore start -- Defensive error handling; game.i18n.localize rarely throws */
      return ok(key); // Fallback: return key on error
      /* c8 ignore stop */
    }
  }

  /**
   * Formats a translation key with placeholder values.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
   */
  format(key: string, data: Record<string, unknown>): Result<string, FoundryError> {
    try {
      /* c8 ignore start -- Requires Foundry game globals; tested in integration tests */
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(key); // Graceful degradation
      }
      /* c8 ignore stop */

      // Convert unknown values to strings for Foundry's type requirements
      const stringData: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = String(v);
      }

      /* c8 ignore next -- Foundry API call; tested in integration tests */
      const formatted = game.i18n.format(key, stringData);
      return ok(formatted);
    } catch {
      /* c8 ignore start -- Defensive error handling; game.i18n.format rarely throws */
      return ok(key); // Fallback: return key on error
      /* c8 ignore stop */
    }
  }

  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean indicating existence
   */
  has(key: string): Result<boolean, FoundryError> {
    try {
      /* c8 ignore start -- Requires Foundry game globals; tested in integration tests */
      if (typeof game === "undefined" || !game?.i18n) {
        return ok(false); // No game.i18n available → key doesn't exist
      }
      /* c8 ignore stop */

      /* c8 ignore next -- Foundry API call; tested in integration tests */
      const exists = game.i18n.has(key);
      return ok(exists);
    } catch {
      /* c8 ignore start -- Defensive error handling */
      return ok(false); // Fallback: assume key doesn't exist on error
      /* c8 ignore stop */
    }
  }
}
