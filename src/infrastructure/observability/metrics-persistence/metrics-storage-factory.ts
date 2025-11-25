import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import { LocalStorageMetricsStorage } from "./local-storage-metrics-storage";

/**
 * Factory function for creating MetricsStorage instances.
 *
 * Abstracts the concrete implementation from the DI configuration.
 * This allows easy swapping of storage backends without changing the config.
 *
 * @param key - Storage key for persisting metrics
 * @returns MetricsStorage instance
 *
 * @example
 * ```typescript
 * // Production: Use localStorage
 * const storage = createMetricsStorage("my-app.metrics");
 *
 * // Testing: Use in-memory storage
 * const storage = createInMemoryMetricsStorage();
 * ```
 */
export function createMetricsStorage(key: string): MetricsStorage {
  return new LocalStorageMetricsStorage(key);
}

/**
 * Creates an in-memory MetricsStorage for testing.
 * Data is not persisted and is lost when the instance is garbage collected.
 *
 * @returns MetricsStorage instance that stores data only in memory
 */
export function createInMemoryMetricsStorage(): MetricsStorage {
  let state: MetricsPersistenceState | null = null;

  return {
    load(): MetricsPersistenceState | null {
      return state;
    },
    save(newState: MetricsPersistenceState): void {
      state = newState;
    },
    clear(): void {
      state = null;
    },
  };
}
