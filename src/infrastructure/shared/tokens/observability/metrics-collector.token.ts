/**
 * Injection token for the MetricsCollector service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";

/**
 * Injection token for the MetricsCollector service.
 *
 * Provides observability and performance tracking for the DI container.
 * Collects metrics about service resolutions, port selections, and cache performance.
 *
 * @example
 * ```typescript
 * const metrics = container.resolve(metricsCollectorToken);
 * metrics.recordResolution(someToken, 2.5, true);
 * const snapshot = metrics.getSnapshot();
 * console.table(snapshot);
 * ```
 */
export const metricsCollectorToken = createInjectionToken<MetricsCollector>("MetricsCollector");
