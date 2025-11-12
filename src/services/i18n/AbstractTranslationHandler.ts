import type { TranslationHandler } from "./TranslationHandler.interface";

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

  handle(key: string, data?: Record<string, unknown>, fallback?: string): string | null {
    // Try to handle the request ourselves
    const result = this.doHandle(key, data, fallback);
    if (result !== null) {
      return result;
    }

    // Delegate to next handler if available
    if (this.nextHandler) {
      return this.nextHandler.handle(key, data, fallback);
    }

    // No handler in chain could provide translation
    return null;
  }

  has(key: string): boolean {
    // Check our own source first
    if (this.doHas(key)) {
      return true;
    }

    // Check next handler if available
    if (this.nextHandler) {
      return this.nextHandler.has(key);
    }

    return false;
  }

  /**
   * Concrete implementation of translation logic.
   * Should return the translated string or null if this handler can't provide it.
   *
   * @param key - Translation key
   * @param data - Optional data for placeholder replacement
   * @param fallback - Optional fallback string
   * @returns Translated string or null
   */
  protected abstract doHandle(
    key: string,
    data?: Record<string, unknown>,
    fallback?: string
  ): string | null;

  /**
   * Concrete implementation of key existence check.
   * Should return true if this handler's source contains the key.
   *
   * @param key - Translation key to check
   * @returns True if key exists in this handler's source
   */
  protected abstract doHas(key: string): boolean;
}
