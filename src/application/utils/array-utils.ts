/**
 * Application-layer array utility functions.
 *
 * These functions provide type-safe array operations for use in application services.
 */

/**
 * Safely gets the first element from an array that has been checked for length > 0.
 *
 * This helper encapsulates the non-null assertion for array access after a length check.
 * TypeScript requires this cast because it cannot infer that array[0] is defined
 * even when array.length > 0 has been verified.
 *
 * The caller must ensure that array.length > 0 before calling this function.
 *
 * @template T - The type of array elements
 * @param array - Array that has been verified to have length > 0
 * @returns The first element of the array (guaranteed to be defined)
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
  // Type assertion is safe because caller must verify array.length > 0
  return array[0] as T;
}

