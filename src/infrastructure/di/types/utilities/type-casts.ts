/**
 * Generic type cast utilities.
 *
 * Diese Datei enthält KEINE Abhängigkeiten zu ServiceType oder spezifischen Services.
 * Nur rein generische Type-Level-Operationen.
 *
 * Unterschied zu runtime-safe-cast.ts:
 * - runtime-safe-cast.ts: DI-Container-spezifisch, nutzt spezifische Service-Types
 * - type-casts.ts: Generisch, keine Domain-Knowledge
 *
 * WICHTIG: CacheKey wird hier inline definiert, um Zyklus mit cache.interface.ts zu vermeiden!
 * cache.interface.ts re-exportiert dann CacheKey von hier.
 */

/**
 * Normalized cache key used by CacheService.
 *
 * Inline definiert, um zirkuläre Dependency mit cache.interface.ts zu vermeiden.
 * Brand Type Pattern: Ein String mit einem eindeutigen Symbol-Brand.
 */
export type CacheKey = string & { readonly __cacheKeyBrand: unique symbol };

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
export function assertCacheKey(value: string): CacheKey {
  return value as CacheKey;
}
