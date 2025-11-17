/**
 * Centralized helpers for a handful of runtime casts that are required by
 * the DI / cache / API infrastructure.
 *
 * Diese Datei ist absichtlich von der Type-Coverage ausgenommen, damit
 * wir an wenigen wohldokumentierten Stellen mit Runtime-Casts arbeiten
 * können, ohne den 100%-Anspruch für den restlichen Code zu verletzen.
 */

import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type {
  RuntimeConfigKey,
  RuntimeConfigValues,
} from "@/core/runtime-config/runtime-config.service";
import type { ServiceType } from "@/types/servicetypeindex";
import type { InjectionToken } from "./injectiontoken";
import type { ServiceRegistration } from "./serviceregistration";

/**
 * Listener-Typ aus RuntimeConfigService – hier als Alias erneut definiert,
 * um Import-Zyklen zu vermeiden.
 */
export type RuntimeConfigListener<K extends RuntimeConfigKey> = (
  value: RuntimeConfigValues[K]
) => void;

/**
 * Hebt die Generik der Listener-Set-Instanz auf den gemeinsamen Key-Typ an.
 * Zur Laufzeit sind alle Listener gleichförmig, daher ist dieser Cast
 * rein für den TypeScript-Typchecker relevant.
 */
export function widenRuntimeConfigListeners<K extends RuntimeConfigKey>(
  listeners: Set<RuntimeConfigListener<K>>
): Set<RuntimeConfigListener<RuntimeConfigKey>> {
  return listeners as Set<RuntimeConfigListener<RuntimeConfigKey>>;
}

/**
 * Hilfsfunktion für ReadOnly-Wrapper: konvertiert eine Schlüssel-Liste,
 * die als keyof T getypt ist, in ein string-Array für includes().
 */
export function toStringKeyArray<T extends Record<string, unknown>>(
  allowed: readonly (keyof T)[]
): readonly string[] {
  return allowed as readonly string[];
}

/**
 * Kapselt den notwendigen Cast vom Cache-Wert (unknown) auf den
 * erwarteten TValue. Die Typsicherheit wird durch die Aufrufer
 * (strukturierte Nutzung von CacheKeys) gewährleistet.
 */
export function castCacheValue<TValue>(value: unknown): TValue {
  return value as TValue;
}

/**
 * Wrapper für I18nFacadeService im Module-API-Kontext.
 * Kapselt die notwendige Umwandlung von ServiceType → I18nFacadeService
 * und wieder zurück zu generischem TServiceType.
 */
export function wrapI18nService<TServiceType>(
  service: TServiceType,
  create: (i18n: I18nFacadeService) => I18nFacadeService
): TServiceType {
  const concrete = service as unknown as I18nFacadeService;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Entspricht wrapI18nService, aber für NotificationCenter.
 */
export function wrapNotificationCenterService<TServiceType>(
  service: TServiceType,
  create: (center: NotificationCenter) => NotificationCenter
): TServiceType {
  const concrete = service as unknown as NotificationCenter;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Entspricht wrapI18nService, aber für FoundrySettings.
 */
export function wrapFoundrySettingsService<TServiceType>(
  service: TServiceType,
  create: (settings: FoundrySettings) => FoundrySettings
): TServiceType {
  const concrete = service as unknown as FoundrySettings;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Kapselt den notwendigen Cast für gecachte Service-Instanzen.
 * Die Typsicherheit wird durch die Aufrufer gewährleistet, die sicherstellen,
 * dass der Token mit dem korrekten generischen Typ registriert wurde.
 *
 * @param instance - Die gecachte Service-Instanz (ServiceType union)
 * @returns Die Instanz als spezifischer generischer Typ
 */
export function castCachedServiceInstance<TServiceType extends ServiceType>(
  instance: ServiceType | undefined
): TServiceType | undefined {
  return instance as TServiceType | undefined;
}

/**
 * Kapselt den notwendigen Cast für gecachte Service-Instanzen in Result-Kontext.
 * Wird verwendet, wenn sichergestellt ist, dass die Instanz existiert.
 *
 * @param instance - Die gecachte Service-Instanz (ServiceType union)
 * @returns Die Instanz als spezifischer generischer Typ
 */
export function castCachedServiceInstanceForResult<TServiceType extends ServiceType>(
  instance: ServiceType | undefined
): TServiceType {
  return instance as TServiceType;
}

/**
 * Kapselt den notwendigen Cast für ServiceRegistration Map-Einträge.
 * Map.entries() verliert generische Typ-Information während der Iteration,
 * daher ist dieser Cast notwendig, um die korrekten Typen wiederherzustellen.
 *
 * @param token - Der Injection Token (symbol)
 * @param registration - Die ServiceRegistration (ServiceType union)
 * @returns Tuple mit typisierten Token und Registration
 */
export function castServiceRegistrationEntry(
  token: symbol,
  registration: ServiceRegistration<ServiceType>
): [InjectionToken<ServiceType>, ServiceRegistration<ServiceType>] {
  return [token as InjectionToken<ServiceType>, registration as ServiceRegistration<ServiceType>];
}

/**
 * Iteriert über ServiceRegistration Map-Einträge mit korrekter Typisierung.
 * Map.entries() verliert generische Typ-Information während der Iteration,
 * daher ist diese Funktion notwendig, um die korrekten Typen wiederherzustellen.
 *
 * @param entries - Die Map-Einträge (Iterable von [symbol, ServiceRegistration<ServiceType>])
 * @returns Iterable von typisierten [InjectionToken, ServiceRegistration] Tuples
 */
export function* iterateServiceRegistrationEntries(
  entries: Iterable<[symbol, ServiceRegistration<ServiceType>]>
): IterableIterator<[InjectionToken<ServiceType>, ServiceRegistration<ServiceType>]> {
  for (const [token, registration] of entries) {
    yield castServiceRegistrationEntry(token, registration);
  }
}
