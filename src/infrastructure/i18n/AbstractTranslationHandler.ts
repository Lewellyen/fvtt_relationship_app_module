import type { TranslationHandler } from "./TranslationHandler.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

/**
 * Abstract base class for translation handlers.
 * Implements the Chain of Responsibility pattern.
 *
 * Concrete handlers only need to implement:
 * - doHandle() - the actual translation logic
 * - doHas() - the key existence check
 */
export abstract class AbstractTranslationHandler implements TranslationHandler {
  private nextHandler: TranslationHandler | null = null;

  setNext(handler: TranslationHandler): TranslationHandler {
    this.nextHandler = handler;
    return handler; // Return handler for fluent chaining: a.setNext(b).setNext(c)
  }

  handle(key: string, data?: Record<string, unknown>, fallback?: string): Result<string, string> {
    // Try to handle the request ourselves
    const result = this.doHandle(key, data, fallback);
    if (result.ok) {
      return result;
    }

    // Delegate to next handler if available
    if (this.nextHandler) {
      return this.nextHandler.handle(key, data, fallback);
    }

    // No handler in chain could provide translation
    // If fallback provided, use it; otherwise return error
    if (fallback !== undefined) {
      return ok(fallback);
    }
    return err(`Translation key not found: ${key}`);
  }

  has(key: string): Result<boolean, string> {
    // Check our own source first
    const ourResult = this.doHas(key);
    if (!ourResult.ok) {
      // Propagate error from doHas()
      return ourResult;
    }
    if (ourResult.value) {
      return ok(true);
    }

    // Check next handler if available
    if (this.nextHandler) {
      return this.nextHandler.has(key);
    }

    // No handler found the key
    return ok(false);
  }

  /**
   * Concrete implementation of translation logic.
   * Should return Result with translated string, or error if this handler can't provide it.
   *
   * @param key - Translation key
   * @param data - Optional data for placeholder replacement
   * @param fallback - Optional fallback string
   * @returns Result with translated string or error
   */
  protected abstract doHandle(
    key: string,
    data?: Record<string, unknown>,
    fallback?: string
  ): Result<string, string>;

  /**
   * Concrete implementation of key existence check.
   * Should return Result with true if this handler's source contains the key.
   *
   * @param key - Translation key to check
   * @returns Result with true if key exists in this handler's source, false otherwise, or error
   */
  protected abstract doHas(key: string): Result<boolean, string>;
}
