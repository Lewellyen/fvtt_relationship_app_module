/**
 * Platform-agnostic port for accessing metrics snapshots.
 *
 * This port provides read-only access to observability metrics without
 * coupling to specific metrics collection implementations.
 *
 * @example
 * ```typescript
 * const metricsPort: PlatformMetricsSnapshotPort = container.resolve(platformMetricsSnapshotPortToken);
 * const snapshot = metricsPort.getSnapshot();
 * if (snapshot.resolutionErrors > 0) {
 *   console.warn("Container has resolution errors");
 * }
 * ```
 */
export interface PlatformMetricsSnapshotPort {
  /**
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot;
}

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
