import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ModuleApi, ModuleApiTokens, TokenInfo } from "@/core/module-api";
import type { ServiceType } from "@/types/servicetypeindex";
import { loggerToken, journalVisibilityServiceToken } from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
} from "@/foundry/foundrytokens";
import { PERFORMANCE_MARKS } from "@/core/performance-constants";
import { ENV } from "@/config/environment";

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
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap(): Result<ServiceContainer, string> {
    // Performance-Messung starten (nur in Debug-Mode)
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.BOOTSTRAP_START);
    }

    const container = ServiceContainer.createRoot();
    const configured = configureDependencies(container);

    // Performance-Messung beenden und loggen (nur in Debug-Mode)
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.BOOTSTRAP_END);
      performance.measure(
        PERFORMANCE_MARKS.BOOTSTRAP_DURATION,
        PERFORMANCE_MARKS.BOOTSTRAP_START,
        PERFORMANCE_MARKS.BOOTSTRAP_END
      );

      const measure = performance.getEntriesByName(PERFORMANCE_MARKS.BOOTSTRAP_DURATION)[0];
      if (measure && ENV.enableDebugMode) {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Bootstrap completed in ${measure.duration.toFixed(2)}ms`
        );
      }
    }

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

    // Type-safe token collection
    const wellKnownTokens: ModuleApiTokens = {
      loggerToken,
      journalVisibilityServiceToken,
      foundryGameToken,
      foundryHooksToken,
      foundryDocumentToken,
      foundryUIToken,
      foundrySettingsToken,
    };

    const api: ModuleApi = {
      resolve: <TServiceType extends ServiceType>(token: InjectionToken<TServiceType>) =>
        container.resolve<TServiceType>(token),

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
            isRegistered: isRegisteredResult.ok ? isRegisteredResult.value : false,
          });
        }

        return tokenMap;
      },

      tokens: wellKnownTokens,
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
