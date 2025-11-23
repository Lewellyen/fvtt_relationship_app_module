import type { LocalI18nService } from "./LocalI18nService";
import { localI18nToken } from "@/infrastructure/shared/tokens";
import { AbstractTranslationHandler } from "./AbstractTranslationHandler";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/infrastructure/shared/utils/result";

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
  ): Result<string, string> {
    // Use format() if data is provided, otherwise translate()
    const result = data ? this.localI18n.format(key, data) : this.localI18n.translate(key);

    if (result.ok && result.value !== key) {
      // Local i18n has a translation (not just returning the key)
      return ok(result.value);
    }

    // Can't handle - return error to delegate to next handler
    return err(`Local i18n could not translate key: ${key}`);
  }

  protected doHas(key: string): Result<boolean, string> {
    const result = this.localI18n.has(key);
    if (!result.ok) {
      return err(`Failed to check local i18n for key: ${key}`);
    }
    return ok(result.value);
  }
}

export class DILocalTranslationHandler extends LocalTranslationHandler {
  static dependencies = [localI18nToken] as const;

  constructor(localI18n: LocalI18nService) {
    super(localI18n);
  }
}
