/**
 * Interface for performance tracking functionality.
 *
 * This interface abstracts performance tracking to avoid circular dependencies
 * between DI infrastructure (ServiceResolver) and services (PerformanceTrackingService).
 *
 * **Implementations:**
 * - `BootstrapPerformanceTracker`: Lightweight implementation for bootstrap phase (no DI)
 * - `PerformanceTrackingService`: Full-featured implementation using DI
 *
 * **Design Rationale:**
 * ServiceResolver needs performance tracking but cannot depend on PerformanceTrackingService
 * due to circular dependency (ServiceResolver creates services, services are resolved via ServiceResolver).
 * By using an interface, we can inject different implementations at different lifecycle stages.
 *
 * @interface PerformanceTracker
 *
 * @example Bootstrap Phase
 * ```typescript
 * const tracker = new BootstrapPerformanceTracker(env, metricsCollector);
 * const resolver = new ServiceResolver(registry, cache, null, "root", tracker);
 * ```
 *
 * @example Production Phase (optional upgrade)
 * ```typescript
 * const perfService = container.resolve(performanceTrackingServiceToken);
 * // perfService implements PerformanceTracker interface
 * ```
 */
export interface PerformanceTracker {
  /**
   * Tracks the execution time of a synchronous operation.
   *
   * If performance tracking is disabled or sampling rejects the operation,
   * the operation is executed without tracking overhead.
   *
   * @template T - Return type of the operation
   * @param operation - The operation to track
   * @param onComplete - Optional callback invoked with duration and result after completion
   * @returns The result of the operation
   *
   * @example
   * ```typescript
   * const result = tracker.track(
   *   () => expensiveComputation(),
   *   (duration, result) => {
   *     logger.debug(`Computation took ${duration}ms`);
   *   }
   * );
   * ```
   */
  track<T>(operation: () => T, onComplete?: (duration: number, result: T) => void): T;

  /**
   * Tracks the execution time of an asynchronous operation.
   *
   * If performance tracking is disabled or sampling rejects the operation,
   * the operation is executed without tracking overhead.
   *
   * @template T - Return type of the async operation
   * @param operation - The async operation to track
   * @param onComplete - Optional callback invoked with duration and result after completion
   * @returns Promise resolving to the operation result
   *
   * @example
   * ```typescript
   * const result = await tracker.trackAsync(
   *   async () => await fetchData(),
   *   (duration, result) => {
   *     logger.debug(`Fetch took ${duration}ms`);
   *   }
   * );
   * ```
   */
  trackAsync<T>(
    operation: () => Promise<T>,
    onComplete?: (duration: number, result: T) => void
  ): Promise<T>;
}
