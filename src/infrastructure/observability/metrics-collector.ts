import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { MetricsRecorder } from "./interfaces/metrics-recorder";

/**
 * Snapshot of current metrics data.
 * Provides read-only access to collected performance metrics.
 */
export interface MetricsSnapshot {
  /** Total number of container service resolutions */
  containerResolutions: number;
  /** Number of failed resolution attempts */
  resolutionErrors: number;
  /** Average resolution time in milliseconds (rolling window) */
  avgResolutionTimeMs: number;
  /** Count of port selections by Foundry version */
  portSelections: Record<number, number>;
  /** Count of port selection failures by Foundry version */
  portSelectionFailures: Record<number, number>;
  /** Cache hit rate as percentage (0-100) */
  cacheHitRate: number;
}

/**
 * Serializable snapshot of internal metrics state used for persistence.
 */
export interface MetricsPersistenceState {
  metrics: {
    containerResolutions: number;
    resolutionErrors: number;
    cacheHits: number;
    cacheMisses: number;
    portSelections: Record<number, number>;
    portSelectionFailures: Record<number, number>;
  };
  resolutionTimes: number[];
  resolutionTimesIndex: number;
  resolutionTimesCount: number;
}

/**
 * Metrics collector for observability and performance tracking.
 *
 * Implements MetricsRecorder interface to provide
 * segregated access for recording metrics (Interface Segregation Principle).
 *
 * Collects performance metrics for:
 * - Container service resolutions
 * - Port selections
 * - Cache hit/miss rates
 *
 * Metrics are only collected when ENV.enablePerformanceTracking is true.
 *
 * Now managed via Dependency Injection as a Singleton service.
 *
 * **Design:** Follows Single Responsibility Principle:
 * - Metrics collection only (this class)
 * - Sampling decisions: MetricsSampler
 * - Reporting/logging: MetricsReporter
 *
 * @example
 * ```typescript
 * const collector = container.resolve(metricsCollectorToken);
 * collector.recordResolution(token, 2.5, true);
 *
 * const snapshot = collector.getSnapshot();
 * console.log(`Avg resolution time: ${snapshot.avgResolutionTimeMs}ms`);
 * ```
 */
export class MetricsCollector implements MetricsRecorder {
  static dependencies: readonly InjectionToken<unknown>[] = [runtimeConfigToken];

  private metrics = {
    containerResolutions: 0,
    resolutionErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    portSelections: new Map<number, number>(),
    portSelectionFailures: new Map<number, number>(),
  };

  // Circular buffer for resolution times (more efficient than array shift)
  private resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
  private resolutionTimesIndex = 0;
  private resolutionTimesCount = 0;
  private readonly MAX_RESOLUTION_TIMES = METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE;

  constructor(private readonly config: RuntimeConfigService) {}

  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token: InjectionToken<unknown>, durationMs: number, success: boolean): void {
    this.metrics.containerResolutions++;

    if (!success) {
      this.metrics.resolutionErrors++;
    }

    // Circular buffer: O(1) instead of O(n) with array shift
    this.resolutionTimes[this.resolutionTimesIndex] = durationMs;
    this.resolutionTimesIndex = (this.resolutionTimesIndex + 1) % this.MAX_RESOLUTION_TIMES;
    this.resolutionTimesCount = Math.min(this.resolutionTimesCount + 1, this.MAX_RESOLUTION_TIMES);

    this.onStateChanged();
  }

  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version: number): void {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
    this.onStateChanged();
  }

  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version: number): void {
    const count = this.metrics.portSelectionFailures.get(version) ?? 0;
    this.metrics.portSelectionFailures.set(version, count + 1);
    this.onStateChanged();
  }

  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    this.onStateChanged();
  }

  /**
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot {
    // Calculate average from circular buffer
    const times = this.resolutionTimes.slice(0, this.resolutionTimesCount);
    const sum = times.reduce((acc, time) => acc + time, 0);
    const avgTime = this.resolutionTimesCount > 0 ? sum / this.resolutionTimesCount : 0;

    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalCacheAccess > 0 ? (this.metrics.cacheHits / totalCacheAccess) * 100 : 0;

    return {
      containerResolutions: this.metrics.containerResolutions,
      resolutionErrors: this.metrics.resolutionErrors,
      avgResolutionTimeMs: avgTime,
      portSelections: Object.fromEntries(this.metrics.portSelections),
      portSelectionFailures: Object.fromEntries(this.metrics.portSelectionFailures),
      cacheHitRate,
    };
  }

  /**
   * Resets all collected metrics.
   * Useful for testing or starting fresh measurements.
   */
  reset(): void {
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: new Map(),
      portSelectionFailures: new Map(),
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
    this.onStateChanged();
  }

  /**
   * Hook invoked after state mutations. Subclasses can override to react
   * (e.g., persist metrics).
   */

  protected onStateChanged(): void {}

  /**
   * Captures the internal state for persistence.
   *
   * @returns Serializable metrics state
   */
  protected getPersistenceState(): MetricsPersistenceState {
    return {
      metrics: {
        containerResolutions: this.metrics.containerResolutions,
        resolutionErrors: this.metrics.resolutionErrors,
        cacheHits: this.metrics.cacheHits,
        cacheMisses: this.metrics.cacheMisses,
        portSelections: Object.fromEntries(this.metrics.portSelections),
        portSelectionFailures: Object.fromEntries(this.metrics.portSelectionFailures),
      },
      resolutionTimes: Array.from(this.resolutionTimes),
      resolutionTimesIndex: this.resolutionTimesIndex,
      resolutionTimesCount: this.resolutionTimesCount,
    };
  }

  /**
   * Restores internal state from a persisted snapshot.
   *
   * @param state - Persisted metrics state
   */
  protected restoreFromPersistenceState(state: MetricsPersistenceState | null | undefined): void {
    if (!state) {
      return;
    }

    const { metrics, resolutionTimes, resolutionTimesCount, resolutionTimesIndex } = state;

    this.metrics = {
      containerResolutions: Math.max(0, metrics?.containerResolutions ?? 0),
      resolutionErrors: Math.max(0, metrics?.resolutionErrors ?? 0),
      cacheHits: Math.max(0, metrics?.cacheHits ?? 0),
      cacheMisses: Math.max(0, metrics?.cacheMisses ?? 0),
      portSelections: new Map<number, number>(
        Object.entries(metrics?.portSelections ?? {}).map(([key, value]) => [
          Number(key),
          Number.isFinite(Number(value)) ? Number(value) : 0,
        ])
      ),
      portSelectionFailures: new Map<number, number>(
        Object.entries(metrics?.portSelectionFailures ?? {}).map(([key, value]) => [
          Number(key),
          Number.isFinite(Number(value)) ? Number(value) : 0,
        ])
      ),
    };

    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    if (Array.isArray(resolutionTimes)) {
      const maxLength = Math.min(resolutionTimes.length, this.resolutionTimes.length);
      for (let index = 0; index < maxLength; index++) {
        const value = Number(resolutionTimes[index]);
        this.resolutionTimes[index] = Number.isFinite(value) ? value : 0;
      }
    }

    const safeIndex = Number.isFinite(resolutionTimesIndex) ? Number(resolutionTimesIndex) : 0;
    const safeCount = Number.isFinite(resolutionTimesCount) ? Number(resolutionTimesCount) : 0;

    this.resolutionTimesIndex = Math.min(Math.max(0, safeIndex), this.MAX_RESOLUTION_TIMES - 1);
    this.resolutionTimesCount = Math.min(Math.max(0, safeCount), this.MAX_RESOLUTION_TIMES);
  }
}

export class DIMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<unknown>[] = [runtimeConfigToken];

  constructor(config: RuntimeConfigService) {
    super(config);
  }
}
