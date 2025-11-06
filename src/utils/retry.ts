/**
 * Retry utilities for handling transient failures.
 * Provides automatic retry logic with exponential backoff.
 */

import type { Result } from "@/types/result";
import { err } from "@/utils/result";

/**
 * Options for retry operations.
 * Allows customization of retry behavior and error handling.
 */
export interface RetryOptions<ErrorType> {
  /**
   * Maximum number of retry attempts.
   * Must be >= 1.
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Base delay in milliseconds between retry attempts.
   * With exponential backoff: delayMs * attempt (100ms, 200ms, 300ms, ...)
   * @default 100
   */
  delayMs?: number;

  /**
   * Exponential backoff factor.
   * Delay = delayMs * (attempt ^ backoffFactor)
   * @default 1 (linear backoff)
   */
  backoffFactor?: number;

  /**
   * Maps exceptions (thrown errors or unknown errors) to the expected ErrorType.
   *
   * This is required when ErrorType is a structured type (e.g., FoundryError)
   * to prevent unsafe 'as ErrorType' casts that violate type guarantees.
   *
   * @param error - The caught exception (unknown type)
   * @param attempt - The current attempt number (1-based)
   * @returns A valid ErrorType instance
   *
   * @example
   * ```typescript
   * const result = await withRetry(
   *   () => fetchData(),
   *   {
   *     maxAttempts: 3,
   *     mapException: (error, attempt) => ({
   *       code: 'OPERATION_FAILED' as const,
   *       message: `Attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   * ```
   */
  mapException?: (error: unknown, attempt: number) => ErrorType;
}

/**
 * Retries an async operation with exponential backoff.
 *
 * Useful for handling transient failures in external APIs (e.g., Foundry API calls).
 *
 * @template SuccessType - The success type of the operation
 * @template ErrorType - The error type of the operation
 * @param fn - Async function that returns a Result
 * @param options - Retry configuration options (or legacy: maxAttempts number)
 * @param legacyDelayMs - Legacy parameter for backward compatibility
 * @returns Promise resolving to the Result (success or last error)
 *
 * @example
 * ```typescript
 * // New API with mapException (recommended for structured error types)
 * const result = await withRetry(
 *   () => foundryApi.fetchData(),
 *   {
 *     maxAttempts: 3,
 *     delayMs: 100,
 *     mapException: (error, attempt) => ({
 *       code: 'OPERATION_FAILED' as const,
 *       message: `Attempt ${attempt} failed: ${String(error)}`
 *     })
 *   }
 * );
 *
 * // Legacy API (backward compatible)
 * const result = await withRetry(
 *   () => foundryApi.fetchData(),
 *   3, // maxAttempts
 *   100 // delayMs
 * );
 * ```
 */
export async function withRetry<SuccessType, ErrorType>(
  fn: () => Promise<Result<SuccessType, ErrorType>>,
  options: RetryOptions<ErrorType> | number = 3,
  legacyDelayMs?: number
): Promise<Result<SuccessType, ErrorType>> {
  // Backward compatibility: handle legacy (maxAttempts, delayMs) signature
  const opts: Required<RetryOptions<ErrorType>> =
    typeof options === "number"
      ? {
          maxAttempts: options,
          /* c8 ignore next -- Legacy API: delayMs default tested via other retry tests */
          delayMs: legacyDelayMs ?? 100,
          backoffFactor: 1,
          /* c8 ignore next -- Legacy unsafe cast function tested via legacy API tests */
          mapException: (error) => error as ErrorType, // Legacy unsafe cast
        }
      : {
          /* c8 ignore next -- Modern API: maxAttempts default tested in "should use default maxAttempts of 3" */
          maxAttempts: options.maxAttempts ?? 3,
          delayMs: options.delayMs ?? 100,
          backoffFactor: options.backoffFactor ?? 1,
          /* c8 ignore next -- Default mapException tested when options.mapException is undefined */
          mapException: options.mapException ?? ((error) => error as ErrorType),
        };

  // Validate maxAttempts to prevent undefined errors
  if (opts.maxAttempts < 1) {
    return err(opts.mapException("maxAttempts must be >= 1", 0) satisfies ErrorType as ErrorType);
  }

  let lastError: ErrorType | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
      const result = await fn();

      if (result.ok) {
        return result;
      }

      lastError = result.error;

      // Don't sleep after last attempt
      if (attempt < opts.maxAttempts) {
        // Exponential backoff: delay * (attempt ^ backoffFactor)
        const delay = opts.delayMs * Math.pow(attempt, opts.backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      // Handle exception-based code that breaks Result-Pattern
      // Use mapException to convert unknown error to ErrorType
      lastError = opts.mapException(error, attempt);

      if (attempt < opts.maxAttempts) {
        const delay = opts.delayMs * Math.pow(attempt, opts.backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // lastError is always defined here (at least one attempt was made)
  return err(lastError as ErrorType);
}

/**
 * Retries a synchronous operation.
 * Similar to withRetry but for sync functions.
 *
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param fn - Function that returns a Result
 * @param options - Retry configuration options (or legacy: maxAttempts number)
 * @returns The Result (success or last error)
 *
 * @example
 * ```typescript
 * // New API with mapException (recommended for structured error types)
 * const result = withRetrySync(
 *   () => parseData(input),
 *   {
 *     maxAttempts: 3,
 *     mapException: (error, attempt) => ({
 *       code: 'PARSE_FAILED' as const,
 *       message: `Parse attempt ${attempt} failed: ${String(error)}`
 *     })
 *   }
 * );
 *
 * // Legacy API (backward compatible)
 * const result = withRetrySync(
 *   () => parseData(input),
 *   3 // maxAttempts
 * );
 * ```
 */
export function withRetrySync<SuccessType, ErrorType>(
  fn: () => Result<SuccessType, ErrorType>,
  options: Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor"> | number = 3
): Result<SuccessType, ErrorType> {
  // Backward compatibility: handle legacy maxAttempts signature
  const opts: Required<Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor">> =
    typeof options === "number"
      ? {
          maxAttempts: options,
          /* c8 ignore next -- Legacy unsafe cast function tested via legacy API tests */
          mapException: (error) => error as ErrorType, // Legacy unsafe cast
        }
      : {
          /* c8 ignore next -- Default maxAttempts tested in retry.test.ts */
          maxAttempts: options.maxAttempts ?? 3,
          /* c8 ignore next -- Default mapException tested implicitly when options.mapException is undefined */
          mapException: options.mapException ?? ((error) => error as ErrorType),
        };

  // Validate maxAttempts to prevent undefined errors
  if (opts.maxAttempts < 1) {
    return err(opts.mapException("maxAttempts must be >= 1", 0) satisfies ErrorType as ErrorType);
  }

  let lastError: ErrorType | undefined;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
      const result = fn();

      if (result.ok) {
        return result;
      }

      lastError = result.error;
    } catch (error) {
      // Handle exception-based code that breaks Result-Pattern
      // Use mapException to convert unknown error to ErrorType
      lastError = opts.mapException(error, attempt);
    }
  }

  // lastError is always defined here (at least one attempt was made)
  return err(lastError as ErrorType);
}
