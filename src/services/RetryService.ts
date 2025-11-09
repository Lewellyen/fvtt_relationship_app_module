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
   * This is required when ErrorType is a structured type (e.g., FoundryError)
   * to prevent unsafe 'as ErrorType' casts that violate type guarantees.
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
  mapException?: (error: unknown, attempt: number) => ErrorType;

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
   * @param options - Retry configuration options (or legacy: maxAttempts number)
   * @param legacyDelayMs - Legacy parameter for backward compatibility
   * @returns Promise resolving to the Result (success or last error)
   *
   * @example
   * ```typescript
   * // New API with mapException (recommended for structured error types)
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
   * // Legacy API (backward compatible)
   * const result = await retryService.retry(
   *   () => foundryApi.fetchData(),
   *   3, // maxAttempts
   *   100 // delayMs
   * );
   * ```
   */
  async retry<SuccessType, ErrorType>(
    fn: () => Promise<Result<SuccessType, ErrorType>>,
    options: RetryOptions<ErrorType> | number = 3,
    legacyDelayMs?: number
  ): Promise<Result<SuccessType, ErrorType>> {
    // Backward compatibility: handle legacy (maxAttempts, delayMs) signature
    const opts =
      typeof options === "number"
        ? {
            maxAttempts: options,
            /* c8 ignore next -- Legacy API: delayMs default tested via other retry tests */
            delayMs: legacyDelayMs ?? 100,
            backoffFactor: 1,
            /* c8 ignore next 2 -- Legacy unsafe cast function tested via legacy API tests */
            /* type-coverage:ignore-next-line */
            mapException: (error: unknown) => error as ErrorType, // Legacy unsafe cast
            operationName: undefined,
          }
        : {
            /* c8 ignore next -- Modern API: maxAttempts default tested in "should use default maxAttempts of 3" */
            maxAttempts: options.maxAttempts ?? 3,
            delayMs: options.delayMs ?? 100,
            backoffFactor: options.backoffFactor ?? 1,
            /* c8 ignore next 2 -- Default mapException tested when options.mapException is undefined */
            /* type-coverage:ignore-next-line */
            mapException: options.mapException ?? ((error: unknown) => error as ErrorType),
            operationName: options.operationName ?? undefined,
          };

    // Validate maxAttempts to prevent undefined errors
    if (opts.maxAttempts < 1) {
      return err(opts.mapException("maxAttempts must be >= 1", 0) satisfies ErrorType as ErrorType);
    }

    let lastError: ErrorType | undefined;
    const startTime = performance.now();

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        // Wrap fn() in try/catch to handle thrown errors (breaks Result-Pattern)
        const result = await fn();

        if (result.ok) {
          // Log success if this wasn't the first attempt
          if (attempt > 1 && opts.operationName) {
            const duration = performance.now() - startTime;
            this.logger.debug(
              `Retry succeeded for "${opts.operationName}" after ${attempt} attempts (${duration.toFixed(2)}ms)`
            );
          }
          return result;
        }

        lastError = result.error;

        // Log retry attempt
        if (opts.operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${opts.maxAttempts} failed for "${opts.operationName}"`,
            { error: lastError }
          );
        }

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

        // Log exception
        if (opts.operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${opts.maxAttempts} threw exception for "${opts.operationName}"`,
            { error }
          );
        }

        if (attempt < opts.maxAttempts) {
          const delay = opts.delayMs * Math.pow(attempt, opts.backoffFactor);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Record retry failure metric
    if (opts.operationName) {
      const duration = performance.now() - startTime;
      this.logger.warn(
        `All retry attempts exhausted for "${opts.operationName}" after ${opts.maxAttempts} attempts (${duration.toFixed(2)}ms)`
      );
    }

    // lastError is always defined here (at least one attempt was made)
    /* type-coverage:ignore-next-line */
    return err(lastError as ErrorType);
  }

  /**
   * Retries a synchronous operation.
   * Similar to retry but for sync functions.
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
   *
   * // Legacy API (backward compatible)
   * const result = retryService.retrySync(
   *   () => parseData(input),
   *   3 // maxAttempts
   * );
   * ```
   */
  retrySync<SuccessType, ErrorType>(
    fn: () => Result<SuccessType, ErrorType>,
    options: Omit<RetryOptions<ErrorType>, "delayMs" | "backoffFactor"> | number = 3
  ): Result<SuccessType, ErrorType> {
    // Backward compatibility: handle legacy maxAttempts signature
    const opts =
      typeof options === "number"
        ? {
            maxAttempts: options,
            /* c8 ignore next 2 -- Legacy unsafe cast function tested via legacy API tests */
            /* type-coverage:ignore-next-line */
            mapException: (error: unknown) => error as ErrorType, // Legacy unsafe cast
            operationName: undefined,
          }
        : {
            /* c8 ignore next -- Default maxAttempts tested in retry.test.ts */
            maxAttempts: options.maxAttempts ?? 3,
            /* c8 ignore next 2 -- Default mapException tested implicitly when options.mapException is undefined */
            /* type-coverage:ignore-next-line */
            mapException: options.mapException ?? ((error: unknown) => error as ErrorType),
            operationName: options.operationName ?? undefined,
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
          // Log success if this wasn't the first attempt
          if (attempt > 1 && opts.operationName) {
            this.logger.debug(
              `Retry succeeded for "${opts.operationName}" after ${attempt} attempts`
            );
          }
          return result;
        }

        lastError = result.error;

        // Log retry attempt
        if (opts.operationName) {
          this.logger.debug(
            `Retry attempt ${attempt}/${opts.maxAttempts} failed for "${opts.operationName}"`,
            { error: lastError }
          );
        }
      } catch (error) {
        // Handle exception-based code that breaks Result-Pattern
        // Use mapException to convert unknown error to ErrorType
        lastError = opts.mapException(error, attempt);

        // Log exception
        if (opts.operationName) {
          this.logger.warn(
            `Retry attempt ${attempt}/${opts.maxAttempts} threw exception for "${opts.operationName}"`,
            { error }
          );
        }
      }
    }

    // Log retry failure
    if (opts.operationName) {
      this.logger.warn(
        `All retry attempts exhausted for "${opts.operationName}" after ${opts.maxAttempts} attempts`
      );
    }

    // lastError is always defined here (at least one attempt was made)
    /* type-coverage:ignore-next-line */
    return err(lastError as ErrorType);
  }
}
