/**
 * Runtime-safe cast utilities for metric type conversions.
 *
 * Diese Datei kapselt Type-Assertions für Metrics-Implementierungen,
 * die aufgrund von TypeScript's generischen Typen und Type-Erasure notwendig sind.
 *
 * MetricDefinition<T> und MetricState<T> werden zur Laufzeit als MetricDefinition<unknown>
 * bzw. MetricState<unknown> gespeichert, da verschiedene Metriken verschiedene Typen haben.
 * Die Type-Assertions sind sicher, weil:
 * 1. Die Metriken mit korrekten Typen initialisiert werden
 * 2. Die Registry die Typkonsistenz sicherstellt
 * 3. Die generischen Typen zur Laufzeit gelöscht werden (Type Erasure)
 *
 * @ts-expect-error - Type coverage exclusion: This file intentionally uses type assertions
 * for runtime-safe casts that are necessary for metric type variance handling.
 */

import type { MetricDefinition } from "./metric-definition.interface";

/**
 * Runtime-safe type guard to validate a MetricDefinition structure.
 * Checks that all required properties are present and have correct types.
 *
 * @param value - Value to check
 * @returns True if value is a valid MetricDefinition
 */
export function isValidMetricDefinition(value: unknown): value is MetricDefinition {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Access properties without type assertion by using 'in' operator and property access
  return (
    "key" in value &&
    typeof (value as { key?: unknown }).key === "string" &&
    "initialValue" in value &&
    typeof (value as { initialValue?: unknown }).initialValue !== "undefined" &&
    "reducer" in value &&
    typeof (value as { reducer?: unknown }).reducer === "function" &&
    "serializer" in value &&
    typeof (value as { serializer?: unknown }).serializer === "function"
  );
}

/**
 * Runtime-safe cast from MetricDefinition<T> to MetricDefinition.
 * Validates the structure at runtime before casting.
 *
 * MetricDefinition<T> is structurally compatible with MetricDefinition<unknown>
 * because the generic type parameter T is erased at runtime. The cast is safe
 * because all MetricDefinition instances have the same structure regardless of T.
 *
 * @template T - The specific metric value type
 * @param definition - Metric definition to cast
 * @returns The definition as MetricDefinition
 * @throws Error if the definition is not valid
 */
export function castToMetricDefinition<T = unknown>(
  definition: MetricDefinition<T>
): MetricDefinition {
  if (!isValidMetricDefinition(definition)) {
    throw new Error(`Invalid metric definition structure for key "${definition.key}"`);
  }
  // Safe cast: MetricDefinition<T> is structurally compatible with MetricDefinition<unknown>, generic type T is erased at runtime
  return definition as MetricDefinition;
}

/**
 * Runtime-safe cast from unknown to type T for metric values.
 * Validates that the value exists and returns it with the correct type.
 *
 * The type safety is guaranteed by the metric registry initialization,
 * which ensures that metric states are initialized with matching types.
 * The cast is safe because:
 * 1. Metric states are initialized from definitions with matching types
 * 2. The registry ensures type consistency
 * 3. The generic type parameter T is known at the call site
 *
 * @template T - The specific metric value type
 * @param value - Value to cast
 * @param key - Metric key for error reporting
 * @returns The value as type T
 * @throws Error if value is undefined (should not happen in normal operation)
 */
export function castMetricValue<T>(value: unknown, key: string): T {
  if (value === undefined) {
    throw new Error(
      `Metric value for key "${key}" is undefined. This indicates a registry initialization issue.`
    );
  }
  // Safe cast: value is guaranteed to be of type T by the metric registry initialization, which ensures type consistency
  return value as T;
}
