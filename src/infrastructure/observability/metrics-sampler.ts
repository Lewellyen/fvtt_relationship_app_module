/**
 * Metrics sampler for performance tracking decisions.
 *
 * Separated from MetricsCollector to follow Single Responsibility Principle.
 * This class is responsible only for sampling decisions, not metric collection.
 *
 * @see MetricsCollector for metric collection
 * @see MetricsReporter for metric reporting
 */

import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { MetricsSampler as MetricsSamplerInterface } from "./interfaces/metrics-sampler";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";

/**
 * Metrics sampler implementation.
 *
 * Determines if a performance operation should be sampled based on
 * configured sampling rates and environment mode.
 *
 * @example
 * ```typescript
 * const sampler = container.resolve(metricsSamplerToken);
 * if (sampler.shouldSample()) {
 *   // Measure performance
 * }
 * ```
 */
export class MetricsSampler implements MetricsSamplerInterface {
  constructor(private readonly config: PlatformRuntimeConfigPort) {}

  /**
   * Determines if a performance operation should be sampled based on sampling rate.
   *
   * In production mode, uses probabilistic sampling to reduce overhead.
   * In development mode, always samples (returns true).
   *
   * @returns True if the operation should be measured/recorded
   *
   * @example
   * ```typescript
   * const sampler = container.resolve(metricsSamplerToken);
   * if (sampler.shouldSample()) {
   *   performance.mark('operation-start');
   *   // ... operation ...
   *   performance.mark('operation-end');
   *   performance.measure('operation', 'operation-start', 'operation-end');
   * }
   * ```
   */
  shouldSample(): boolean {
    // Always sample in development mode
    if (this.config.get("isDevelopment")) {
      return true;
    }

    // Probabilistic sampling in production based on configured rate
    return Math.random() < this.config.get("performanceSamplingRate");
  }
}

/**
 * DI wrapper for MetricsSampler.
 */
export class DIMetricsSampler extends MetricsSampler {
  static dependencies = [runtimeConfigToken] as const;

  constructor(config: PlatformRuntimeConfigPort) {
    super(config);
  }
}
