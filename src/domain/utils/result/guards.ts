/**
 * Type guards for Result pattern.
 */
import type { Ok, Err, Result } from "@/domain/types/result";

/**
 * Type guard to check if a Result is successful.
 *
 * @template SuccessType - The type of the successful value
 * @template ErrorType - The type of the error value
 * @param result - The Result to check
 * @returns True if the Result is successful, narrowing the type to Ok<SuccessType>
 *
 * @example
 * ```typescript
 * const result = someOperation();
 * if (isOk(result)) {
 *   console.log(result.value); // Type-safe access to value
 * }
 * ```
 */
export function isOk<SuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>
): result is Ok<SuccessType> {
  return result.ok;
}

/**
 * Type guard to check if a Result is an error.
 *
 * @template SuccessType - The type of the successful value
 * @template ErrorType - The type of the error value
 * @param result - The Result to check
 * @returns True if the Result is an error, narrowing the type to Err<ErrorType>
 *
 * @example
 * ```typescript
 * const result = someOperation();
 * if (isErr(result)) {
 *   console.error(result.error); // Type-safe access to error
 * }
 * ```
 */
export function isErr<SuccessType, ErrorType>(
  result: Result<SuccessType, ErrorType>
): result is Err<ErrorType> {
  return !result.ok;
}
