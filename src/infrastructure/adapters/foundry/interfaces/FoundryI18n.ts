import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for Foundry's internationalization (i18n) API.
 *
 * Wraps Foundry VTT's `game.i18n` API to enable:
 * - Port-Adapter pattern for version compatibility
 * - Testability without Foundry runtime
 * - Result-pattern instead of exceptions
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.com/api/Localization.html
 */
export interface FoundryI18n extends Disposable {
  /**
   * Localize a string using Foundry's translation system.
   *
   * @param key - Translation key (e.g., "MODULE.SETTINGS.logLevel.name")
   * @returns Result with translated string or error if key not found
   *
   * @example
   * ```typescript
   * const result = i18n.localize("MODULE.SETTINGS.logLevel.name");
   * if (result.ok) {
   *   console.log(result.value); // "Enable Feature" (or translated version)
   * }
   * ```
   */
  localize(key: string): Result<string, FoundryError>;

  /**
   * Format a string with placeholders using Foundry's i18n system.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string or error
   *
   * @example
   * ```typescript
   * // Translation: "Welcome, {name}!"
   * const result = i18n.format("MODULE.WELCOME", { name: "Alice" });
   * if (result.ok) {
   *   console.log(result.value); // "Welcome, Alice!"
   * }
   * ```
   */
  format(key: string, data: Record<string, unknown>): Result<string, FoundryError>;

  /**
   * Check if a translation key exists in Foundry's i18n system.
   *
   * @param key - Translation key to check
   * @returns Result with boolean indicating if key exists
   *
   * @example
   * ```typescript
   * const result = i18n.has("MODULE.SETTINGS.logLevel.name");
   * if (result.ok && result.value) {
   *   // Key exists, safe to localize
   * }
   * ```
   */
  has(key: string): Result<boolean, FoundryError>;
}
