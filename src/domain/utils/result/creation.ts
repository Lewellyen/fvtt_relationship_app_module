/**
 * Functions for creating Result instances.
 */
import type { Ok, Err } from "@/domain/types/result";

/**
 * Creates a successful Result with a value.
 *
 * @template SuccessType - The type of the successful value
 * @param value - The successful value to wrap
 * @returns A Result indicating success with the provided value
 *
 * @example
 * ```typescript
 * const success = ok(42);
 * // { ok: true, value: 42 }
 * ```
 */
export function ok<SuccessType>(value: SuccessType): Ok<SuccessType> {
  return { ok: true, value };
}

/**
 * Creates an error Result with an error value.
 *
 * @template ErrorType - The type of the error value
 * @param error - The error to wrap
 * @returns A Result indicating failure with the provided error
 *
 * @example
 * ```typescript
 * const failure = err("Not found");
 * // { ok: false, error: "Not found" }
 * ```
 */
export function err<ErrorType>(error: ErrorType): Err<ErrorType> {
  return { ok: false, error };
}
