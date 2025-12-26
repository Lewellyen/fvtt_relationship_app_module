/**
 * Functions for transforming Result values and errors.
 */
import type { Result } from "@/domain/types/result";
import { ok, err } from "./creation";

/**
 * Transforms the value of a successful Result.
 * If the Result is an error, it is returned unchanged.
 *
 * @template SuccessType - The current success type
 * @template NewSuccessType - The new success type after transformation
 * @template ErrorType - The error type
 * @param result - The Result to transform
 * @param transform - Function to transform the success value
 * @returns A new Result with the transformed value, or the original error
 *
 * @example
 * ```typescript
 * const num = ok(5);
 * const doubled = map(num, x => x * 2);
 * // { ok: true, value: 10 }
 * ```
 */
export function map<SuccessType, NewSuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>,
  transform: (value: SuccessType) => NewSuccessType
): Result<NewSuccessType, ErrorType> {
  return result.ok ? ok(transform(result.value)) : result;
}

/**
 * Transforms the error of a failed Result.
 * If the Result is successful, it is returned unchanged.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The current error type
 * @template NewErrorType - The new error type after transformation
 * @param result - The Result to transform
 * @param transform - Function to transform the error value
 * @returns A new Result with the transformed error, or the original success
 *
 * @example
 * ```typescript
 * const failure = err("404");
 * const formatted = mapError(failure, msg => `Error: ${msg}`);
 * // { ok: false, error: "Error: 404" }
 * ```
 */
export function mapError<SuccessType, ErrorType, NewErrorType>(
  result: Result<SuccessType, ErrorType>,
  transform: (error: ErrorType) => NewErrorType
): Result<SuccessType, NewErrorType> {
  return result.ok ? result : err(transform(result.error));
}

/**
 * Chains Result operations. If the Result is successful, applies the function to the value.
 * Otherwise, returns the error unchanged. This is also known as "flatMap" or "bind".
 *
 * @template SuccessType - The current success type
 * @template ErrorType - The error type
 * @template NextSuccessType - The next success type after chaining
 * @param result - The Result to chain
 * @param next - Function that returns a new Result from the success value
 * @returns The next Result, or the original error
 *
 * @example
 * ```typescript
 * const parseNumber = (str: string): Result<number, string> => {
 *   const num = parseInt(str);
 *   return isNaN(num) ? err("Invalid number") : ok(num);
 * };
 *
 * const doubled = ok("5").pipe(parseNumber).pipe(x => ok(x * 2));
 * ```
 */
export function andThen<SuccessType, ErrorType, NextSuccessType>(
  result: Result<SuccessType, ErrorType>,
  next: (value: SuccessType) => Result<NextSuccessType, ErrorType>
): Result<NextSuccessType, ErrorType> {
  return result.ok ? next(result.value) : result;
}
