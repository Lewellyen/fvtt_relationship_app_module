import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import { markAsApiSafe } from "@/di_infrastructure/types/api-safe-token";
import type { ModuleApi, ModuleApiTokens, TokenInfo, HealthStatus } from "@/core/module-api";
import type { ServiceType } from "@/types/servicetypeindex";
import { ENV } from "@/config/environment";
import { BootstrapPerformanceTracker } from "@/observability/bootstrap-performance-tracker";
import {
  loggerToken,
  journalVisibilityServiceToken,
  metricsCollectorToken,
  moduleHealthServiceToken,
} from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
} from "@/foundry/foundrytokens";

/**
 * CompositionRoot
 *
 * Zentraler Bootkernel: erstellt den DI-Container, führt die Basis-Registrierungen
 * via configureDependencies aus und stellt die öffentliche Modul-API (nur resolve)
 * unter game.modules.get(MODULE_ID).api bereit.
 *
 * Zweiphasiger Bootstrap:
 * - Phase 1 (vor Foundry init): Container erstellen und Grund-Registrierungen.
 * - Phase 2 (im Foundry init): Ports selektieren/binden und Hooks registrieren.
 */
export class CompositionRoot {
  private container: ServiceContainer | null = null;

  /**
   * Erstellt den ServiceContainer und führt Basis-Registrierungen aus.
   * Misst Performance für Diagnose-Zwecke.
   *
   * **Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV (direct import) and null MetricsCollector.
   * MetricsCollector is not yet available during bootstrap phase.
   *
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap(): Result<ServiceContainer, string> {
    const container = ServiceContainer.createRoot();

    // Track bootstrap performance (no MetricsCollector yet)
    const performanceTracker = new BootstrapPerformanceTracker(ENV, null);

    const configured = performanceTracker.track(
      () => configureDependencies(container),
      /* c8 ignore start -- onComplete callback is only called when performance tracking is enabled and sampling passes */
      (duration) => {
        // Use logger from container if available (container is validated at this point)
        const loggerResult = container.resolveWithError(loggerToken);
        if (loggerResult.ok) {
          loggerResult.value.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
        }
      }
      /* c8 ignore stop */
    );

    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }
    return { ok: false, error: configured.error };
  }

  /**
   * Exponiert die öffentliche Modul-API unter game.modules.get(MODULE_ID).api.
   * Stellt resolve(), getAvailableTokens() und tokens bereit.
   * Darf erst nach erfolgreichem Bootstrap aufgerufen werden.
   * @throws Fehler, wenn das Foundry-Modul-Objekt nicht verfügbar ist
   */
  /* c8 ignore next -- Requires Foundry game module globals */
  exposeToModuleApi(): void {
    const containerResult = this.getContainer();
    if (!containerResult.ok) {
      throw new Error(containerResult.error);
    }
    const container = containerResult.value;

    // game.modules is typed as ModuleCollection (Map<string, Module>) by fvtt-types
    if (typeof game === "undefined" || !game?.modules) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Game modules not available`);
    }
    const mod = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    if (!mod) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Module not available to expose API`);
    }

    // Type-safe token collection - mark all tokens as API-safe for external consumption
    const wellKnownTokens: ModuleApiTokens = {
      loggerToken: markAsApiSafe(loggerToken),
      journalVisibilityServiceToken: markAsApiSafe(journalVisibilityServiceToken),
      foundryGameToken: markAsApiSafe(foundryGameToken),
      foundryHooksToken: markAsApiSafe(foundryHooksToken),
      foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
      foundryUIToken: markAsApiSafe(foundryUIToken),
      foundrySettingsToken: markAsApiSafe(foundrySettingsToken),
    };

    const api: ModuleApi = {
      version: MODULE_CONSTANTS.API.VERSION,

      // Bind container.resolve() directly (already typed as ApiSafeToken in ModuleApi interface)
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- API boundary: External modules use resolve()
      resolve: container.resolve.bind(container),

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

    // Type-safe assignment thanks to Module augmentation in global.d.ts
    mod.api = api;
  }

  /**
   * Liefert den initialisierten Container als Result.
   * @returns Result mit Container oder Fehlermeldung
   */
  getContainer(): Result<ServiceContainer, string> {
    if (!this.container) {
      return { ok: false, error: `${MODULE_CONSTANTS.LOG_PREFIX} Container not initialized` };
    }
    return { ok: true, value: this.container };
  }
}
