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
 * Safely gets the first element from a non-empty array.
 *
 * This function performs a runtime check to ensure the array is not empty.
 * If the array is empty, it throws an error to prevent undefined access.
 *
 * @template T - The type of array elements
 * @param array - Array that should have length > 0
 * @returns The first element of the array
 * @throws {Error} If the array is empty
 *
 * @example
 * ```typescript
 * const errors: Error[] = [new Error("test")];
 * if (isNonEmptyArray(errors)) {
 *   const firstError = getFirstArrayElement(errors);
 *   console.log(firstError.message);
 * }
 * ```
 */
export function getFirstArrayElement<T>(array: T[]): T {
  if (!isNonEmptyArray(array)) {
    throw new Error("Cannot get first element from empty array");
  }
  return array[0];
}
