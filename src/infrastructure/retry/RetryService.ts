/**
 * Service for handling transient failures with automatic retry logic.
 * Provides retry operations with exponential backoff and optional logging.
 *
 * This service is composed from BaseRetryService (core retry algorithm) and
 * RetryObservabilityDecorator (logging and timing). This separation follows
 * the Single Responsibility Principle, making it easier to:
 * - Test retry logic without observability concerns
 * - Use retry logic without logging in performance-critical paths
 * - Modify observability without affecting retry algorithm
 *
 * Single Responsibility: Only provides the Retry-Interface.
 * Delegates all operations to the composed RetryObservabilityDecorator.
 */

import type { Result } from "@/domain/types/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { BaseRetryService } from "./BaseRetryService";
import {
  RetryObservabilityDecorator,
  type ObservableRetryOptions,
} from "./RetryObservabilityDecorator";

/**
 * Options for retry operations.
 * Allows customization of retry behavior and error handling.
 *
 * This is an alias for ObservableRetryOptions to maintain backward compatibility.
 * The operationName field is optional, so existing code continues to work.
 */
export type RetryOptions<ErrorType> = ObservableRetryOptions<ErrorType>;

/**
 * Type guard to check if a value is a Logger instance.
 * Used to narrow the type in constructor overloads.
 */
function isLogger(value: Logger | BaseRetryService): value is Logger {
  return !(value instanceof BaseRetryService);
}

/**
 * Service for retrying operations with exponential backoff.
 *
 * Composed from BaseRetryService (core retry algorithm) and
 * RetryObservabilityDecorator (logging and timing).
 * Uses composition instead of inheritance to follow SRP.
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
  private readonly composedService: RetryObservabilityDecorator;

  /**
   * Creates a new RetryService instance.
   * Composes BaseRetryService and RetryObservabilityDecorator.
   *
   * @param logger - Logger instance for observability
   */
  constructor(logger: Logger);
  /**
   * Creates a new RetryService instance with explicit dependencies.
   * Used internally by RetryServiceCompositionFactory for composition.
   *
   * @param baseRetryService - Base retry service (core algorithm)
   * @param observabilityDecorator - Observability decorator (logging and timing)
   */
  constructor(
    baseRetryService: BaseRetryService,
    observabilityDecorator: RetryObservabilityDecorator
  );
  constructor(
    loggerOrBaseService: Logger | BaseRetryService,
    observabilityDecorator?: RetryObservabilityDecorator
  ) {
    if (observabilityDecorator) {
      // Factory-based construction: use provided decorator
      this.composedService = observabilityDecorator;
    } else {
      // Backward-compatible construction: create decorator with logger
      // Use type guard to narrow the type without type assertion
      if (!isLogger(loggerOrBaseService)) {
        // This should never happen due to overload signature, but provides type safety
        throw new Error("BaseRetryService cannot be used without RetryObservabilityDecorator");
      }
      // TypeScript now knows loggerOrBaseService is Logger
      this.composedService = new RetryObservabilityDecorator(loggerOrBaseService);
    }
  }

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
    return this.composedService.retry(fn, options);
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
    return this.composedService.retrySync(fn, options);
  }
}

export class DIRetryService extends RetryService {
  static dependencies = [loggerToken] as const;

  constructor(logger: Logger) {
    super(logger);
  }
}
