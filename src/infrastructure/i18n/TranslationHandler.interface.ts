/**
 * Translation handler interface for Chain of Responsibility pattern.
 *
 * Each handler in the chain tries to provide a translation.
 * If it can't, it delegates to the next handler.
 */
import type { Result } from "@/domain/types/result";

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
   * @returns Result with translated string, or error if translation failed and no fallback provided
   */
  handle(key: string, data?: Record<string, unknown>, fallback?: string): Result<string, string>;

  /**
   * Checks if a translation key exists in this handler's source.
   *
   * @param key - Translation key to check
   * @returns Result with true if the key exists, false otherwise, or error if check failed
   */
  has(key: string): Result<boolean, string>;
}
