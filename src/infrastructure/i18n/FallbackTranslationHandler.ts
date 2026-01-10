import type { TerminalTranslationHandler } from "./TerminalTranslationHandler.interface";
import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";

/**
 * Final fallback handler in the translation chain.
 *
 * Always succeeds by returning the fallback string or the key itself.
 * This is a terminal handler and should always be the last handler in the chain.
 *
 * **Terminal Handler:**
 * This handler implements TerminalTranslationHandler, not TranslationHandler,
 * meaning it cannot be chained further (no setNext method).
 * This prevents it from being incorrectly placed in the middle of a chain.
 *
 * **Dependency Injection:**
 * Registered as SINGLETON in DI container.
 * Has no dependencies (stateless).
 */
export class FallbackTranslationHandler implements TerminalTranslationHandler {
  static dependencies = [] as const;

  handle(key: string, _data?: Record<string, unknown>, fallback?: string): Result<string, string> {
    // Always return something: fallback or key
    return ok(fallback ?? key);
  }

  has(_key: string): Result<boolean, string> {
    // Fallback handler doesn't "have" any keys
    // It just provides the fallback, so return false
    return ok(false);
  }
}

export class DIFallbackTranslationHandler extends FallbackTranslationHandler {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
