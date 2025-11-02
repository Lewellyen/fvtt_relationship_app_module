import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";

/**
 * Öffentliche Modul-API: stellt ausschließlich resolve(token) bereit.
 * @example
 * const logger = game.modules.get(MODULE_ID).api.resolve(loggerToken);
 */
export interface ModuleApi {
  // Externe Auflösung von Diensten über InjectionToken
  resolve: <TServiceType extends ServiceType>(token: InjectionToken<TServiceType>) => TServiceType;
}
