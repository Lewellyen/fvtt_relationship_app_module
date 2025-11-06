import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import type { LocalI18nService } from "@/services/LocalI18nService";
import { foundryI18nToken, localI18nToken } from "@/tokens/tokenindex";

/**
 * Facade service that combines Foundry's i18n and local fallback translations.
 *
 * **Strategy: Foundry-First with Fallback**
 * 1. Try Foundry's `game.i18n` (if available and key exists)
 * 2. Fall back to local JSON-based translations
 * 3. Final fallback: return key itself or provided fallback string
 *
 * **Use Cases:**
 * - Development/testing without Foundry runtime (uses LocalI18nService)
 * - Production with Foundry VTT (uses FoundryI18nService)
 * - Graceful degradation when translations are missing
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 *
 * // Try Foundry first, then local, then fallback
 * const text = i18n.translate("MODULE.SETTINGS.enableFeature", "Enable Feature");
 * console.log(text); // Translated or fallback
 * ```
 */
export class I18nFacadeService {
  static dependencies = [foundryI18nToken, localI18nToken] as const;

  constructor(
    private readonly foundryI18n: FoundryI18nService,
    private readonly localI18n: LocalI18nService
  ) {}

  /**
   * Translates a key using Foundry i18n → Local i18n → Fallback.
   *
   * @param key - Translation key
   * @param fallback - Optional fallback string (defaults to key itself)
   * @returns Translated string or fallback
   *
   * @example
   * ```typescript
   * // With fallback
   * const text = i18n.translate("MODULE.UNKNOWN_KEY", "Default Text");
   * console.log(text); // "Default Text"
   *
   * // Without fallback (returns key)
   * const text2 = i18n.translate("MODULE.UNKNOWN_KEY");
   * console.log(text2); // "MODULE.UNKNOWN_KEY"
   * ```
   */
  translate(key: string, fallback?: string): string {
    // 1. Try Foundry's i18n
    const foundryResult = this.foundryI18n.localize(key);
    if (foundryResult.ok && foundryResult.value !== key) {
      return foundryResult.value; // Foundry has a translation (not just the key)
    }

    // 2. Try local i18n
    const localResult = this.localI18n.translate(key);
    if (localResult.ok && localResult.value !== key) {
      return localResult.value; // Local has a translation
    }

    // 3. Fallback
    return fallback ?? key;
  }

  /**
   * Formats a string with placeholders.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @param fallback - Optional fallback string
   * @returns Formatted string or fallback
   *
   * @example
   * ```typescript
   * const text = i18n.format("MODULE.WELCOME", { name: "Alice" }, "Welcome!");
   * console.log(text); // "Welcome, Alice!" or "Welcome!"
   * ```
   */
  format(key: string, data: Record<string, unknown>, fallback?: string): string {
    // 1. Try Foundry's i18n
    const foundryResult = this.foundryI18n.format(key, data);
    if (foundryResult.ok && foundryResult.value !== key) {
      return foundryResult.value;
    }

    // 2. Try local i18n
    const localResult = this.localI18n.format(key, data);
    if (localResult.ok && localResult.value !== key) {
      return localResult.value;
    }

    // 3. Fallback
    return fallback ?? key;
  }

  /**
   * Checks if a translation key exists in either i18n system.
   *
   * @param key - Translation key to check
   * @returns True if key exists in Foundry or local i18n
   */
  has(key: string): boolean {
    // Check Foundry first
    const foundryResult = this.foundryI18n.has(key);
    if (foundryResult.ok && foundryResult.value) {
      return true;
    }

    // Check local i18n
    const localResult = this.localI18n.has(key);
    return localResult.ok && localResult.value;
  }

  /**
   * Loads local translations from a JSON object.
   * Useful for initializing translations on module startup.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * i18n.loadLocalTranslations({
   *   "MODULE.SETTINGS.enableFeature": "Enable Feature",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadLocalTranslations(translations: Record<string, string>): void {
    this.localI18n.loadTranslations(translations);
  }
}
