import type { Result } from "@/types/result";
import { ok } from "@/utils/functional/result";

/**
 * Escapes special regex characters in a string.
 * Prevents regex injection when using user-provided strings in RegExp.
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Local, Foundry-independent internationalization service.
 *
 * Provides fallback translations from JSON files when Foundry's i18n is unavailable.
 * Uses browser's locale detection for automatic language selection.
 *
 * **Design:**
 * - No Foundry dependency (can be used outside Foundry VTT)
 * - JSON-based translations loaded from `lang/` directory
 * - Browser locale detection via `navigator.language`
 * - Simple key-value lookup with fallback to key itself
 */
export class LocalI18nService {
  static dependencies = [] as const;

  private translations: Map<string, string> = new Map();
  private currentLocale: string = "en";

  constructor() {
    this.detectLocale();
  }

  /**
   * Detects browser locale and sets current language.
   * Falls back to 'en' if detection fails.
   */
  private detectLocale(): void {
    if (typeof navigator !== "undefined" && navigator.language) {
      // Extract base language from locale (e.g., "de-DE" → "de")
      const lang = navigator.language.split("-")[0];
      /* c8 ignore next -- Nullish coalescing: split()[0] can only return undefined for empty array; tested with empty string in LocalI18nService.test.ts */
      this.currentLocale = lang ?? "en";
    }
  }

  /**
   * Loads translations from a JSON object.
   * Useful for testing or pre-loaded translation data.
   *
   * @param translations - Object with key-value pairs
   *
   * @example
   * ```typescript
   * const i18n = new LocalI18nService();
   * i18n.loadTranslations({
   *   "MODULE.SETTINGS.logLevel.name": "Log Level",
   *   "MODULE.WELCOME": "Welcome, {name}!"
   * });
   * ```
   */
  loadTranslations(translations: Record<string, string>): void {
    for (const [key, value] of Object.entries(translations)) {
      this.translations.set(key, value);
    }
  }

  /**
   * Translates a key using local translations.
   *
   * @param key - Translation key
   * @returns Result with translated string (or key itself if not found)
   *
   * @example
   * ```typescript
   * const result = i18n.translate("MODULE.SETTINGS.logLevel.name");
   * if (result.ok) {
   *   console.log(result.value); // "Enable Feature" or key if not found
   * }
   * ```
   */
  translate(key: string): Result<string, string> {
    const value = this.translations.get(key);
    return ok(value ?? key); // Fallback to key itself if not found
  }

  /**
   * Formats a string with placeholders.
   * Simple implementation: replaces `{key}` with values from data object.
   *
   * @param key - Translation key
   * @param data - Object with placeholder values
   * @returns Result with formatted string
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
  format(key: string, data: Record<string, unknown>): Result<string, string> {
    const template = this.translations.get(key) ?? key;
    let formatted = template;

    // Simple placeholder replacement: {key} → value
    // Escape placeholder to prevent regex injection with special characters
    for (const [placeholder, value] of Object.entries(data)) {
      const escapedPlaceholder = escapeRegex(placeholder);
      const regex = new RegExp(`\\{${escapedPlaceholder}\\}`, "g");
      formatted = formatted.replace(regex, String(value));
    }

    return ok(formatted);
  }

  /**
   * Checks if a translation key exists.
   *
   * @param key - Translation key to check
   * @returns Result with boolean
   */
  has(key: string): Result<boolean, string> {
    return ok(this.translations.has(key));
  }

  /**
   * Gets the current locale.
   *
   * @returns Current locale string (e.g., "en", "de")
   */
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Sets the current locale.
   * Note: Changing locale requires reloading translations for the new language.
   *
   * @param locale - Locale code (e.g., "en", "de", "fr")
   */
  setLocale(locale: string): void {
    this.currentLocale = locale;
  }
}

export class DILocalI18nService extends LocalI18nService {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
