/**
 * Decorator that adds observability (logging, timing) to retry operations.
 * Single Responsibility: Only handles observability concerns.
 *
 * This decorator extends BaseRetryService to add logging and performance timing
 * without modifying the core retry algorithm.
 */

import { BaseRetryService, type RetryOptions } from "./BaseRetryService";
import type { Result } from "@/domain/types/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";

/**
 * Options for retry operations with observability support.
 * Extends base RetryOptions with optional operation name for logging.
 */
export interface ObservableRetryOptions<ErrorType> extends RetryOptions<ErrorType> {
  /**
   * Optional operation name for logging purposes.
   * If provided, retry attempts will be logged.
   */
  operationName?: string;
}

/**
 * Decorator that adds observability (logging, timing) to retry operations.
 *
 * @example
 * ```typescript
 * const decorator = new RetryObservabilityDecorator(logger);
 * const result = await decorator.retry(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 3,
 *     operationName: "fetchData",
 *     mapException: (error, attempt) => ({ code: 'FAILED', message: String(error) })
 *   }
 * );
 * ```
 */
export class RetryObservabilityDecorator extends BaseRetryService {
  constructor(private readonly logger: Logger) {
    super();
  }

  /**
   * Retries an async operation with exponential backoff and observability.
   *
   * @template SuccessType - The success type of the operation
   * @template ErrorType - The error type of the operation
   * @param fn - Async function that returns a Result
   * @param options - Retry configuration options with optional observability
   * @returns Promise resolving to the Result (success or last error)
   */
  override async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: ObservableRetryOptions<ErrorType>
  ): Promise<Result<SuccessType, ErrorType>> {
    const { operationName, ...baseOptions } = options;
    const startTime = performance.now();

    // Wrap fn to track attempts
    let attemptCount = 0;
    const wrappedFn = async (): Promise<Result<SuccessType, ErrorType>> => {
      attemptCount++;
      try {
        const result = await fn();

        if (!result.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
          // Log retry attempt for Result errors
          if (operationName) {
            this.logger.debug(
              `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
              { error: result.error }
            );
          }
        }

        return result;
      } catch (error) {
        // Handle thrown exceptions - log with warn level
        if (attemptCount < (baseOptions.maxAttempts ?? 3) && operationName) {
          this.logger.warn(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} threw exception for "${operationName}"`,
            { error }
          );
        }
        // Re-throw to let BaseRetryService handle it
        throw error;
      }
    };

    const result = await super.retry(wrappedFn, baseOptions);
    const duration = performance.now() - startTime;

    if (operationName) {
      if (result.ok && attemptCount > 1) {
        // Log success if this wasn't the first attempt
        this.logger.debug(
          `Retry succeeded for "${operationName}" after ${attemptCount} attempts (${duration.toFixed(2)}ms)`
        );
      } else if (!result.ok) {
        // Log failure after all attempts exhausted
        this.logger.warn(
          `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts (${duration.toFixed(2)}ms)`
        );
      }
    }

    return result;
  }

  /**
   * Retries a synchronous operation with observability.
   *
   * @template SuccessType - The success type
   * @template ErrorType - The error type
   * @param fn - Function that returns a Result
   * @param options - Retry configuration options (without delayMs and backoffFactor)
   * @returns The Result (success or last error)
   */
  override retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<ObservableRetryOptions<ErrorType>, "delayMs" | "backoffFactor">
  ): Result<SuccessType, ErrorType> {
    const { operationName, ...baseOptions } = options;
    let attemptCount = 0;

    const wrappedFn = (): Result<SuccessType, ErrorType> => {
      attemptCount++;
      try {
        const result = fn();

        if (!result.ok && attemptCount < (baseOptions.maxAttempts ?? 3)) {
          // Log retry attempt for Result errors
          if (operationName) {
            this.logger.debug(
              `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} failed for "${operationName}"`,
              { error: result.error }
            );
          }
        }

        return result;
      } catch (error) {
        // Handle thrown exceptions - log with warn level
        if (attemptCount < (baseOptions.maxAttempts ?? 3) && operationName) {
          this.logger.warn(
            `Retry attempt ${attemptCount}/${baseOptions.maxAttempts ?? 3} threw exception for "${operationName}"`,
            { error }
          );
        }
        // Re-throw to let BaseRetryService handle it
        throw error;
      }
    };

    const result = super.retrySync(wrappedFn, baseOptions);

    if (operationName && !result.ok) {
      // Log failure after all attempts exhausted
      this.logger.warn(
        `All retry attempts exhausted for "${operationName}" after ${baseOptions.maxAttempts ?? 3} attempts`
      );
    } else if (operationName && result.ok && attemptCount > 1) {
      // Log success if this wasn't the first attempt
      this.logger.debug(`Retry succeeded for "${operationName}" after ${attemptCount} attempts`);
    }

    return result;
  }
}
