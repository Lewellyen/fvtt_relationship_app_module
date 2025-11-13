import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import { markAsApiSafe, type ApiSafeToken } from "@/di_infrastructure/types/api-safe-token";
import { getDeprecationInfo } from "@/di_infrastructure/types/deprecated-token";
import { createPublicI18n } from "@/core/api/public-api-wrappers";
import { createApiTokens } from "@/core/api/api-token-config";
import type { ModuleApi, TokenInfo, HealthStatus, ModuleApiTokens } from "@/core/module-api";
import type { ServiceType } from "@/types/servicetypeindex";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import {
  journalVisibilityServiceToken,
  metricsCollectorToken,
  moduleHealthServiceToken,
  i18nFacadeToken,
  notificationCenterToken,
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
 * - Apply deprecation warnings (via console.warn for external visibility)
 * - Apply read-only wrappers for sensitive services
 * - Expose API to game.modules.get(MODULE_ID).api
 *
 * Design: No dependencies, uses Result-Pattern for error handling.
 */
export class ModuleApiInitializer {
  static dependencies = [] as const;

  /**
   * Handles deprecation warnings for tokens.
   * Logs warning to console if token is deprecated and warning hasn't been shown yet.
   *
   * Uses console.warn instead of Logger because:
   * - Deprecation warnings are for external API consumers (not internal logs)
   * - Should be visible even if Logger is disabled/configured differently
   * - Follows npm/Node.js convention for deprecation warnings
   *
   * @param token - Token to check for deprecation
   * @private
   */
  private handleDeprecationWarning<TServiceType extends ServiceType>(
    token: ApiSafeToken<TServiceType>
  ): void {
    const deprecationInfo = getDeprecationInfo(token);
    if (deprecationInfo && !deprecationInfo.warningShown) {
      /* c8 ignore next 3 -- Ternary branch coverage: Both branches tested (replacement=null and replacement="string"), reporting artifact */
      const replacementInfo = deprecationInfo.replacement
        ? `Use "${deprecationInfo.replacement}" instead.\n`
        : "";
      console.warn(
        `[${MODULE_CONSTANTS.MODULE.ID}] DEPRECATED: Token "${String(token)}" is deprecated.\n` +
          `Reason: ${deprecationInfo.reason}\n` +
          replacementInfo +
          `This token will be removed in version ${deprecationInfo.removedInVersion}.`
      );
      deprecationInfo.warningShown = true; // Only warn once per session
    }
  }

  /**
   * Creates the resolve() function for the public API.
   * Resolves services and applies wrappers (throws on error).
   *
   * @param container - ServiceContainer for resolution
   * @returns Resolve function for ModuleApi
   * @private
   */
  private createResolveFunction(
    container: ServiceContainer
  ): <TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType {
    const apiSafeI18nToken = markAsApiSafe(i18nFacadeToken);

    return <TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>): TServiceType => {
      // Handle deprecation warnings
      this.handleDeprecationWarning(token);

      // Resolve service from container
      const service: TServiceType = container.resolve(token);

      // Apply read-only wrappers for sensitive services
      // Type narrowing: We check token identity and apply appropriate wrapper
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
  }

  /**
   * Creates the resolveWithError() function for the public API.
   * Resolves services with Result pattern (never throws).
   *
   * @param container - ServiceContainer for resolution
   * @returns ResolveWithError function for ModuleApi
   * @private
   */
  private createResolveWithErrorFunction(
    container: ServiceContainer
  ): <TServiceType extends ServiceType>(
    token: ApiSafeToken<TServiceType>
  ) => Result<TServiceType, ContainerError> {
    const apiSafeI18nToken = markAsApiSafe(i18nFacadeToken);

    return <TServiceType extends ServiceType>(
      token: ApiSafeToken<TServiceType>
    ): Result<TServiceType, ContainerError> => {
      // Handle deprecation warnings
      this.handleDeprecationWarning(token);

      // Resolve with Result-Pattern (never throws)
      const result = container.resolveWithError(token);

      // Apply wrappers if resolution succeeded
      /* c8 ignore next 2 -- container.resolveWithError failure path already covered in container tests */
      if (!result.ok) {
        return result; // Return error as-is
      }

      const service = result.value;

      // Apply read-only wrappers for sensitive services
      if (token === apiSafeI18nToken) {
        /* type-coverage:ignore-next-line -- Generic type narrowing: token === i18nToken guarantees service is I18nFacadeService */
        const i18n: I18nFacadeService = service as I18nFacadeService;
        const wrappedI18n: I18nFacadeService = createPublicI18n(i18n);
        /* type-coverage:ignore-next-line -- Generic return: wrappedI18n must be cast to generic TServiceType */
        return ok(wrappedI18n as TServiceType);
      }

      // Default: Return wrapped in Result
      return ok(service);
    };
  }

  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - ServiceContainer for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   * @private
   */
  private createApiObject(
    container: ServiceContainer,
    wellKnownTokens: ModuleApiTokens
  ): ModuleApi {
    return {
      version: MODULE_CONSTANTS.API.VERSION,

      // Overloaded resolve method (throws on error)
      resolve: this.createResolveFunction(container),

      // Result-Pattern method (safe, never throws)
      resolveWithError: this.createResolveWithErrorFunction(container),

      getAvailableTokens: (): Map<symbol, TokenInfo> => {
        const tokenMap = new Map<symbol, TokenInfo>();

        // Add well-known tokens with their registration status
        const tokenEntries: Array<[string, InjectionToken<ServiceType>]> = [
          ["journalVisibilityServiceToken", journalVisibilityServiceToken],
          ["foundryGameToken", foundryGameToken],
          ["foundryHooksToken", foundryHooksToken],
          ["foundryDocumentToken", foundryDocumentToken],
          ["foundryUIToken", foundryUIToken],
          ["foundrySettingsToken", foundrySettingsToken],
          ["i18nFacadeToken", i18nFacadeToken],
          ["foundryJournalFacadeToken", foundryJournalFacadeToken],
          ["notificationCenterToken", notificationCenterToken],
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
  }

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

    // Create complete API object
    const api = this.createApiObject(container, wellKnownTokens);

    // Expose API to Foundry module
    mod.api = api;

    return ok(undefined);
  }
}
