import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { formatReplacementInfo } from "@/infrastructure/shared/utils/format-deprecation-info";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { type ApiSafeToken } from "@/infrastructure/di/types/utilities/api-safe-token";
import { getDeprecationInfo } from "@/infrastructure/di/types/utilities/deprecated-token";
import {
  createPublicI18n,
  createPublicNotificationCenter,
  createPublicFoundrySettings,
} from "@/framework/core/api/public-api-wrappers";
import { createApiTokens } from "@/framework/core/api/api-token-config";
import type { ModuleApi, TokenInfo, ModuleApiTokens } from "@/framework/core/api/module-api";
import type { HealthStatus } from "@/domain/types/health-status";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import {
  wrapFoundrySettingsPort,
  wrapI18nService,
  wrapNotificationCenterService,
  getRegistrationStatus,
  castMetricsCollector,
  castModuleHealthService,
  castResolvedService,
  castContainerErrorCode,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import {
  journalVisibilityServiceToken,
  metricsCollectorToken,
  moduleHealthServiceToken,
  i18nFacadeToken,
  notificationCenterToken,
} from "@/infrastructure/shared/tokens";
// Types are used in type assertions via cast functions (castMetricsCollector, castModuleHealthService)
// The types are needed for the return types of the cast functions
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryJournalFacadeToken,
} from "@/infrastructure/shared/tokens";

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
      const replacementInfo = formatReplacementInfo(deprecationInfo.replacement);
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
   * @param container - ContainerPort for resolution
   * @returns Resolve function for ModuleApi
   * @private
   */
  private createResolveFunction(
    container: ContainerPort,
    wellKnownTokens: ModuleApiTokens
  ): <TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>) => TServiceType {
    return <TServiceType extends ServiceType>(token: ApiSafeToken<TServiceType>): TServiceType => {
      // Handle deprecation warnings
      this.handleDeprecationWarning(token);

      // Resolve service from container
      const service: TServiceType = container.resolve(token);

      return this.wrapSensitiveService(token, service, wellKnownTokens);
    };
  }

  /**
   * Creates the resolveWithError() function for the public API.
   * Resolves services with Result pattern (never throws).
   *
   * @param container - ContainerPort for resolution
   * @returns ResolveWithError function for ModuleApi
   * @private
   */
  private createResolveWithErrorFunction(
    container: ContainerPort,
    wellKnownTokens: ModuleApiTokens
  ): <TServiceType extends ServiceType>(
    token: ApiSafeToken<TServiceType>
  ) => Result<TServiceType, ContainerError> {
    return <TServiceType extends ServiceType>(
      token: ApiSafeToken<TServiceType>
    ): Result<TServiceType, ContainerError> => {
      // Handle deprecation warnings
      this.handleDeprecationWarning(token);

      // Resolve with Result-Pattern (never throws)
      const result = container.resolveWithError(token);

      // Apply wrappers if resolution succeeded
      if (!result.ok) {
        // Convert DomainContainerError to ContainerError
        const containerError: ContainerError = {
          code: castContainerErrorCode(result.error.code),
          message: result.error.message,
          cause: result.error.cause,
          tokenDescription: result.error.message,
        };
        return err(containerError);
      }

      const service = castResolvedService<TServiceType>(result.value);

      const wrappedService = this.wrapSensitiveService(token, service, wellKnownTokens);
      return ok(wrappedService);
    };
  }

  /**
   * Applies read-only wrappers when API consumers resolve sensitive services.
   *
   * @param token - API token used for resolution
   * @param service - Service resolved from the container
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Wrapped service when applicable
   * @private
   */
  private wrapSensitiveService<TServiceType extends ServiceType>(
    token: ApiSafeToken<TServiceType>,
    service: TServiceType,
    wellKnownTokens: ModuleApiTokens
  ): TServiceType {
    if (token === wellKnownTokens.i18nFacadeToken) {
      return wrapI18nService(service, createPublicI18n);
    }

    if (token === wellKnownTokens.notificationCenterToken) {
      return wrapNotificationCenterService(service, createPublicNotificationCenter);
    }

    if (token === wellKnownTokens.foundrySettingsToken) {
      return wrapFoundrySettingsPort(service, createPublicFoundrySettings);
    }

    // Default: return original service for read-only or safe services
    return service;
  }

  /**
   * Creates the complete ModuleApi object with all methods.
   *
   * @param container - ContainerPort for service resolution
   * @param wellKnownTokens - Collection of API-safe tokens
   * @returns Complete ModuleApi object
   * @private
   */
  private createApiObject(container: ContainerPort, wellKnownTokens: ModuleApiTokens): ModuleApi {
    return {
      version: MODULE_CONSTANTS.API.VERSION,

      // Overloaded resolve method (throws on error)
      resolve: this.createResolveFunction(container, wellKnownTokens),

      // Result-Pattern method (safe, never throws)
      resolveWithError: this.createResolveWithErrorFunction(container, wellKnownTokens),

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
            isRegistered: getRegistrationStatus(isRegisteredResult),
          });
        }

        return tokenMap;
      },

      tokens: wellKnownTokens,

      getMetrics: () => {
        const metricsResult = container.resolveWithError(metricsCollectorToken);
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
        const metricsCollector: MetricsCollector = castMetricsCollector(metricsResult.value);
        return metricsCollector.getSnapshot();
      },

      getHealth: (): HealthStatus => {
        // Delegate to ModuleHealthService for health checks
        const healthServiceResult = container.resolveWithError(moduleHealthServiceToken);
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
        const healthService: ModuleHealthService = castModuleHealthService(
          healthServiceResult.value
        );
        return healthService.getHealth();
      },
    };
  }

  /**
   * Exposes the module's public API to game.modules.get(MODULE_ID).api
   *
   * @param container - Initialized and validated ContainerPort
   * @returns Result<void, string> - Ok if successful, Err with error message
   */
  expose(container: ContainerPort): Result<void, string> {
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

export class DIModuleApiInitializer extends ModuleApiInitializer {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
