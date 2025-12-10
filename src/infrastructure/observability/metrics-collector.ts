import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { MetricsRecorder } from "./interfaces/metrics-recorder";
import type { IRawMetrics } from "./interfaces/raw-metrics.interface";
import { MetricsAggregator } from "./metrics-aggregator";
import { MetricsPersistenceManager } from "./metrics-persistence/metrics-persistence-manager";
import { MetricsStateManager } from "./metrics-state/metrics-state-manager";
import type { MetricsSnapshot, MetricsPersistenceState } from "./metrics-types";

// Re-export for backward compatibility
export type { MetricsSnapshot, MetricsPersistenceState } from "./metrics-types";

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
 * - Aggregation: MetricsAggregator
 * - Persistence: MetricsPersistenceManager
 * - State management: MetricsStateManager
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

  // SRP: Delegation to specialized components
  private readonly aggregator: MetricsAggregator;
  private readonly persistenceManager: MetricsPersistenceManager;
  private readonly stateManager: MetricsStateManager;

  constructor(private readonly config: RuntimeConfigService) {
    // Create components internally (can be injected in future if needed)
    this.aggregator = new MetricsAggregator();
    this.persistenceManager = new MetricsPersistenceManager();
    this.stateManager = new MetricsStateManager();
  }

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

    this.notifyStateChanged();
  }

  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version: number): void {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
    this.notifyStateChanged();
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
    this.notifyStateChanged();
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
    this.notifyStateChanged();
  }

  /**
   * Gets a snapshot of current metrics.
   * Delegates aggregation to MetricsAggregator.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot {
    return this.aggregator.aggregate(this.getRawMetrics());
  }

  /**
   * Gets raw metrics data without aggregation.
   * Used internally by aggregator and persistence manager.
   *
   * @returns Raw metrics data
   */
  getRawMetrics(): IRawMetrics {
    return {
      containerResolutions: this.metrics.containerResolutions,
      resolutionErrors: this.metrics.resolutionErrors,
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      portSelections: this.metrics.portSelections,
      portSelectionFailures: this.metrics.portSelectionFailures,
      resolutionTimes: this.resolutionTimes,
      resolutionTimesIndex: this.resolutionTimesIndex,
      resolutionTimesCount: this.resolutionTimesCount,
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
    this.stateManager.reset();
    this.notifyStateChanged();
  }

  /**
   * Hook invoked after state mutations. Subclasses can override to react
   * (e.g., persist metrics).
   */
  protected onStateChanged(): void {
    // Default implementation: notify state manager
    this.stateManager.notifyStateChanged();
  }

  /**
   * Notifies state manager of state changes.
   * Internal method that can be overridden by subclasses.
   */
  protected notifyStateChanged(): void {
    this.onStateChanged();
  }

  /**
   * Captures the internal state for persistence.
   * Delegates to MetricsPersistenceManager.
   *
   * @returns Serializable metrics state
   */
  protected getPersistenceState(): MetricsPersistenceState {
    return this.persistenceManager.serialize(this.getRawMetrics());
  }

  /**
   * Restores internal state from a persisted snapshot.
   * Delegates to MetricsPersistenceManager.
   *
   * @param state - Persisted metrics state
   */
  protected restoreFromPersistenceState(state: MetricsPersistenceState | null | undefined): void {
    const rawMetrics = this.persistenceManager.deserialize(state);
    this.applyRawMetrics(rawMetrics);
  }

  /**
   * Applies raw metrics to internal state.
   * Internal method used by restoreFromPersistenceState.
   *
   * @param rawMetrics - Raw metrics to apply
   */
  private applyRawMetrics(rawMetrics: IRawMetrics): void {
    this.metrics = {
      containerResolutions: rawMetrics.containerResolutions,
      resolutionErrors: rawMetrics.resolutionErrors,
      cacheHits: rawMetrics.cacheHits,
      cacheMisses: rawMetrics.cacheMisses,
      portSelections: rawMetrics.portSelections,
      portSelectionFailures: rawMetrics.portSelectionFailures,
    };

    // Create a new Float64Array to avoid type issues and ensure we have our own copy
    this.resolutionTimes = new Float64Array(rawMetrics.resolutionTimes);
    this.resolutionTimesIndex = rawMetrics.resolutionTimesIndex;
    this.resolutionTimesCount = rawMetrics.resolutionTimesCount;
  }
}

export class DIMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<unknown>[] = [runtimeConfigToken];

  constructor(config: RuntimeConfigService) {
    super(config);
  }
}
