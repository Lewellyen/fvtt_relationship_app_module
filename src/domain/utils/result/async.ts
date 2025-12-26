/**
 * Async variants of Result operations.
 */
import type { AsyncResult } from "@/domain/types/result";
import { ok, err } from "./creation";
import { all } from "./combination";

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
  const results = await Promise.all(asyncResults);
  return all(results);
}
