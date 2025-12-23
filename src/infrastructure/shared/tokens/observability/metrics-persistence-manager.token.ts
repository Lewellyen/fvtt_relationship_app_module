/**
 * Injection token for the MetricsPersistenceManager service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { IMetricsPersistenceManager } from "@/infrastructure/observability/interfaces/metrics-persistence-manager.interface";

/**
 * Injection token for the MetricsPersistenceManager service.
 *
 * Provides serialization and deserialization of metrics state.
 *
 * @example
 * ```typescript
 * const persistenceManager = container.resolve(metricsPersistenceManagerToken);
 * const state = persistenceManager.serialize(rawMetrics);
 * const restored = persistenceManager.deserialize(state);
 * ```
 */
export const metricsPersistenceManagerToken = createInjectionToken<IMetricsPersistenceManager>(
  "MetricsPersistenceManager"
);
