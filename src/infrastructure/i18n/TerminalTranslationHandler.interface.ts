/**
 * Terminal translation handler interface for Chain of Responsibility pattern.
 *
 * Terminal handlers are the final fallback in a translation chain.
 * They always provide a result and cannot be chained further (no setNext method).
 *
 * Unlike regular TranslationHandler, terminal handlers:
 * - Do not support setNext() (they are always the end of the chain)
 * - Always return a successful result (never delegate to another handler)
 * - Should only be used as the last handler in a chain
 */
import type { Result } from "@/domain/types/result";

export interface TerminalTranslationHandler {
  /**
   * Handles a translation request.
   *
   * Terminal handlers always succeed by returning the fallback string or the key itself.
   * They never return an error result.
   *
   * @param key - Translation key
   * @param data - Optional data for placeholder replacement
   * @param fallback - Optional fallback string
   * @returns Result with translated string (always successful)
   */
  handle(key: string, data?: Record<string, unknown>, fallback?: string): Result<string, string>;

  /**
   * Checks if a translation key exists in this handler's source.
   *
   * Terminal handlers typically return false (they don't "have" keys, they just provide fallbacks).
   *
   * @param key - Translation key to check
   * @returns Result with false (terminal handlers don't "have" keys) or error if check failed
   */
  has(key: string): Result<boolean, string>;
}
