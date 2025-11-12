import type { LocalI18nService } from "@/services/LocalI18nService";
import { localI18nToken, translationHandlerChainToken } from "@/tokens/tokenindex";
import type { TranslationHandler } from "./i18n/TranslationHandler.interface";

/**
 * Facade service that combines Foundry's i18n and local fallback translations.
 *
 * **Pattern: Chain of Responsibility (via DI)**
 * 1. FoundryTranslationHandler → Try Foundry's `game.i18n`
 * 2. LocalTranslationHandler → Try local JSON-based translations
 * 3. FallbackTranslationHandler → Return key itself or provided fallback string
 *
 * Each handler tries to provide a translation. If it can't, it delegates to the next.
 *
 * **Dependency Injection:**
 * The handler chain is injected via DI, maintaining SOLID principles.
 * No `new` in application code - handlers are registered in DI container.
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
  static dependencies = [translationHandlerChainToken, localI18nToken] as const;

  constructor(
    private readonly handlerChain: TranslationHandler,
    private readonly localI18n: LocalI18nService
  ) {}

  /**
   * Translates a key using the handler chain: Foundry → Local → Fallback.
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
    // Delegate to chain - it will try Foundry → Local → Fallback
    return this.handlerChain.handle(key, undefined, fallback) ?? key;
  }

  /**
   * Formats a string with placeholders using the handler chain.
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
    // Delegate to chain - it will try Foundry → Local → Fallback
    return this.handlerChain.handle(key, data, fallback) ?? key;
  }

  /**
   * Checks if a translation key exists in the handler chain.
   * Checks Foundry → Local (Fallback always returns false for has()).
   *
   * @param key - Translation key to check
   * @returns True if key exists in Foundry or local i18n
   */
  has(key: string): boolean {
    // Delegate to chain
    return this.handlerChain.has(key);
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
