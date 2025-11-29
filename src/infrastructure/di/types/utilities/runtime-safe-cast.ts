/**
 * Centralized helpers for a handful of runtime casts that are required by
 * the DI / cache / API infrastructure.
 *
 * Diese Datei ist absichtlich von der Type-Coverage ausgenommen, damit
 * wir an wenigen wohldokumentierten Stellen mit Runtime-Casts arbeiten
 * können, ohne den 100%-Anspruch für den restlichen Code zu verletzen.
 *
 * Diese Datei ist getrennt von `runtime-casts.ts` (Foundry-spezifische Casts),
 * da sie für die DI-Infrastruktur verwendet wird und ContainerError statt
 * FoundryError verwendet. Die Trennung ermöglicht klare Abhängigkeiten
 * und verhindert Import-Zyklen.
 */

import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type {
  RuntimeConfigKey,
  RuntimeConfigValues,
} from "@/application/services/RuntimeConfigService";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceRegistration } from "../core/serviceregistration";
import type { Result } from "@/domain/types/result";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";
import type { ContainerError } from "../../interfaces";
import { ok, err } from "@/domain/utils/result";

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
  create: (center: NotificationService) => NotificationService
): TServiceType {
  const concrete = service as unknown as NotificationService;
  return create(concrete) as unknown as TServiceType;
}

/**
 * Entspricht wrapI18nService, aber für FoundrySettings.
 */
export function wrapFoundrySettingsPort<TServiceType>(
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
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass die Instanz nicht `undefined` ist. Bei Fehlern wird ein ContainerError
 * zurückgegeben statt einen Error zu werfen, um konsistent mit dem Result-Pattern
 * zu bleiben.
 *
 * @template TServiceType - Der spezifische Service-Typ
 * @param instance - Die gecachte Service-Instanz (ServiceType union oder undefined)
 * @returns Result mit der Instanz als spezifischer generischer Typ oder ContainerError
 *
 * @remarks
 * Diese Funktion sollte nur verwendet werden, wenn sichergestellt ist, dass
 * die Instanz im Cache existiert. Für optionale Instanzen sollte
 * `castCachedServiceInstance()` verwendet werden.
 *
 * @see {@link castCachedServiceInstance} Für optionale Service-Instanzen
 */
export function castCachedServiceInstanceForResult<TServiceType extends ServiceType>(
  instance: ServiceType | undefined
): Result<TServiceType, ContainerError> {
  if (instance === undefined) {
    return err({
      code: "TokenNotRegistered",
      message:
        "castCachedServiceInstanceForResult: instance must not be undefined. Use castCachedServiceInstance() for optional instances.",
      details: {},
    });
  }
  return ok(instance as TServiceType);
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

/**
 * Extracts registration status from Result, with defensive fallback.
 *
 * This is a defensive check: isRegistered() should never fail in practice,
 * but the Result pattern requires handling the error case.
 *
 * @param result - Result from container.isRegistered()
 * @returns Registration status (true if registered, false on error)
 */
export function getRegistrationStatus(result: Result<boolean, ContainerError>): boolean {
  return result.ok ? result.value : false;
}

/**
 * Safely gets the first element from an array that has been checked for length > 0.
 *
 * This helper encapsulates the non-null assertion for array access after a length check.
 * TypeScript requires this cast because it cannot infer that array[0] is defined
 * even when array.length > 0 has been verified.
 *
 * The caller must ensure that array.length > 0 before calling this function.
 *
 * @param array - Array that has been verified to have length > 0
 * @returns The first element of the array (guaranteed to be defined)
 */
export function getFirstArrayElement<T>(array: T[]): T {
  // Type assertion is safe because caller must verify array.length > 0
  return array[0] as T;
}

/**
 * Safely checks if a value is an array and returns its first element if it exists.
 *
 * This helper provides type-safe array access with a type guard check.
 * It returns null if the input is not an array or the array is empty.
 *
 * @param value - Unknown value that might be an array
 * @returns The first element of the array if it exists and is of type T, null otherwise
 */
export function getFirstElementIfArray<T>(
  value: unknown,
  typeGuard: (element: unknown) => element is T
): T | null {
  if (Array.isArray(value) && value.length > 0) {
    const firstElement: unknown = value[0] as unknown;
    if (typeGuard(firstElement)) {
      return firstElement;
    }
  }
  return null;
}

/**
 * Casts a callback function to FoundryHookCallback.
 *
 * This is needed because TypeScript cannot infer that a generic callback
 * matches the FoundryHookCallback signature at the call site.
 * The caller must ensure the callback signature is compatible.
 *
 * @param callback - Callback function to cast
 * @returns The callback as FoundryHookCallback
 */
export function castToFoundryHookCallback(callback: unknown): FoundryHookCallback {
  return callback as FoundryHookCallback;
}

/**
 * Type-safe assertion for CacheKey brand.
 *
 * This function encapsulates the brand assertion required for CacheKey.
 * The type safety is guaranteed by the structured usage of CacheKey creation
 * through createCacheKey() and the normalization process.
 *
 * @param value - The normalized string value to assert as CacheKey
 * @returns The value branded as CacheKey
 *
 * @example
 * ```typescript
 * const key = assertCacheKey("namespace:resource:id");
 * ```
 */
export function assertCacheKey(
  value: string
): import("@/infrastructure/cache/cache.interface").CacheKey {
  return value as import("@/infrastructure/cache/cache.interface").CacheKey;
}

/**
 * Safely casts an object to Record<string, unknown>.
 *
 * This function encapsulates the cast required when TypeScript cannot
 * narrow an object type to Record<string, unknown> even after runtime validation.
 * The caller must ensure that the value is an object before calling this function.
 *
 * @param value - The object value that has been validated as an object
 * @returns The value as Record<string, unknown>
 */
export function castToRecord(value: unknown): Record<string, unknown> {
  return value as Record<string, unknown>;
}

/**
 * Safely normalizes an object to Record<string, unknown>.
 *
 * This function creates a new Record from an object, ensuring type safety.
 * The caller must ensure that the value is an object before calling this function.
 *
 * @param value - The object value that has been validated as an object
 * @returns A new Record<string, unknown> with the object's properties
 */
export function normalizeToRecord(value: unknown): Record<string, unknown> {
  return Object.assign({}, value as Record<string, unknown>);
}
