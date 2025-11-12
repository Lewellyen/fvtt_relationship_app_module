/**
 * Service for handling transient failures with automatic retry logic.
 * Provides retry operations with exponential backoff and optional logging.
 *
 * This service wraps the retry logic that was previously implemented
 * as utility functions, making it easier to:
 * - Inject via DI
 * - Add logging for retry attempts (via Logger)
 * - Track retry metrics (via MetricsCollector)
 * - Configure default retry strategies centrally
 */

import type { Result } from "@/types/result";
import { err } from "@/utils/functional/result";
import type { Logger } from "@/interfaces/logger";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { loggerToken, metricsCollectorToken } from "@/tokens/tokenindex";

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
   *
   * @example
   * ```typescript
   * const result = await retryService.retry(
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
  mapException: (error: unknown, attempt: number) => ErrorType;

  /**
   * Optional operation name for logging purposes.
   * If provided, retry attempts will be logged.
   */
  operationName?: string;
}

/**
 * Service for retrying operations with exponential backoff.
 *
 * @example
 * ```typescript
 * const retryService = container.resolve(retryServiceToken);
 *
 * // Retry async operation
 * const result = await retryService.retry(
 *   () => foundryApi.fetchData(),
 *   {
 *     maxAttempts: 3,
 *     delayMs: 100,
 *     operationName: "fetchData",
 *     mapException: (error, attempt) => ({
 *       code: 'OPERATION_FAILED' as const,
 *       message: `Attempt ${attempt} failed: ${String(error)}`
 *     })
 *   }
 * );
 *
 * // Retry sync operation
 * const result = retryService.retrySync(
 *   () => parseData(input),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export class RetryService {
  static dependencies = [loggerToken, metricsCollectorToken] as const;

  constructor(
    private readonly logger: Logger,
    private readonly metricsCollector: MetricsCollector
  ) {}

  /**
   * Retries an async operation with exponential backoff.
   *
   * Useful for handling transient failures in external APIs (e.g., Foundry API calls).
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options
   * @returns Promise resolving to the Result (success or last error)
   *
   * @example
   * ```typescript
   * const result = await retryService.retry(
   *   () => foundryApi.fetchData(),
   *   {
   *     maxAttempts: 3,
   *     delayMs: 100,
   *     operationName: "fetchData",
   *     mapException: (error, attempt) => ({
   *       code: 'OPERATION_FAILED' as const,
   *       message: `Attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   * ```
   */
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: RetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    const maxAttempts = options.maxAttempts ?? 3;
    const delayMs = options.delayMs ?? 100;
    const backoffFactor = options.backoffFactor ?? 1;
    const { mapException, operationName } = options;

    // Validate maxAttempts to prevent undefined errors
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    let lastError: ErrorType | undefined;
    const startTime = performance.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
        const result = await fn();

        if (result.ok) {
          // Log success if this wasn't the first attempt
          if (attempt > 1 && operationName) {
            const duration = performance.now() - startTime;
            this.logger.debug(
              `Retry succeeded for "${operationName}" after ${attempt} attempts (${duration.toFixed(2)}ms)`
            );
          }
          return result;
        }

        lastError = result.error;

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }

        // Log retry attempt
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${maxAttempts} failed for "${operationName}"`,
            { error: lastError }
          );
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

        // Log exception
        if (operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${maxAttempts} threw exception for "${operationName}"`,
            { error }
          );
        }

        const delay = delayMs * Math.pow(attempt, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Record retry failure metric
    if (operationName) {
      const duration = performance.now() - startTime;
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${maxAttempts} attempts (${duration.toFixed(2)}ms)`
      );
    }

    // TypeScript flow analysis: lastError is guaranteed defined after loop
    // because the loop always executes at least once (maxAttempts >= 1)
    // and both try and catch branches assign to lastError
    /* type-coverage:ignore-next-line -- Non-null assertion: lastError guaranteed by loop execution */
    const finalError = lastError!;
    return err(finalError);
  }

  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options
   * @returns The Result (success or last error)
   *
   * @example
   * ```typescript
   * const result = retryService.retrySync(
   *   () => parseData(input),
   *   {
   *     maxAttempts: 3,
   *     operationName: "parseData",
   *     mapException: (error, attempt) => ({
   *       code: 'PARSE_FAILED' as const,
   *       message: `Parse attempt ${attempt} failed: ${String(error)}`
   *     })
   *   }
   * );
   * ```
   */
  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    const maxAttempts = options.maxAttempts ?? 3;
    const { mapException, operationName } = options;

    // Validate maxAttempts to prevent undefined errors
    if (maxAttempts < 1) {
      return err(mapException("maxAttempts must be >= 1", 0));
    }

    let lastError: ErrorType | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
        const result = fn();

        if (result.ok) {
          // Log success if this wasn't the first attempt
          if (attempt > 1 && operationName) {
            this.logger.debug(`Retry succeeded for "${operationName}" after ${attempt} attempts`);
          }
          return result;
        }

        lastError = result.error;

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }

        // Log retry attempt
        if (operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${maxAttempts} failed for "${operationName}"`,
            { error: lastError }
          );
        }
      } catch (error) {
        // Handle exception-based code that breaks Result-Pattern
        // Use mapException to convert unknown error to ErrorType
        lastError = mapException(error, attempt);

        // Last attempt? Return error immediately
        if (attempt === maxAttempts) {
          break;
        }

        // Log exception
        if (operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${maxAttempts} threw exception for "${operationName}"`,
            { error }
          );
        }
      }
    }

    // Log retry failure
    if (operationName) {
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${maxAttempts} attempts`
      );
    }

    // TypeScript flow analysis: lastError is guaranteed defined after loop
    // because the loop always executes at least once (maxAttempts >= 1)
    // and both try and catch branches assign to lastError
    /* type-coverage:ignore-next-line -- Non-null assertion: lastError guaranteed by loop execution */
    const finalError = lastError!;
    return err(finalError);
  }
}
