/**
 * Utility functions for working with the Result pattern.
 * Provides functional error handling with type safety.
 *
 * This module contains only runtime functions - types are imported from "@/types/result"
 */
import type { Ok, Err, Result, AsyncResult } from "@/types/result";

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
export function getOrThrow<SuccessType, ErrorType, ThrownError extends Error = Error>(
  result: Result<SuccessType, ErrorType>,
  toError?: (error: ErrorType) => ThrownError
): SuccessType {
  if (result.ok) return result.value;
  /* type-coverage:ignore-next-line -- Type constraint: when toError is provided it returns ThrownError, otherwise Error conforms to ThrownError via constraint */
  const e = toError ? toError(result.error) : (new Error(String(result.error)) as ThrownError);
  throw e;
}

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
 * Combines multiple Results into a single Result containing an array of values.
 * If any Result is an error, returns that error immediately (short-circuits).
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param results - Array of Results to combine
 * @returns A Result containing an array of values, or the first error encountered
 *
 * @example
 * ```typescript
 * const nums = [ok(1), ok(2), ok(3)];
 * all(nums); // { ok: true, value: [1, 2, 3] }
 *
 * const mixed = [ok(1), err("error"), ok(3)];
 * all(mixed); // { ok: false, error: "error" }
 * ```
 */
export function all<SuccessType, ErrorType>(
  results: Array<Result<SuccessType, ErrorType>>
): Result<SuccessType[], ErrorType> {
  const out: SuccessType[] = [];
  for (const r of results) {
    if (!r.ok) return r;
    out.push(r.value);
  }
  return ok(out);
}

/**
 * Pattern matching for Results. Executes different handlers based on success or failure.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @template ReturnType - The return type of both handlers
 * @param result - The Result to match
 * @param handlers - Object with onOk and onErr handlers
 * @returns The result of the executed handler
 *
 * @example
 * ```typescript
 * const result = ok(42);
 * match(result, {
 *   onOk: value => console.log(`Success: ${value}`),
 *   onErr: error => console.error(`Error: ${error}`)
 * });
 * ```
 */
export function match<SuccessType, ErrorType, ReturnType>(
  result: Result<SuccessType, ErrorType>,
  handlers: { onOk: (value: SuccessType) => ReturnType; onErr: (error: ErrorType) => ReturnType }
): ReturnType {
  return result.ok ? handlers.onOk(result.value) : handlers.onErr(result.error);
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

/**
 * Transforms the value of an async Result.
 * If the Result is an error, returns it unchanged.
 *
 * @template SuccessType - The current success type
 * @template NewSuccessType - The new success type after transformation
 * @template ErrorType - The error type
 * @param asyncResult - The async Result to transform
 * @param transform - Async or sync function to transform the success value
 * @returns A promise that resolves to a Result with the transformed value or error
 *
 * @example
 * ```typescript
 * const asyncNum = Promise.resolve(ok(5));
 * const doubled = await asyncMap(asyncNum, x => x * 2);
 * // { ok: true, value: 10 }
 * ```
 */
export async function asyncMap<SuccessType, NewSuccessType, ErrorType>(
  asyncResult: AsyncResult<SuccessType, ErrorType>,
  transform: (value: SuccessType) => Promise<NewSuccessType> | NewSuccessType
): AsyncResult<NewSuccessType, ErrorType> {
  const result = await asyncResult;
  return result.ok ? ok(await transform(result.value)) : result;
}

/**
 * Chains async Result operations.
 * If the Result is successful, applies the async function to the value.
 *
 * @template SuccessType - The current success type
 * @template ErrorType - The error type
 * @template NextSuccessType - The next success type after chaining
 * @param asyncResult - The async Result to chain
 * @param next - Async function that returns a new async Result
 * @returns A promise that resolves to the chained Result or the original error
 *
 * @example
 * ```typescript
 * const fetchAndProcess = async (url: string) => {
 *   const data = await fromPromise(fetch(url).then(r => r.json()), e => String(e));
 *   return asyncAndThen(data, processDataAsync);
 * };
 * ```
 */
export async function asyncAndThen<SuccessType, ErrorType, NextSuccessType>(
  asyncResult: AsyncResult<SuccessType, ErrorType>,
  next: (value: SuccessType) => AsyncResult<NextSuccessType, ErrorType>
): AsyncResult<NextSuccessType, ErrorType> {
  const result = await asyncResult;
  return result.ok ? next(result.value) : result;
}

/**
 * Converts a Promise into an async Result.
 * Catches any rejection and converts it to an error Result.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param promise - The Promise to convert
 * @param mapUnknownError - Function to convert unknown errors to the ErrorType
 * @returns A promise that resolves to a Result
 *
 * @example
 * ```typescript
 * const result = await fromPromise(
 *   fetch("/api/data").then(r => r.json()),
 *   (e) => `Fetch failed: ${e}`
 * );
 * ```
 */
export async function fromPromise<SuccessType, ErrorType>(
  promise: Promise<SuccessType>,
  mapUnknownError: (unknownError: unknown) => ErrorType
): AsyncResult<SuccessType, ErrorType> {
  try {
    return ok(await promise);
  } catch (unknownError) {
    return err(mapUnknownError(unknownError));
  }
}

/**
 * Combines multiple async Results into a single Result containing an array of values.
 * If any Result is an error, returns that error (short-circuits).
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param asyncResults - Array of async Results to combine
 * @returns A promise that resolves to a Result containing an array of values or the first error
 *
 * @example
 * ```typescript
 * const results = [
 *   Promise.resolve(ok(1)),
 *   Promise.resolve(ok(2)),
 *   Promise.resolve(ok(3))
 * ];
 * const combined = await asyncAll(results);
 * // { ok: true, value: [1, 2, 3] }
 * ```
 */
export async function asyncAll<SuccessType, ErrorType>(
  asyncResults: Array<AsyncResult<SuccessType, ErrorType>>
): AsyncResult<SuccessType[], ErrorType> {
  const results: Result<SuccessType, ErrorType>[] = await Promise.all(asyncResults);
  return all(results);
}
