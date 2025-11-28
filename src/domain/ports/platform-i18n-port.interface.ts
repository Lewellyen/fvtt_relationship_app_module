import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for internationalization (i18n) operations.
 *
 * Abstraction that allows domain/application layers to translate strings
 * without knowing about the underlying platform (Foundry i18n, Local JSON, etc.).
 *
 * Implementations:
 * - Foundry: I18nPortAdapter (wraps I18nFacadeService with Foundry + Local + Fallback)
 * - Roll20: Roll20I18nPortAdapter
 * - Headless: LocalI18nPortAdapter
 */
export interface PlatformI18nPort {
  /**
   * Translates a key using the handler chain: Foundry → Local → Fallback.
   *
   * @param key - Translation key
   * @param fallback - Optional fallback string (defaults to key itself)
   * @returns Result with translated string or fallback
   */
  translate(key: string, fallback?: string): Result<string, string>;

  /**
   * Formats a string with placeholders using the handler chain.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @param fallback - Optional fallback string
   * @returns Result with formatted string or fallback
   */
  format(key: string, data: Record<string, unknown>, fallback?: string): Result<string, string>;

  /**
   * Checks if a translation key exists in the handler chain.
   * Checks Foundry → Local (Fallback always returns false for has()).
   *
   * @param key - Translation key to check
   * @returns Result with true if key exists in Foundry or local i18n
   */
  has(key: string): Result<boolean, string>;

  /**
   * Loads local translations from a JSON object.
   * Useful for initializing translations on module startup.
   *
   * @param translations - Object with key-value pairs
   */
  loadLocalTranslations(translations: Record<string, string>): void;
}
