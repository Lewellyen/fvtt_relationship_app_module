/**
 * Runtime-safe cast utilities for registry type conversions.
 *
 * Diese Datei kapselt Type-Assertions für Registry-Implementierungen,
 * die aufgrund von TypeScript's Varianzregeln notwendig sind.
 *
 * SettingDefinition und RuntimeConfigBinding sind invariant aufgrund
 * von Callbacks, aber zur Laufzeit sind die Werte kompatibel mit
 * den generischen Typen (unknown, RuntimeConfigKey).
 */

import type { SettingDefinition } from "@/application/settings/setting-definition.interface";
import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { RuntimeConfigBinding } from "@/application/services/RuntimeConfigSync";

/**
 * Converts a SettingDefinition<T> to SettingDefinition<unknown>.
 *
 * SettingDefinition is invariant due to the onChange callback, but at runtime
 * all definitions are compatible with SettingDefinition<unknown> because Foundry
 * calls onChange with the validated type T.
 *
 * @template T - The specific setting value type
 * @param definition - The setting definition with specific type
 * @returns The definition as SettingDefinition<unknown>
 */
export function castSettingDefinitionToUnknown<T>(
  definition: SettingDefinition<T>
): SettingDefinition<unknown> {
  return definition as SettingDefinition<unknown>;
}

/**
 * Converts a RuntimeConfigBinding<TSchema, K> to RuntimeConfigBinding<unknown, RuntimeConfigKey>.
 *
 * RuntimeConfigBinding has specific types per key, but we need a generic type
 * for Map iteration in registry implementations. The cast is safe because:
 * 1. The validator will check the value at runtime
 * 2. The normalize function receives values that have already been validated
 * 3. At runtime, the value will be of the specific type when used
 *
 * This function accepts the binding as unknown first to handle union types from Object.entries(),
 * then casts it to the generic type needed for the registry.
 *
 * @param binding - The binding (can be a union of specific binding types from Object.entries())
 * @returns The binding as RuntimeConfigBinding<unknown, RuntimeConfigKey>
 */
export function castBindingToUnknown(
  binding: unknown
): RuntimeConfigBinding<unknown, RuntimeConfigKey> {
  return binding as RuntimeConfigBinding<unknown, RuntimeConfigKey>;
}
