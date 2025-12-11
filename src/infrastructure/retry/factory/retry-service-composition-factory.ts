/**
 * Factory for composing RetryService instances.
 * Single Responsibility: Only handles service composition.
 *
 * This factory creates RetryService instances by composing
 * BaseRetryService (core retry algorithm) and
 * RetryObservabilityDecorator (logging and timing).
 */

import type { Logger } from "@/infrastructure/logging/logger.interface";
import { BaseRetryService } from "../BaseRetryService";
import { RetryObservabilityDecorator } from "../RetryObservabilityDecorator";
import { RetryService } from "../RetryService";

/**
 * Interface for RetryService composition factory.
 * Provides a method to create RetryService instances.
 */
export interface IRetryServiceCompositionFactory {
  /**
   * Creates a RetryService instance by composing
   * BaseRetryService and RetryObservabilityDecorator.
   *
   * @param logger - Logger instance for observability
   * @returns A new RetryService instance
   */
  createRetryService(logger: Logger): RetryService;
}

/**
 * Factory for creating RetryService instances.
 * Composes BaseRetryService and RetryObservabilityDecorator.
 *
 * @example
 * ```typescript
 * const factory = new RetryServiceCompositionFactory();
 * const retryService = factory.createRetryService(logger);
 * ```
 */
export class RetryServiceCompositionFactory implements IRetryServiceCompositionFactory {
  /**
   * Creates a RetryService instance by composing
   * BaseRetryService and RetryObservabilityDecorator.
   *
   * @param logger - Logger instance for observability
   * @returns A new RetryService instance
   */
  createRetryService(logger: Logger): RetryService {
    const baseRetryService = new BaseRetryService();
    const observabilityDecorator = new RetryObservabilityDecorator(logger);
    return new RetryService(baseRetryService, observabilityDecorator);
  }
}
