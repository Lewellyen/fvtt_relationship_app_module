/**
 * Base retry service without observability concerns.
 * Single Responsibility: Only handles retry algorithm.
 *
 * This service provides the core retry logic with exponential backoff,
 * without any logging or timing measurements. Use RetryObservabilityDecorator
 * to add observability features.
 */

import type { Result } from "@/domain/types/result";
import { err } from "@/domain/utils/result";

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
   * REQUIRED for type safety. Prevents unsafe 'as ErrorType' casts that violate type guarantees.
   *
   * @param error - The caught exception (unknown type)
   * @param attempt - The current attempt number (1-based)
   * @returns A valid ErrorType instance
   */
  mapException: (error: unknown, attempt: number) => ErrorType;
}

/**
 * Base retry service that provides core retry functionality
 * without observability (logging, timing).
 *
 * @example
 * ```typescript
 * const baseService = new BaseRetryService();
 * const result = await baseService.retry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 3,
 *     mapException: (error, attempt) => ({ code: 'FAILED', message: String(error) })
 *   }
 * );
 * ```
 */
export class BaseRetryService {
  /**
   * Retries an async operation with exponential backoff.
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options
   * @returns Promise resolving to the Result (success or last error)
   */
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: RetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 1;
    const { mapException } = options;

    // Validate maxAttempts to prevent undefined errors
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    // Sentinel-Wert, damit lastError auch in theoretisch unerreichbaren Pfaden
    // niemals undefined ist. Die eigentlichen Fehler werden in der Schleife gesetzt.
    let lastError: ErrorType = mapException("Initial retry error", 0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
        const result = await fn();

        if (result.ok) {
          return result;
        }

        lastError = result.error;

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }

        // Exponential backoff: delay * (attempt ^ backoffFactor)
        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        // Handle exception-based code that breaks Result-Pattern
        // Use mapException to convert unknown error to ErrorType
        lastError = mapException(error, attempt);

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }

        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return err(lastError);
  }

  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options (without delayMs and backoffFactor)
   * @returns The Result (success or last error)
   */
  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    const maxAttempts = options.maxAttempts ?? 3;
    const { mapException } = options;

    // Validate maxAttempts to prevent undefined errors
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    // Sentinel-Wert, damit lastError auch in theoretisch unerreichbaren Pfaden
    // niemals undefined ist. Die eigentlichen Fehler werden in der Schleife gesetzt.
    let lastError: ErrorType = mapException("Initial retry error", 0);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
        const result = fn();

        if (result.ok) {
          return result;
        }

        lastError = result.error;

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }
      } catch (error) {
        // Handle exception-based code that breaks Result-Pattern
        // Use mapException to convert unknown error to ErrorType
        lastError = mapException(error, attempt);

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    return err(lastError);
  }
}
