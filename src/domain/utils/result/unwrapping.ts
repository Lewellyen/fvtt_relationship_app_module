/**
 * Functions for unwrapping Result values with fallbacks.
 */
import type { Result } from "@/domain/types/result";

/**
 * Unwraps a successful Result or returns a fallback value if it's an error.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param result - The Result to unwrap
 * @param fallbackValue - The value to return if the Result is an error
 * @returns The success value, or the fallback value
 *
 * @example
 * ```typescript
 * const num = ok(42);
 * unwrapOr(num, 0); // 42
 *
 * const err = err("Failed");
 * unwrapOr(err, 0); // 0
 * ```
 */
export function unwrapOr<SuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>,
  fallbackValue: SuccessType
): SuccessType {
  return result.ok ? result.value : fallbackValue;
}

/**
 * Unwraps a successful Result or computes a fallback value from the error.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param result - The Result to unwrap
 * @param getFallback - Function that computes a fallback from the error
 * @returns The success value, or the computed fallback value
 *
 * @example
 * ```typescript
 * const num = err("Not found");
 * unwrapOrElse(num, error => 0); // 0
 * ```
 */
export function unwrapOrElse<SuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>,
  getFallback: (error: ErrorType) => SuccessType
): SuccessType {
  return result.ok ? result.value : getFallback(result.error);
}

/**
 * Unwraps a successful Result or throws an error if it's a failure.
 * Use with caution - this defeats the purpose of using Result pattern.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @template ThrownError - The type of error to throw (must extend Error)
 * @param result - The Result to unwrap
 * @param toError - Optional function to convert the error to a thrown Error
 * @returns The success value
 * @throws ThrownError if the Result is an error
 *
 * @example
 * ```typescript
 * const num = ok(42);
 * getOrThrow(num); // 42
 *
 * const failure = err("Not found");
 * getOrThrow(failure); // throws Error("Not found")
 * ```
 */
export function getOrThrow<SuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>,
  toError?: (error: ErrorType) => Error
): SuccessType {
  if (result.ok) return result.value;
  const e = toError ? toError(result.error) : new Error(String(result.error));
  throw e;
}
