/**
 * Application-layer array utility functions.
 *
 * These functions provide type-safe array operations for use in application services.
 */

/**
 * Type guard to check if an array is non-empty.
 * Narrows the type to ensure at least one element exists.
 *
 * @template T - The type of array elements
 * @param array - Array to check
 * @returns True if array has at least one element
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

/**
 * Gets the first element from a VERIFIED non-empty array.
 *
 * ⚠️ PRECONDITION: Caller MUST verify array.length > 0 before calling.
 *
 * This is a type-level helper for situations where TypeScript cannot infer
 * that array[0] is defined after a length check. Use this ONLY when you
 * already have a guard like: if (errors.length > 0) { ... }
 *
 * For cases without a guard, use getFirstArrayElementSafe() instead.
 *
 * The function uses an internal type guard to satisfy TypeScript's type system
 * without requiring a type assertion. If the precondition is violated,
 * it throws an error (this should never happen if caller follows contract).
 *
 * @template T - The type of array elements
 * @param array - Array that has been verified to have length > 0
 * @returns The first element of the array
 *
 * @example
 * ```typescript
 * const errors: Error[] = [new Error("test")];
 * if (errors.length > 0) {
 *   const firstError = getFirstArrayElement(errors);
 *   console.log(firstError.message);
 * }
 * ```
 */
export function getFirstArrayElement<T>(array: T[]): T {
  // Use type guard internally so TypeScript can narrow the type
  // This allows TypeScript to infer that array[0] is safe without type assertions
  if (!isNonEmptyArray(array)) {
    // This should never happen if caller follows the precondition
    // But we need this check for TypeScript to narrow the type correctly
    throw new Error("Array must have length > 0 (caller violated precondition)");
  }
  // TypeScript now knows array is [T, ...T[]], so array[0] is safe
  return array[0];
}

/**
 * Safely gets the first element from an array WITH built-in empty check.
 *
 * Returns null if the array is empty. Use this when you don't have a
 * length guard and want the function to handle the empty case for you.
 *
 * For cases where you already have a guard, use getFirstArrayElement() instead.
 *
 * @template T - The type of array elements
 * @param array - Array to get the first element from
 * @returns The first element or null if array is empty
 *
 * @example
 * ```typescript
 * const errors: Error[] = getErrors();
 * const firstError = getFirstArrayElementSafe(errors);
 * if (firstError !== null) {
 *   console.log(firstError.message);
 * }
 * ```
 */
export function getFirstArrayElementSafe<T>(array: T[]): T | null {
  return isNonEmptyArray(array) ? array[0] : null;
}
