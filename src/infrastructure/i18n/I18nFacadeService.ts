import type { LocalI18nService } from "./LocalI18nService";
import { localI18nToken, translationHandlerChainToken } from "@/infrastructure/shared/tokens/i18n.tokens";
import type { TranslationHandler } from "./TranslationHandler.interface";
import type { Result } from "@/domain/types/result";

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
 * - Production with Foundry VTT (uses FoundryI18nPort)
 * - Graceful degradation when translations are missing
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 *
 * // Try Foundry first, then local, then fallback
 * const result = i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level");
 * if (result.ok) {
 *   console.log(result.value); // Translated or fallback
 * }
 * ```
 */
export class I18nFacadeService {
  constructor(
    private readonly handlerChain: TranslationHandler,
    private readonly localI18n: LocalI18nService
  ) {}

  /**
   * Translates a key using the handler chain: Foundry → Local → Fallback.
   *
   * @param key - Translation key
   * @param fallback - Optional fallback string (defaults to key itself)
   * @returns Result with translated string or fallback
   *
   * @example
   * ```typescript
   * // With fallback
   * const result = i18n.translate("MODULE.UNKNOWN_KEY", "Default Text");
   * if (result.ok) {
   *   console.log(result.value); // "Default Text"
   * }
   *
   * // Without fallback (returns key as fallback)
   * const result2 = i18n.translate("MODULE.UNKNOWN_KEY");
   * if (result2.ok) {
   *   console.log(result2.value); // "MODULE.UNKNOWN_KEY"
   * }
   * ```
   */
  translate(key: string, fallback?: string): Result<string, string> {
    // Delegate to chain - it will try Foundry → Local → Fallback
    return this.handlerChain.handle(key, undefined, fallback);
  }

  /**
   * Formats a string with placeholders using the handler chain.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @param fallback - Optional fallback string
   * @returns Result with formatted string or fallback
   *
   * @example
   * ```typescript
   * const result = i18n.format("MODULE.WELCOME", { name: "Alice" }, "Welcome!");
   * if (result.ok) {
   *   console.log(result.value); // "Welcome, Alice!" or "Welcome!"
   * }
   * ```
   */
  format(key: string, data: Record<string, unknown>, fallback?: string): Result<string, string> {
    // Delegate to chain - it will try Foundry → Local → Fallback
    return this.handlerChain.handle(key, data, fallback);
  }

  /**
   * Checks if a translation key exists in the handler chain.
   * Checks Foundry → Local (Fallback always returns false for has()).
   *
   * @param key - Translation key to check
   * @returns Result with true if key exists in Foundry or local i18n
   */
  has(key: string): Result<boolean, string> {
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
   *   "MODULE.SETTINGS.logLevel.name": "Log Level",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadLocalTranslations(translations: Record<string, string>): void {
    this.localI18n.loadTranslations(translations);
  }
}

export class DII18nFacadeService extends I18nFacadeService {
  static dependencies = [translationHandlerChainToken, localI18nToken] as const;

  constructor(handlerChain: TranslationHandler, localI18n: LocalI18nService) {
    super(handlerChain, localI18n);
  }
}
