/**
 * Functions for error handling and lifting regular functions to Results.
 */
import type { Result } from "@/domain/types/result";
import { ok, err } from "./creation";

/**
 * Executes a function and wraps the result in a Result, catching any thrown errors.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param fn - The function to execute
 * @param mapUnknownError - Function to convert caught errors to the ErrorType
 * @returns A Result containing either the return value or the caught error
 *
 * @example
 * ```typescript
 * const parsed = tryCatch(
 *   () => JSON.parse("{ invalid json"),
 *   (e) => `Parse error: ${e}`
 * );
 * // { ok: false, error: "Parse error: ..." }
 * ```
 */
export function tryCatch<SuccessType, ErrorType>(
  fn: () => SuccessType,
  mapUnknownError: (unknownError: unknown) => ErrorType
): Result<SuccessType, ErrorType> {
  try {
    return ok(fn());
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}

/**
 * Lifts a regular function to work with Results by wrapping it with error handling.
 *
 * @template ParamType - The function parameter type
 * @template SuccessType - The function return type (success type)
 * @template ErrorType - The error type
 * @param fn - The function to lift
 * @param mapUnknownError - Function to convert thrown errors to the ErrorType
 * @returns A function that returns a Result
 *
 * @example
 * ```typescript
 * const parseJSON = lift(
 *   (str: string) => JSON.parse(str),
 *   (e) => `Invalid JSON: ${e}`
 * );
 *
 * const result = parseJSON("{ invalid }");
 * // { ok: false, error: "Invalid JSON: ..." }
 * ```
 */
export function lift<ParamType, SuccessType, ErrorType>(
  fn: (param: ParamType) => SuccessType,
  mapUnknownError: (unknownError: unknown) => ErrorType
): (param: ParamType) => Result<SuccessType, ErrorType> {
  return (param) => tryCatch(() => fn(param), mapUnknownError);
}
