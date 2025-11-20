import {
  fallbackTranslationHandlerToken,
  foundryTranslationHandlerToken,
  localTranslationHandlerToken,
} from "@/infrastructure/shared/tokens";
import type { TranslationHandler } from "./TranslationHandler.interface";
import type { Result } from "@/domain/types/result";

/**
 * Small façade that wires the translation handlers into a chain of responsibility.
 * The Foundry handler is considered the head of the chain and receives requests first.
 */
export class TranslationHandlerChain implements TranslationHandler {
  private readonly head: TranslationHandler;

  constructor(
    foundryHandler: TranslationHandler,
    localHandler: TranslationHandler,
    fallbackHandler: TranslationHandler
  ) {
    this.head = foundryHandler;
    this.head.setNext(localHandler).setNext(fallbackHandler);
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
  static dependencies = [
    foundryTranslationHandlerToken,
    localTranslationHandlerToken,
    fallbackTranslationHandlerToken,
  ] as const;

  constructor(
    foundryHandler: TranslationHandler,
    localHandler: TranslationHandler,
    fallbackHandler: TranslationHandler
  ) {
    super(foundryHandler, localHandler, fallbackHandler);
  }
}
