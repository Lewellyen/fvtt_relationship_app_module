import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ModuleApi } from "@/core/module-api";
import type { ServiceType } from "@/types/servicetypeindex";

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
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap(): Result<ServiceContainer, string> {
    const container = ServiceContainer.createRoot();
    const configured = configureDependencies(container);
    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }
    return { ok: false, error: configured.error };
  }

  /**
   * Exponiert die öffentliche Modul-API (nur resolve) unter game.modules.get(MODULE_ID).api.
   * Darf erst nach erfolgreichem Bootstrap aufgerufen werden.
   * @throws Fehler, wenn das Foundry-Modul-Objekt nicht verfügbar ist
   */
  exposeToModuleApi(): void {
    const container = this.getContainerOrThrow();
    // game.modules is typed as ModuleCollection (Map<string, Module>) by fvtt-types
    if (typeof game === "undefined" || !game?.modules) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Game modules not available`);
    }
    const mod = game.modules.get(MODULE_CONSTANTS.MODULE.ID);
    if (!mod) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Module not available to expose API`);
    }
    const api: ModuleApi = {
      resolve: <TServiceType extends ServiceType>(token: InjectionToken<TServiceType>) =>
        container.resolve<TServiceType>(token),
    };
    // Type-safe assignment thanks to Module augmentation in global.d.ts
    mod.api = api;
  }

  /**
   * Liefert den initialisierten Container oder wirft einen Fehler, wenn noch nicht verfügbar.
   * @throws Fehler, wenn bootstrap noch nicht erfolgreich war
   */
  getContainerOrThrow(): ServiceContainer {
    if (!this.container) {
      throw new Error(`${MODULE_CONSTANTS.LOG_PREFIX} Container not initialized`);
    }
    return this.container;
  }
}
