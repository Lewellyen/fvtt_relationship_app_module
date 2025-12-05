/**
 * Runtime-safe cast utilities für DI container internals.
 *
 * NUR Container-interne Operationen!
 * Für Bootstrap: siehe bootstrap-casts.ts
 * Für API: siehe api-casts.ts
 * Für Generics: siehe type-casts.ts
 *
 * Diese Datei enthält KEINE spezifischen Service-Imports mehr!
 * Alle Service-spezifischen Casts wurden in separate Dateien ausgelagert.
 *
 * @ts-expect-error - Type coverage exclusion: This file intentionally uses type assertions
 * for runtime-safe casts that are necessary for the DI infrastructure.
 */

import type { InjectionToken } from "../core/injectiontoken";
import type { ServiceRegistration } from "../core/serviceregistration";
import type { Result } from "@/domain/types/result";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";
import type { ContainerError, Container } from "../../interfaces";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * Kapselt den notwendigen Cast für gecachte Service-Instanzen.
 * Die Typsicherheit wird durch die Aufrufer gewährleistet, die sicherstellen,
 * dass der Token mit dem korrekten generischen Typ registriert wurde.
 *
 * @param instance - Die gecachte Service-Instanz (unknown)
 * @returns Die Instanz als spezifischer generischer Typ
 */
export function castCachedServiceInstance<T>(instance: unknown | undefined): T | undefined {
  return instance as T | undefined;
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
 * @template T - Der spezifische Service-Typ
 * @param instance - Die gecachte Service-Instanz (unknown oder undefined)
 * @returns Result mit der Instanz als spezifischer generischer Typ oder ContainerError
 *
 * @remarks
 * Diese Funktion sollte nur verwendet werden, wenn sichergestellt ist, dass
 * die Instanz im Cache existiert. Für optionale Instanzen sollte
 * `castCachedServiceInstance()` verwendet werden.
 *
 * @see {@link castCachedServiceInstance} Für optionale Service-Instanzen
 */
export function castCachedServiceInstanceForResult<T>(
  instance: unknown | undefined
): Result<T, ContainerError> {
  if (instance === undefined) {
    return err({
      code: "TokenNotRegistered",
      message:
        "castCachedServiceInstanceForResult: instance must not be undefined. Use castCachedServiceInstance() for optional instances.",
      details: {},
    });
  }
  return ok(instance as T);
}

/**
 * Kapselt den notwendigen Cast für ServiceRegistration Map-Einträge.
 * Map.entries() verliert generische Typ-Information während der Iteration,
 * daher ist dieser Cast notwendig, um die korrekten Typen wiederherzustellen.
 *
 * @param token - Der Injection Token (symbol)
 * @param registration - Die ServiceRegistration (unknown)
 * @returns Tuple mit typisierten Token und Registration
 */
export function castServiceRegistrationEntry(
  token: symbol,
  registration: ServiceRegistration<unknown>
): [InjectionToken<unknown>, ServiceRegistration<unknown>] {
  return [token as InjectionToken<unknown>, registration as ServiceRegistration<unknown>];
}

/**
 * Iteriert über ServiceRegistration Map-Einträge mit korrekter Typisierung.
 * Map.entries() verliert generische Typ-Information während der Iteration,
 * daher ist diese Funktion notwendig, um die korrekten Typen wiederherzustellen.
 *
 * @param entries - Die Map-Einträge (Iterable von [symbol, ServiceRegistration<unknown>])
 * @returns Iterable von typisierten [InjectionToken, ServiceRegistration] Tuples
 */
export function* iterateServiceRegistrationEntries(
  entries: Iterable<[symbol, ServiceRegistration<unknown>]>
): IterableIterator<[InjectionToken<unknown>, ServiceRegistration<unknown>]> {
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
 * Kapselt den notwendigen Cast für Container-Auflösungen in Bootstrapper-Dateien.
 * Diese Funktionen sind runtime-safe, da der Container die korrekten Typen zurückgibt.
 */

/**
 * Generic Service Resolution Cast
 * Nur für interne Container-Operationen!
 * Für Bootstrap-spezifische Casts: siehe bootstrap-casts.ts
 */
export function castResolvedService<T>(value: unknown): T {
  return value as T;
}

/**
 * Container Error Code Cast
 */
export function castContainerErrorCode(code: string): ContainerError["code"] {
  return code as ContainerError["code"];
}

/**
 * Casts a Container token to ContainerPort token for alias registration.
 * Runtime-safe because ServiceContainer implements both Container and ContainerPort.
 * This is needed when registering ContainerPort as an alias to ServiceContainer,
 * as the type system cannot automatically infer the compatibility.
 */
export function castContainerTokenToContainerPortToken(
  token: InjectionToken<Container>
): InjectionToken<ContainerPort> {
  return token as unknown as InjectionToken<ContainerPort>;
}
