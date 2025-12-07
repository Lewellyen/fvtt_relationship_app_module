/**
 * Injection token for the MetricsSampler interface.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";

/**
 * Injection token for the MetricsSampler interface.
 *
 * Provides sampling decision capability without full MetricsCollector features.
 * Use this token when you only need to check if sampling should occur.
 *
 * **Design:** Implements Interface Segregation Principle - depend on minimal interface.
 *
 * @example
 * ```typescript
 * class PerformanceTracker {
 *   static dependencies = [metricsSamplerToken] as const;
 *   constructor(private sampler: MetricsSampler) {}
 *   // Can check sampling but not record or query
 * }
 * ```
 */
export const metricsSamplerToken = createInjectionToken<MetricsSampler>("MetricsSampler");
