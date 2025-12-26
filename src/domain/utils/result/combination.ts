/**
 * Functions for combining Results and pattern matching.
 */
import type { Result } from "@/domain/types/result";
import { ok } from "./creation";

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
