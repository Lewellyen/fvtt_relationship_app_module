import type { FoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import { foundryI18nToken } from "@/infrastructure/shared/tokens/i18n.tokens";
import { AbstractTranslationHandler } from "./AbstractTranslationHandler";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

/**
 * Translation handler that uses Foundry's i18n system.
 *
 * First handler in the chain: tries Foundry's game.i18n first.
 *
 * **Dependency Injection:**
 * Registered as SINGLETON in DI container.
 */
export class FoundryTranslationHandler extends AbstractTranslationHandler {
  constructor(private readonly foundryI18n: FoundryI18nPort) {
    super();
  }

  protected doHandle(
    key: string,
    data?: Record<string, unknown>,
    _fallback?: string
  ): Result<string, string> {
    // Use format() if data is provided, otherwise localize()
    const result = data ? this.foundryI18n.format(key, data) : this.foundryI18n.localize(key);

    if (result.ok && result.value !== key) {
      // Foundry has a translation (not just returning the key)
      return ok(result.value);
    }

    // Can't handle - return error to delegate to next handler
    return err(`Foundry i18n could not translate key: ${key}`);
  }

  protected doHas(key: string): Result<boolean, string> {
    const result = this.foundryI18n.has(key);
    if (!result.ok) {
      return err(`Failed to check Foundry i18n for key: ${key}`);
    }
    return ok(result.value);
  }
}

export class DIFoundryTranslationHandler extends FoundryTranslationHandler {
  static dependencies = [foundryI18nToken] as const;

  constructor(foundryI18n: FoundryI18nPort) {
    super(foundryI18n);
  }
}
