/**
 * Injection token for the MetricsAggregator service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { IMetricsAggregator } from "@/infrastructure/observability/interfaces/metrics-aggregator.interface";

/**
 * Injection token for the MetricsAggregator service.
 *
 * Provides aggregation of raw metrics into snapshots.
 *
 * @example
 * ```typescript
 * const aggregator = container.resolve(metricsAggregatorToken);
 * const snapshot = aggregator.aggregate(rawMetrics);
 * ```
 */
export const metricsAggregatorToken = createInjectionToken<IMetricsAggregator>("MetricsAggregator");
