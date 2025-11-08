/**
 * Performance tracking utilities with sampling support.
 * Provides centralized performance measurement with configurable sampling rates.
 */

import type { EnvironmentConfig } from "@/config/environment";
import type { MetricsCollector } from "@/observability/metrics-collector";

/**
 * Wraps an operation with performance tracking and sampling.
 *
 * Only measures performance when:
 * 1. Performance tracking is enabled (env.enablePerformanceTracking)
 * 2. MetricsCollector is available
 * 3. Sampling check passes (metricsCollector.shouldSample())
 *
 * This prevents unnecessary performance.now() calls in production
 * when sampling rate is < 100%.
 *
 * @template T - Return type of the operation
 * @param env - Environment configuration (injected for DIP compliance)
 * @param metricsCollector - MetricsCollector instance (can be null)
 * @param operation - Function to execute and measure
 * @param onComplete - Optional callback with duration and result
 * @returns Result of the operation
 *
 * @example
 * ```typescript
 * const result = withPerformanceTracking(
 *   env,
 *   metricsCollector,
 *   () => expensiveOperation(),
 *   (duration, result) => {
 *     metricsCollector.recordResolution(token, duration, result.ok);
 *   }
 * );
 * ```
 */
export function withPerformanceTracking<T>(
  env: EnvironmentConfig,
  metricsCollector: MetricsCollector | null,
  operation: () => T,
  onComplete?: (duration: number, result: T) => void
): T {
  // Early exit if performance tracking is disabled or sampling fails
  if (!env.enablePerformanceTracking || !metricsCollector?.shouldSample()) {
    return operation();
  }

  const startTime = performance.now();
  const result = operation();
  const duration = performance.now() - startTime;

  if (onComplete) {
    onComplete(duration, result);
  }

  return result;
}

/**
 * Async variant of withPerformanceTracking for async operations.
 *
 * @template T - Return type of the async operation
 * @param env - Environment configuration (injected for DIP compliance)
 * @param metricsCollector - MetricsCollector instance (can be null)
 * @param operation - Async function to execute and measure
 * @param onComplete - Optional callback with duration and result
 * @returns Promise with result of the operation
 *
 * @example
 * ```typescript
 * const result = await withPerformanceTrackingAsync(
 *   env,
 *   metricsCollector,
 *   async () => await fetchData(),
 *   (duration, result) => {
 *     metricsCollector.recordOperation(duration, result.ok);
 *   }
 * );
 * ```
 */
export async function withPerformanceTrackingAsync<T>(
  env: EnvironmentConfig,
  metricsCollector: MetricsCollector | null,
  operation: () => Promise<T>,
  onComplete?: (duration: number, result: T) => void
): Promise<T> {
  // Early exit if performance tracking is disabled or sampling fails
  if (!env.enablePerformanceTracking || !metricsCollector?.shouldSample()) {
    return operation();
  }

  const startTime = performance.now();
  const result = await operation();
  const duration = performance.now() - startTime;

  if (onComplete) {
    onComplete(duration, result);
  }

  return result;
}
