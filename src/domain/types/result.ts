/**
 * Type representing a successful result.
 * @template SuccessType - The type of the successful value
 */
export type Ok<SuccessType> = {
  ok: true;
  value: SuccessType;
};

/**
 * Type representing an error result.
 * @template ErrorType - The type of the error value
 */
export type Err<ErrorType> = {
  ok: false;
  error: ErrorType;
};

/**
 * Result pattern for functional error handling.
 * Represents either a successful value or an error, forcing explicit error handling.
 *
 * @template SuccessType - The type of value returned on success
 * @template ErrorType - The type of error returned on failure
 *
 * @example
 * ```typescript
 * function parseJSON(input: string): Result<unknown, string> {
 *   try {
 *     return { ok: true, value: JSON.parse(input) };
 *   } catch {
 *     return { ok: false, error: "Invalid JSON" };
 *   }
 * }
 * ```
 */
export type Result<SuccessType, ErrorType> = Ok<SuccessType> | Err<ErrorType>;

/**
 * Async version of Result pattern.
 * @template SuccessType - The type of value returned on success
 * @template ErrorType - The type of error returned on failure
 */
export type AsyncResult<SuccessType, ErrorType> = Promise<Result<SuccessType, ErrorType>>;
