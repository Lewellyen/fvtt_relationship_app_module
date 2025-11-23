import { AbstractTranslationHandler } from "./AbstractTranslationHandler";
import type { Result } from "@/domain/types/result";
import { ok } from "@/infrastructure/shared/utils/result";

/**
 * Final fallback handler in the translation chain.
 *
 * Always succeeds by returning the fallback string or the key itself.
 * Should be the last handler in the chain.
 *
 * **Dependency Injection:**
 * Registered as SINGLETON in DI container.
 * Has no dependencies (stateless).
 */
export class FallbackTranslationHandler extends AbstractTranslationHandler {
  static dependencies = [] as const;
  protected doHandle(
    key: string,
    _data?: Record<string, unknown>,
    fallback?: string
  ): Result<string, string> {
    // Always return something: fallback or key
    return ok(fallback ?? key);
  }

  protected doHas(_key: string): Result<boolean, string> {
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
