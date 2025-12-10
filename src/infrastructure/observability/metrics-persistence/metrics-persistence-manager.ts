import type { IRawMetrics } from "../interfaces/raw-metrics.interface";
import type { IMetricsPersistenceManager } from "../interfaces/metrics-persistence-manager.interface";
import type { MetricsPersistenceState } from "../metrics-types";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";

/**
 * Manages serialization and deserialization of metrics state.
 *
 * Follows Single Responsibility Principle: Only responsible for persistence operations.
 */
export class MetricsPersistenceManager implements IMetricsPersistenceManager {
  /**
   * Serializes raw metrics into a persistence state.
   *
   * @param metrics - Raw metrics data
   * @returns Serializable persistence state
   */
  serialize(metrics: IRawMetrics): MetricsPersistenceState {
    return {
      metrics: {
        containerResolutions: metrics.containerResolutions,
        resolutionErrors: metrics.resolutionErrors,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
        portSelections: Object.fromEntries(metrics.portSelections),
        portSelectionFailures: Object.fromEntries(metrics.portSelectionFailures),
      },
      resolutionTimes: Array.from(metrics.resolutionTimes),
      resolutionTimesIndex: metrics.resolutionTimesIndex,
      resolutionTimesCount: metrics.resolutionTimesCount,
    };
  }

  /**
   * Deserializes a persistence state into raw metrics.
   *
   * @param state - Persisted state (can be null or undefined)
   * @returns Raw metrics data
   */
  deserialize(state: MetricsPersistenceState | null | undefined): IRawMetrics {
    if (!state) {
      return this.createEmptyRawMetrics();
    }

    const { metrics, resolutionTimes, resolutionTimesCount, resolutionTimesIndex } = state;

    const rawMetrics: IRawMetrics = {
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
      resolutionTimes: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    };

    if (Array.isArray(resolutionTimes)) {
      const maxLength = Math.min(resolutionTimes.length, rawMetrics.resolutionTimes.length);
      for (let index = 0; index < maxLength; index++) {
        const value = Number(resolutionTimes[index]);
        rawMetrics.resolutionTimes[index] = Number.isFinite(value) ? value : 0;
      }

      const safeIndex = Number.isFinite(resolutionTimesIndex) ? Number(resolutionTimesIndex) : 0;
      const safeCount = Number.isFinite(resolutionTimesCount) ? Number(resolutionTimesCount) : 0;

      rawMetrics.resolutionTimesIndex = Math.min(
        Math.max(0, safeIndex),
        METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE - 1
      );
      rawMetrics.resolutionTimesCount = Math.min(
        Math.max(0, safeCount),
        METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE
      );
    } else {
      // If resolutionTimes is not an array, reset index and count
      rawMetrics.resolutionTimesIndex = 0;
      rawMetrics.resolutionTimesCount = 0;
    }

    return rawMetrics;
  }

  /**
   * Creates an empty raw metrics structure.
   *
   * @returns Empty raw metrics
   */
  private createEmptyRawMetrics(): IRawMetrics {
    return {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: new Map<number, number>(),
      portSelectionFailures: new Map<number, number>(),
      resolutionTimes: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    };
  }
}
