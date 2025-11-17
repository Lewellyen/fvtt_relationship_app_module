/**
 * Centralized helpers for Foundry-specific runtime casts that are required by
 * the Foundry adapter layer (ports, services, facades).
 *
 * Diese Datei ist absichtlich von der Type-Coverage ausgenommen, damit
 * wir an wenigen wohldokumentierten Stellen mit Runtime-Casts arbeiten
 * können, ohne den 100%-Anspruch für den restlichen Code zu verletzen.
 *
 * Analog zu `src/di_infrastructure/types/runtime-safe-cast.ts` für DI-Infrastruktur.
 */

import type { SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Type-safe interface for Foundry Settings with dynamic namespaces.
 * Avoids 'any' while working around fvtt-types namespace restrictions.
 */
export interface DynamicSettingsApi {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): void;
  get<T>(namespace: string, key: string): T;
  set<T>(namespace: string, key: string, value: T): Promise<T>;
}

/**
 * Kapselt den notwendigen Cast für `game.settings` mit dynamischen Namespaces.
 * Foundry's Settings API unterstützt Modul-Namespaces, aber fvtt-types
 * beschränkt den Namespace-Typ auf "core" nur.
 *
 * @param settings - Das game.settings Objekt (unknown, da game global ist)
 * @returns Das Settings-Objekt als DynamicSettingsApi gecastet
 */
export function castFoundrySettingsApi(settings: unknown): DynamicSettingsApi {
  return settings as DynamicSettingsApi;
}

/**
 * Kapselt den notwendigen Cast für JournalEntry.getFlag mit modul-spezifischen Scopes.
 * fvtt-types JournalEntry.getFlag hat einen restriktiven Scope-Typ ("core" nur),
 * aber Modul-Flags verwenden die Modul-ID als Scope.
 *
 * @param document - Das Foundry-Dokument (unknown, da Typen variieren)
 * @returns Das Dokument mit getFlag-Methode für generische Scopes
 */
export function castFoundryDocumentForFlag(document: unknown): {
  getFlag: (scope: string, key: string) => unknown;
} {
  return document as { getFlag: (scope: string, key: string) => unknown };
}

/**
 * Kapselt den Cast nach Runtime-Type-Check für FoundryError.
 * Wird verwendet, wenn bereits zur Laufzeit geprüft wurde, dass das Error-Objekt
 * die FoundryError-Struktur hat (code, message vorhanden).
 *
 * @param error - Das Error-Objekt (unknown, da es verschiedene Fehlerquellen gibt)
 * @returns Das Error als FoundryError gecastet
 */
export function castFoundryError(error: unknown): FoundryError {
  return error as FoundryError;
}

/**
 * Kapselt den Double-Cast für Disposable-Interface in FoundryServiceBase.
 * Ports sind als generischer ServiceType typisiert, aber zur Laufzeit
 * kann geprüft werden, ob sie das Disposable-Interface implementieren.
 *
 * @param port - Der Port (unknown, da generischer ServiceType)
 * @returns Der Port als Disposable gecastet
 */
export function castDisposablePort(port: unknown): Disposable {
  return port as unknown as Disposable;
}

/**
 * Type-Guard für Non-Empty-Arrays mit Assertion.
 * Stellt sicher, dass ein Array mindestens ein Element hat.
 * Ersetzt Non-Null-Assertions durch type-safe Guards.
 *
 * @template T - Der Element-Typ
 * @param arr - Das Array, das geprüft werden soll
 * @throws {Error} Wenn das Array leer ist
 * @returns Type-Guard-Assertion, dass das Array non-empty ist
 */
export function assertNonEmptyArray<T>(arr: T[]): asserts arr is [T, ...T[]] {
  if (arr.length === 0) {
    throw new Error("Array must not be empty");
  }
}
