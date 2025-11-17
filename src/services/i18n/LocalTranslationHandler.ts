import type { LocalI18nService } from "@/services/LocalI18nService";
import { localI18nToken } from "@/tokens/tokenindex";
import { AbstractTranslationHandler } from "./AbstractTranslationHandler";

/**
 * Translation handler that uses local JSON-based translations.
 *
 * Second handler in the chain: provides fallback when Foundry i18n unavailable.
 *
 * **Dependency Injection:**
 * Registered as SINGLETON in DI container.
 */
export class LocalTranslationHandler extends AbstractTranslationHandler {
  constructor(private readonly localI18n: LocalI18nService) {
    super();
  }

  protected doHandle(
    key: string,
    data?: Record<string, unknown>,
    _fallback?: string
  ): string | null {
    // Use format() if data is provided, otherwise translate()
    const result = data ? this.localI18n.format(key, data) : this.localI18n.translate(key);

    if (result.ok && result.value !== key) {
      // Local i18n has a translation (not just returning the key)
      return result.value;
    }

    // Can't handle - delegate to next handler
    return null;
  }

  protected doHas(key: string): boolean {
    const result = this.localI18n.has(key);
    return result.ok && result.value;
  }
}

export class DILocalTranslationHandler extends LocalTranslationHandler {
  static dependencies = [localI18nToken] as const;

  constructor(localI18n: LocalI18nService) {
    super(localI18n);
  }
}
