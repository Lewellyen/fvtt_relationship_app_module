import type { TerminalTranslationHandler } from "./TerminalTranslationHandler.interface";
import type { TranslationHandler } from "./TranslationHandler.interface";

/**
 * Adapter that wraps a TerminalTranslationHandler to make it compatible with TranslationHandler interface.
 *
 * This adapter allows terminal handlers to be used in the TranslationHandlerChain
 * by providing a setNext method. Since terminal handlers are always the last handler,
 * setNext is a no-op (it returns the adapter itself for fluent chaining, but the handler
 * passed is ignored).
 *
 * **Usage:**
 * This adapter is used to wrap terminal handlers when they need to be used in a chain.
 * The adapter ensures terminal handlers cannot be incorrectly placed in the middle of a chain
 * (they will always be the last element).
 */
export class TerminalTranslationHandlerAdapter implements TranslationHandler {
  constructor(private readonly terminalHandler: TerminalTranslationHandler) {}

  setNext(_handler: TranslationHandler): TranslationHandler {
    // Terminal handlers are always last, so setNext is a no-op
    // Return self to allow fluent chaining, but ignore the handler parameter
    return this;
  }

  handle(
    key: string,
    data?: Record<string, unknown>,
    fallback?: string
  ): ReturnType<TranslationHandler["handle"]> {
    // Terminal handlers always succeed, so just delegate
    return this.terminalHandler.handle(key, data, fallback);
  }

  has(key: string): ReturnType<TranslationHandler["has"]> {
    // Terminal handlers always succeed, so just delegate
    return this.terminalHandler.has(key);
  }
}
