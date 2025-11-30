import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  foundryI18nToken,
  localI18nToken,
  i18nFacadeToken,
  foundryTranslationHandlerToken,
  localTranslationHandlerToken,
  fallbackTranslationHandlerToken,
  translationHandlerChainToken,
  translationHandlersToken,
  platformI18nPortToken,
} from "@/infrastructure/shared/tokens";
import { DIFoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import { DILocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import { DII18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import { DIFoundryTranslationHandler } from "@/infrastructure/i18n/FoundryTranslationHandler";
import { DILocalTranslationHandler } from "@/infrastructure/i18n/LocalTranslationHandler";
import { DIFallbackTranslationHandler } from "@/infrastructure/i18n/FallbackTranslationHandler";
import { DITranslationHandlerChain } from "@/infrastructure/i18n/TranslationHandlerChain";
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
  // NOTE: Factory functions must return values directly, not Results.
  // If resolveWithError() fails, we propagate the error via ContainerError
  // which the container catches and converts to a proper Result.
  const handlersArrayResult = container.registerFactory(
    translationHandlersToken,
    () => {
      const foundryHandlerResult = container.resolveWithError(foundryTranslationHandlerToken);
      if (!foundryHandlerResult.ok) {
        // Propagate error via ContainerError (container catches and converts to Result)
        // This respects the Result-Pattern by using resolveWithError() instead of throwing
        // arbitrary exceptions. The container's error handling converts this to a proper Result.
        const containerError: ContainerError = {
          code: foundryHandlerResult.error.code,
          message: `Failed to resolve FoundryTranslationHandler: ${foundryHandlerResult.error.message}`,
          tokenDescription: String(foundryTranslationHandlerToken),
          cause: foundryHandlerResult.error,
          timestamp: Date.now(),
        };
        throw containerError;
      }

      const localHandlerResult = container.resolveWithError(localTranslationHandlerToken);
      if (!localHandlerResult.ok) {
        // Propagate error via ContainerError (container catches and converts to Result)
        const containerError: ContainerError = {
          code: localHandlerResult.error.code,
          message: `Failed to resolve LocalTranslationHandler: ${localHandlerResult.error.message}`,
          tokenDescription: String(localTranslationHandlerToken),
          cause: localHandlerResult.error,
          timestamp: Date.now(),
        };
        throw containerError;
      }

      const fallbackHandlerResult = container.resolveWithError(fallbackTranslationHandlerToken);
      if (!fallbackHandlerResult.ok) {
        // Propagate error via ContainerError (container catches and converts to Result)
        const containerError: ContainerError = {
          code: fallbackHandlerResult.error.code,
          message: `Failed to resolve FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`,
          tokenDescription: String(fallbackTranslationHandlerToken),
          cause: fallbackHandlerResult.error,
          timestamp: Date.now(),
        };
        throw containerError;
      }

      return [foundryHandlerResult.value, localHandlerResult.value, fallbackHandlerResult.value];
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
