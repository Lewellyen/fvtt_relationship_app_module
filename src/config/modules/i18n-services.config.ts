import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  foundryI18nToken,
  localI18nToken,
  i18nFacadeToken,
  foundryTranslationHandlerToken,
  localTranslationHandlerToken,
  fallbackTranslationHandlerToken,
  translationHandlerChainToken,
} from "@/tokens/tokenindex";
import { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import { LocalI18nService } from "@/services/LocalI18nService";
import { I18nFacadeService } from "@/services/I18nFacadeService";
import { FoundryTranslationHandler } from "@/services/i18n/FoundryTranslationHandler";
import { LocalTranslationHandler } from "@/services/i18n/LocalTranslationHandler";
import { FallbackTranslationHandler } from "@/services/i18n/FallbackTranslationHandler";
import { DITranslationHandlerChain } from "@/services/i18n/TranslationHandlerChain";

/**
 * Registers internationalization (i18n) services.
 *
 * Services registered:
 * - FoundryI18nService (singleton) - Wraps Foundry's i18n system
 * - LocalI18nService (singleton) - Local translations
 * - Translation Handlers (singleton) - Chain of Responsibility pattern
 *   - FoundryTranslationHandler
 *   - LocalTranslationHandler
 *   - FallbackTranslationHandler
 * - TranslationHandlerChain (singleton) - Builds die Handler-Kette im Konstruktor
 * - I18nFacadeService (singleton) - Facade combining all sources
 *
 * I18nFacadeService provides a unified interface for translations,
 * falling back from Foundry → Local → Fallback using Chain of Responsibility.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerI18nServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryI18nService
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    FoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }

  // Register LocalI18nService
  const localI18nResult = container.registerClass(
    localI18nToken,
    LocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }

  // Register Translation Handlers
  const foundryHandlerResult = container.registerClass(
    foundryTranslationHandlerToken,
    FoundryTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryHandlerResult)) {
    return err(
      `Failed to register FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
    );
  }

  const localHandlerResult = container.registerClass(
    localTranslationHandlerToken,
    LocalTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localHandlerResult)) {
    return err(`Failed to register LocalTranslationHandler: ${localHandlerResult.error.message}`);
  }

  const fallbackHandlerResult = container.registerClass(
    fallbackTranslationHandlerToken,
    FallbackTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(fallbackHandlerResult)) {
    return err(
      `Failed to register FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
    );
  }

  // Register Translation Handler Chain (Foundry → Local → Fallback)
  const chainResult = container.registerClass(
    translationHandlerChainToken,
    DITranslationHandlerChain,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(chainResult)) {
    return err(`Failed to register TranslationHandlerChain: ${chainResult.error.message}`);
  }

  // Register I18nFacadeService
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    I18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }

  return ok(undefined);
}
