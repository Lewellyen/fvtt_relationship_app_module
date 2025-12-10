/**
 * Type definitions for metrics snapshots and persistence.
 * Separated to avoid circular dependencies.
 */

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
