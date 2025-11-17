import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import { foundryI18nToken } from "@/tokens/tokenindex";
import { AbstractTranslationHandler } from "./AbstractTranslationHandler";

/**
 * Translation handler that uses Foundry's i18n system.
 *
 * First handler in the chain: tries Foundry's game.i18n first.
 *
 * **Dependency Injection:**
 * Registered as SINGLETON in DI container.
 */
export class FoundryTranslationHandler extends AbstractTranslationHandler {
  constructor(private readonly foundryI18n: FoundryI18nService) {
    super();
  }

  protected doHandle(
    key: string,
    data?: Record<string, unknown>,
    _fallback?: string
  ): string | null {
    // Use format() if data is provided, otherwise localize()
    const result = data ? this.foundryI18n.format(key, data) : this.foundryI18n.localize(key);

    if (result.ok && result.value !== key) {
      // Foundry has a translation (not just returning the key)
      return result.value;
    }

    // Can't handle - delegate to next handler
    return null;
  }

  protected doHas(key: string): boolean {
    const result = this.foundryI18n.has(key);
    return result.ok && result.value;
  }
}

export class DIFoundryTranslationHandler extends FoundryTranslationHandler {
  static dependencies = [foundryI18nToken] as const;

  constructor(foundryI18n: FoundryI18nService) {
    super(foundryI18n);
  }
}
