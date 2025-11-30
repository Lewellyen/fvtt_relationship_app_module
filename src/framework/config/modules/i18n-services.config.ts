import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
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
 * Helper function to resolve a service and return a Result.
 * This function respects the Result-Pattern by explicitly checking the Result
 * before any exception is thrown. Factory functions must return T, not Result<T, E>,
 * so we use this helper to check the Result and only throw if resolution fails.
 * The container will catch the exception and convert it to ContainerError.
 *
 * @template T - The type of service to resolve
 * @param container - The service container
 * @param token - The injection token
 * @returns Result with the resolved service or error
 */
function resolveService<T extends ServiceType>(
  container: ServiceContainer,
  token: InjectionToken<T>
): Result<T, ContainerError> {
  return container.resolveWithError(token);
}

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
  // NOTE: Factory functions must return T, not Result<T, E>, so we use resolveService()
  // to respect the Result-Pattern and only throw if resolution fails (container will catch it)
  const handlersArrayResult = container.registerFactory(
    translationHandlersToken,
    () => {
      // Use helper function to respect Result-Pattern
      const foundryHandlerResult = resolveService(container, foundryTranslationHandlerToken);
      if (!foundryHandlerResult.ok) {
        // Factory functions must return T, not Result, so we throw here
        // The container will catch this and convert it to ContainerError
        // This respects the Result-Pattern by checking the Result before throwing
        throw new Error(
          `Failed to resolve FoundryTranslationHandler: ${foundryHandlerResult.error.message}`
        );
      }

      const localHandlerResult = resolveService(container, localTranslationHandlerToken);
      if (!localHandlerResult.ok) {
        // Factory functions must return T, not Result, so we throw here
        // The container will catch this and convert it to ContainerError
        // This respects the Result-Pattern by checking the Result before throwing
        throw new Error(
          `Failed to resolve LocalTranslationHandler: ${localHandlerResult.error.message}`
        );
      }

      const fallbackHandlerResult = resolveService(container, fallbackTranslationHandlerToken);
      if (!fallbackHandlerResult.ok) {
        // Factory functions must return T, not Result, so we throw here
        // The container will catch this and convert it to ContainerError
        // This respects the Result-Pattern by checking the Result before throwing
        throw new Error(
          `Failed to resolve FallbackTranslationHandler: ${fallbackHandlerResult.error.message}`
        );
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
