import type { MetricsPersistenceState } from "@/observability/metrics-collector";

/**
 * Abstraction for persisting metrics state.
 *
 * Implementations may use browser storage (localStorage), IndexedDB,
 * server APIs, or in-memory strategies for testing.
 */
export interface MetricsStorage {
  /**
   * Loads previously persisted metrics state.
   *
   * @returns Restored state, or null when nothing was persisted
   */
  load(): MetricsPersistenceState | null;

  /**
   * Persists the provided metrics state.
   *
   * @param state - State to persist
   */
  save(state: MetricsPersistenceState): void;

  /**
   * Clears persisted metrics data.
   */
  clear?(): void;
}

export const DEFAULT_METRICS_STORAGE_KEY = "fvtt_relationship_app_module.metrics";
