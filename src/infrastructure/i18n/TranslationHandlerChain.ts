import { translationHandlersToken } from "@/infrastructure/shared/tokens/i18n.tokens";
import type { TranslationHandler } from "./TranslationHandler.interface";
import type { Result } from "@/domain/types/result";

/**
 * Small façade that wires the translation handlers into a chain of responsibility.
 * Handlers are chained in the order they appear in the array.
 */
export class TranslationHandlerChain implements TranslationHandler {
  private readonly head: TranslationHandler;

  constructor(handlers: TranslationHandler[]) {
    assertNonEmptyHandlers(handlers);
    const [head, ...rest] = handlers;
    this.head = head;

    // Chain handlers in order: each handler gets the next one as its successor
    let current: TranslationHandler = head;
    for (const handler of rest) {
      current = current.setNext(handler);
    }
  }

  setNext(handler: TranslationHandler): TranslationHandler {
    return this.head.setNext(handler);
  }

  handle(key: string, data?: Record<string, unknown>, fallback?: string): Result<string, string> {
    return this.head.handle(key, data, fallback);
  }

  has(key: string): Result<boolean, string> {
    return this.head.has(key);
  }
}

export class DITranslationHandlerChain extends TranslationHandlerChain {
  static dependencies = [translationHandlersToken] as const;

  constructor(handlers: TranslationHandler[]) {
    super(handlers);
  }
}

type NonEmptyHandlerList = [TranslationHandler, ...TranslationHandler[]];

function assertNonEmptyHandlers(
  handlers: TranslationHandler[]
): asserts handlers is NonEmptyHandlerList {
  if (handlers.length === 0) {
    throw new Error("TranslationHandlerChain requires at least one handler");
  }
}
