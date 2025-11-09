import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import { markAsApiSafe, type ApiSafeToken } from "@/di_infrastructure/types/api-safe-token";
import { getDeprecationInfo } from "@/di_infrastructure/types/deprecated-token";
import { createPublicLogger, createPublicI18n } from "@/core/api/public-api-wrappers";
import { createApiTokens } from "@/core/api/api-token-config";
import type { ModuleApi, TokenInfo, HealthStatus } from "@/core/module-api";
import type { ServiceType } from "@/types/servicetypeindex";
import type { Logger } from "@/interfaces/logger";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import {
  loggerToken,
  journalVisibilityServiceToken,
  metricsCollectorToken,
  moduleHealthServiceToken,
  i18nFacadeToken,
} from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryJournalFacadeToken,
} from "@/foundry/foundrytokens";

/**
 * ModuleApiInitializer
 *
 * Responsible for exposing the module's public API to external consumers.
 * Separated from CompositionRoot for Single Responsibility Principle.
 *
 * Responsibilities:
 * - Create API token collection
 * - Create API object with resolve(), getMetrics(), getHealth(), etc.
 * - Apply deprecation warnings
 * - Apply read-only wrappers for sensitive services
 * - Expose API to game.modules.get(MODULE_ID).api
 *
 * Design: No dependencies, uses Result-Pattern for error handling.
 */
export class ModuleApiInitializer {
  static dependencies = [] as const;

  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   *
   * @param container - Initialized and validated ServiceContainer
   * @returns Result<void, string> - Ok if successful, Err with error message
   */
  expose(container: ServiceContainer): Result<void, string> {
    // Guard: Foundry game object available?
    if (typeof game === "undefined" || !game?.modules) {
      return err("Game modules not available - API cannot be exposed");
    }

    const mod = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    if (!mod) {
      return err(`Module '${MODULE_CONSTANTS.MODULE.ID}' not found in game.modules`);
    }

    // Create well-known tokens collection
    const wellKnownTokens = createApiTokens();

    // Create API-safe tokens for type checking
    const apiSafeLoggerToken = markAsApiSafe(loggerToken);
    const apiSafeI18nToken = markAsApiSafe(i18nFacadeToken);

    // Helper function for resolve implementation with type-safe wrapping
    const resolveImpl = <TServiceType extends ServiceType>(
      token: ApiSafeToken<TServiceType>
    ): TServiceType => {
      // Check for deprecation metadata
      const deprecationInfo = getDeprecationInfo(token);
      if (deprecationInfo && !deprecationInfo.warningShown) {
        /* c8 ignore start -- Optional replacement info: Tested in deprecated-token.test.ts */
        const replacementInfo = deprecationInfo.replacement
          ? `Use "${deprecationInfo.replacement}" instead.\n`
          : "";
        /* c8 ignore stop */
        console.warn(
          `[${MODULE_CONSTANTS.MODULE.ID}] DEPRECATED: Token "${String(token)}" is deprecated.\n` +
            `Reason: ${deprecationInfo.reason}\n` +
            replacementInfo +
            `This token will be removed in version ${deprecationInfo.removedInVersion}.`
        );
        deprecationInfo.warningShown = true; // Only warn once per session
      }

      // Resolve service from container
      const service: TServiceType = container.resolve(token);

      // Apply read-only wrappers for sensitive services
      // Type narrowing: We check token identity and apply appropriate wrapper
      if (token === apiSafeLoggerToken) {
        // Type-safe: When token is loggerToken, we know service is Logger
        // Wrapper returns Logger, which is assignable to TServiceType when TServiceType extends Logger
        /* type-coverage:ignore-next-line -- Generic type narrowing: token === loggerToken guarantees service is Logger */
        const logger: Logger = service as Logger;
        const wrappedLogger: Logger = createPublicLogger(logger);
        /* type-coverage:ignore-next-line -- Generic return: wrappedLogger (Logger) must be cast to generic TServiceType */
        return wrappedLogger as TServiceType;
      }

      if (token === apiSafeI18nToken) {
        // Type-safe: When token is i18nToken, we know service is I18nFacadeService
        /* type-coverage:ignore-next-line -- Generic type narrowing: token === i18nToken guarantees service is I18nFacadeService */
        const i18n: I18nFacadeService = service as I18nFacadeService;
        const wrappedI18n: I18nFacadeService = createPublicI18n(i18n);
        /* type-coverage:ignore-next-line -- Generic return: wrappedI18n must be cast to generic TServiceType */
        return wrappedI18n as TServiceType;
      }

      // Default: Return original service for read-only services
      // (FoundryGame, FoundryDocument, FoundryUI, etc.)
      return service;
    };

    // Create API object with overloaded resolve for type-safety
    const api: ModuleApi = {
      version: MODULE_CONSTANTS.API.VERSION,

      // Overloaded resolve method (implementation uses helper)
      resolve: resolveImpl,

      getAvailableTokens: (): Map<symbol, TokenInfo> => {
        const tokenMap = new Map<symbol, TokenInfo>();

        // Add well-known tokens with their registration status
        const tokenEntries: Array<[string, InjectionToken<ServiceType>]> = [
          ["loggerToken", loggerToken],
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken],
          ["i18nFacadeToken", i18nFacadeToken],
          ["foundryJournalFacadeToken", foundryJournalFacadeToken],
        ];

        for (const [, token] of tokenEntries) {
          const isRegisteredResult = container.isRegistered(token);
          tokenMap.set(token, {
            description: String(token).replace("Symbol(", "").replace(")", ""),
            /* c8 ignore next -- isRegistered never fails; ok check is defensive */
            isRegistered: isRegisteredResult.ok ? isRegisteredResult.value : false,
          });
        }

        return tokenMap;
      },

      tokens: wellKnownTokens,

      getMetrics: () => {
        const metricsResult = container.resolveWithError(metricsCollectorToken);
        /* c8 ignore start -- Defensive: MetricsCollector is always registered; fallback returns empty metrics */
        if (!metricsResult.ok) {
          return {
            containerResolutions: 0,
            resolutionErrors: 0,
            avgResolutionTimeMs: 0,
            portSelections: {},
            portSelectionFailures: {},
            cacheHitRate: 0,
          };
        }
        /* c8 ignore stop */
        return metricsResult.value.getSnapshot();
      },

      getHealth: (): HealthStatus => {
        // Delegate to ModuleHealthService for health checks
        const healthServiceResult = container.resolveWithError(moduleHealthServiceToken);
        /* c8 ignore start -- Defensive: ModuleHealthService fallback when resolution fails */
        if (!healthServiceResult.ok) {
          // Fallback health status if service cannot be resolved
          return {
            status: "unhealthy",
            checks: {
              containerValidated: false,
              portsSelected: false,
              lastError: "ModuleHealthService not available",
            },
            timestamp: new Date().toISOString(),
          };
        }
        /* c8 ignore stop */
        return healthServiceResult.value.getHealth();
      },
    };

    // Expose API to Foundry module
    mod.api = api;

    return ok(undefined);
  }
}
