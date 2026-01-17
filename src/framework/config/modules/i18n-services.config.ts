import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { platformI18nPortToken } from "@/application/tokens/domain-ports.tokens";
import { foundryI18nToken } from "@/infrastructure/shared/tokens/i18n/foundry-i18n.token";
import { localI18nToken } from "@/infrastructure/shared/tokens/i18n/local-i18n.token";
import { i18nFacadeToken } from "@/infrastructure/shared/tokens/i18n/i18n-facade.token";
import { foundryTranslationHandlerToken } from "@/infrastructure/shared/tokens/i18n/foundry-translation-handler.token";
import { localTranslationHandlerToken } from "@/infrastructure/shared/tokens/i18n/local-translation-handler.token";
import { fallbackTranslationHandlerToken } from "@/infrastructure/shared/tokens/i18n/fallback-translation-handler.token";
import { translationHandlerChainToken } from "@/infrastructure/shared/tokens/i18n/translation-handler-chain.token";
import { translationHandlersToken } from "@/infrastructure/shared/tokens/i18n/translation-handlers.token";
import { DIFoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import { DILocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import { DII18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import { DIFoundryTranslationHandler } from "@/infrastructure/i18n/FoundryTranslationHandler";
import { DILocalTranslationHandler } from "@/infrastructure/i18n/LocalTranslationHandler";
import { DIFallbackTranslationHandler } from "@/infrastructure/i18n/FallbackTranslationHandler";
import { DITranslationHandlerChain } from "@/infrastructure/i18n/TranslationHandlerChain";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";
import type { TerminalTranslationHandler } from "@/infrastructure/i18n/TerminalTranslationHandler.interface";
import { TerminalTranslationHandlerAdapter } from "@/infrastructure/i18n/TerminalTranslationHandlerAdapter";
import { DII18nPortAdapter } from "@/infrastructure/adapters/i18n/platform-i18n-port-adapter";

/**
 * Registers internationalization (i18n) services.
 *
 * Services registered:
 * - FoundryI18nPort (singleton) - Wraps Foundry's i18n system
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
  // Register FoundryI18nPort
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    DIFoundryI18nPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nPort: ${foundryI18nResult.error.message}`);
  }

  // Register LocalI18nService
  const localI18nResult = container.registerClass(
    localI18nToken,
    DILocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }

  // Register Translation Handlers
  const foundryHandlerResult = container.registerClass(
    foundryTranslationHandlerToken,
    DIFoundryTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(foundryHandlerResult)) {
    return err(
      `Failed to register FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
    );
  }

  const localHandlerResult = container.registerClass(
    localTranslationHandlerToken,
    DILocalTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(localHandlerResult)) {
    return err(`Failed to register LocalTranslationHandler: ${localHandlerResult.error.message}`);
  }

  const fallbackHandlerResult = container.registerClass(
    fallbackTranslationHandlerToken,
    DIFallbackTranslationHandler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(fallbackHandlerResult)) {
    return err(
      `Failed to register FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
    );
  }

  // Register array of translation handlers using a factory function
  // This allows handlers to be resolved after container validation
  // NOTE: Factory functions must return T, not Result<T, E>, so we use a helper
  // that respects the Result-Pattern by propagating Results before converting to exception
  // The fallback handler (terminal handler) is wrapped in an adapter to make it compatible
  const handlersArrayResult = container.registerFactory(
    translationHandlersToken,
    (): TranslationHandler[] => {
      const foundryHandlerResult = container.resolveWithError<TranslationHandler>(
        foundryTranslationHandlerToken
      );
      if (!foundryHandlerResult.ok) {
        throw new Error(
          `Failed to resolve FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
        );
      }
      const foundryHandler = foundryHandlerResult.value;

      const localHandlerResult = container.resolveWithError<TranslationHandler>(
        localTranslationHandlerToken
      );
      if (!localHandlerResult.ok) {
        throw new Error(
          `Failed to resolve LocalTranslationHandler: ${localHandlerResult.error.message}`
        );
      }
      const localHandler = localHandlerResult.value;

      const fallbackHandlerResult = container.resolveWithError<TerminalTranslationHandler>(
        fallbackTranslationHandlerToken
      );
      if (!fallbackHandlerResult.ok) {
        throw new Error(
          `Failed to resolve FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
        );
      }
      const fallbackHandler = fallbackHandlerResult.value;
      // Wrap the terminal handler in an adapter to make it compatible with TranslationHandler
      const fallbackHandlerAdapter = new TerminalTranslationHandlerAdapter(fallbackHandler);
      return [foundryHandler, localHandler, fallbackHandlerAdapter];
    },
    ServiceLifecycle.SINGLETON,
    [foundryTranslationHandlerToken, localTranslationHandlerToken, fallbackTranslationHandlerToken]
  );
  if (isErr(handlersArrayResult)) {
    return err(
      `Failed to register TranslationHandlers array: ${handlersArrayResult.error.message}`
    );
  }

  // Register Translation Handler Chain (uses array from DI)
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
    DII18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }

  // Register PlatformI18nPort
  const i18nPortResult = container.registerClass(
    platformI18nPortToken,
    DII18nPortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(i18nPortResult)) {
    return err(`Failed to register PlatformI18nPort: ${i18nPortResult.error.message}`);
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "I18nServices",
  priority: 120,
  execute: registerI18nServices,
});
