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
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";

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
 * Type-Guard für Non-Empty-Arrays mit Result-Pattern.
 * Stellt sicher, dass ein Array mindestens ein Element hat.
 * Ersetzt Non-Null-Assertions durch type-safe Guards.
 *
 * @template T - Der Element-Typ
 * @param arr - Das Array, das geprüft werden soll
 * @returns Result mit type-narrowed non-empty array oder FoundryError
 */
export function ensureNonEmptyArray<T>(arr: T[]): Result<[T, ...T[]], FoundryError> {
  if (arr.length === 0) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Array must not be empty", { arrayLength: 0 })
    );
  }
  return ok(arr as [T, ...T[]]);
}

/**
 * Extracts HTMLElement from hook argument.
 *
 * In Foundry VTT V13+, hooks receive native HTMLElement directly.
 * jQuery support has been deprecated and is no longer needed.
 *
 * @param html - The hook argument (unknown type)
 * @returns HTMLElement if the argument is an HTMLElement, null otherwise
 */
export function extractHtmlElement(html: unknown): HTMLElement | null {
  return html instanceof HTMLElement ? html : null;
}

/**
 * Gets a factory from a Map or returns an error if not found.
 *
 * This is a defensive check: theoretically, if a version exists in the Map keys,
 * the factory should also exist. However, TypeScript's type system doesn't
 * guarantee this, so the check exists for type safety.
 *
 * @template T - The type that the factory creates
 * @param factories - Map of version numbers to factory functions
 * @param version - The version to look up
 * @returns Result with factory function or error
 */
export function getFactoryOrError<T>(
  factories: Map<number, () => T>,
  version: number
): Result<() => T, FoundryError> {
  const factory = factories.get(version);
  if (!factory) {
    return err(
      createFoundryError("PORT_NOT_FOUND", `Factory for version ${version} not found in registry`, {
        version,
      })
    );
  }
  return ok(factory);
}
