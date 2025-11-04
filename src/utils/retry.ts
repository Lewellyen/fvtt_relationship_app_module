/**
 * Retry utilities for handling transient failures.
 * Provides automatic retry logic with exponential backoff.
 */

import type { Result } from "@/types/result";
import { err } from "@/utils/result";

/**
 * Retries an async operation with exponential backoff.
 * 
 * Useful for handling transient failures in external APIs (e.g., Foundry API calls).
 * 
 * @template SuccessType - The success type of the operation
 * @template ErrorType - The error type of the operation
 * @param fn - Async function that returns a Result
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param delayMs - Base delay in milliseconds between attempts (default: 100)
 * @returns Promise resolving to the Result (success or last error)
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => foundryApi.fetchData(),
 *   3, // Max 3 attempts
 *   100 // Start with 100ms delay, then 200ms, 300ms
 * );
 * 
 * if (result.ok) {
 *   console.log('Success after retry:', result.value);
 * } else {
 *   console.error('All retries failed:', result.error);
 * }
 * ```
 */
export async function withRetry<SuccessType, ErrorType>(
  fn: () => Promise<Result<SuccessType, ErrorType>>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<Result<SuccessType, ErrorType>> {
  let lastError: ErrorType;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await fn();

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Don't sleep after last attempt
    if (attempt < maxAttempts) {
      // Exponential backoff: delay * attempt (100ms, 200ms, 300ms, ...)
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  return err(lastError!);
}

/**
 * Retries a synchronous operation.
 * Similar to withRetry but for sync functions.
 * 
 * @template SuccessType - The success type
 * @template ErrorType - The error type
 * @param fn - Function that returns a Result
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @returns The Result (success or last error)
 * 
 * @example
 * ```typescript
 * const result = withRetrySy nc(
 *   () => parseData(input),
 *   3
 * );
 * ```
 */
export function withRetrySync<SuccessType, ErrorType>(
  fn: () => Result<SuccessType, ErrorType>,
  maxAttempts: number = 3
): Result<SuccessType, ErrorType> {
  let lastError: ErrorType;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = fn();

    if (result.ok) {
      return result;
    }

    lastError = result.error;
  }

  return err(lastError!);
}

