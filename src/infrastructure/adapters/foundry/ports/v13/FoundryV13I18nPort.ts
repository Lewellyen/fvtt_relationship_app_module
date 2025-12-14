import type { Result } from "@/domain/types/result";
import type { FoundryI18n } from "../../interfaces/FoundryI18n";
import type { FoundryError } from "../../errors/FoundryErrors";
import type { IFoundryI18nAPI } from "../../api/foundry-api.interface";
import { ok } from "@/domain/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";

/**
 * Foundry VTT v13+ implementation of the i18n interface.
 *
 * Wraps `game.i18n` API with Result pattern for type-safe error handling.
 *
 * Uses dependency injection for Foundry APIs to improve testability.
 *
 * @implements {FoundryI18n}
 */
export class FoundryV13I18nPort implements FoundryI18n {
  #disposed = false;
  static dependencies = [] as const;

  constructor(private readonly foundryAPI: IFoundryI18nAPI | null) {}

  /**
   * Localizes a translation key using Foundry's i18n system.
   *
   * @param key - Translation key
   * @returns Result with translated string (returns key itself if not found)
   */
  localize(key: string): Result<string, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot localize on disposed port", { key }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return ok(key); // Graceful degradation: return key as-is
      }

      const translated = this.foundryAPI.localize(key);
      return ok(translated);
    } catch {
      return ok(key); // Fallback: return key on error
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
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot format translation on disposed port", {
          key,
        }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return ok(key); // Graceful degradation
      }

      // Convert unknown values to strings for Foundry's type requirements
      const stringData: Record<string, string> = {};
      for (const [k, v] of Object.entries(data)) {
        stringData[k] = String(v);
      }

      const formatted = this.foundryAPI.format(key, stringData);
      return ok(formatted);
    } catch {
      return ok(key); // Fallback: return key on error
    }
  }

  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean indicating existence
   */
  has(key: string): Result<boolean, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot check translation key on disposed port", {
          key,
        }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return ok(false); // No game.i18n available → key doesn't exist
      }

      const exists = this.foundryAPI.has(key);
      return ok(exists);
    } catch {
      return ok(false); // Fallback: assume key doesn't exist on error
    }
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}

/**
 * Factory function to create FoundryV13I18nPort instance for production use.
 * Injects real Foundry i18n API.
 *
 * @returns FoundryV13I18nPort instance
 */
export function createFoundryV13I18nPort(): FoundryV13I18nPort {
  if (typeof game === "undefined" || !game?.i18n) {
    // Return port with null API for graceful degradation
    return new FoundryV13I18nPort(null);
  }

  return new FoundryV13I18nPort({
    localize: (key: string) => game.i18n.localize(key),
    format: (key: string, data: Record<string, string>) => game.i18n.format(key, data),
    has: (key: string) => game.i18n.has(key),
  });
}
