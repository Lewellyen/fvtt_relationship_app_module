import { AbstractTranslationHandler } from "./AbstractTranslationHandler";

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
  ): string | null {
    // Always return something: fallback or key
    return fallback ?? key;
  }

  protected doHas(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _key: string
  ): boolean {
    // Fallback handler doesn't "have" any keys
    // It just provides the fallback, so return false
    return false;
  }
}
