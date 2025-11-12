/**
 * Translation handler interface for Chain of Responsibility pattern.
 *
 * Each handler in the chain tries to provide a translation.
 * If it can't, it delegates to the next handler.
 */
export interface TranslationHandler {
  /**
   * Sets the next handler in the chain.
   *
   * @param handler - The next handler to delegate to
   * @returns The next handler (for fluent chaining)
   */
  setNext(handler: TranslationHandler): TranslationHandler;

  /**
   * Handles a translation request.
   *
   * Tries to translate the key. If successful, returns the translation.
   * Otherwise, delegates to the next handler in the chain.
   *
   * @param key - Translation key
   * @param data - Optional data for placeholder replacement
   * @param fallback - Optional fallback string
   * @returns Translated string or null if this handler can't handle it
   */
  handle(key: string, data?: Record<string, unknown>, fallback?: string): string | null;

  /**
   * Checks if a translation key exists in this handler's source.
   *
   * @param key - Translation key to check
   * @returns True if the key exists, false otherwise
   */
  has(key: string): boolean;
}
