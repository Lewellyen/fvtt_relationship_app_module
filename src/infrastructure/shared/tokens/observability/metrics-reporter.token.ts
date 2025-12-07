/**
 * Injection token for the MetricsReporter service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsReporter } from "@/infrastructure/observability/metrics-reporter";

/**
 * Injection token for the MetricsReporter service.
 *
 * Provides metrics reporting and logging capability without full MetricsCollector features.
 * Use this token when you need to format or log metrics, not collect them.
 *
 * **Design:** Implements Interface Segregation Principle - separate reporting from collection.
 *
 * @example
 * ```typescript
 * const reporter = container.resolve(metricsReporterToken);
 * reporter.logSummary();
 * const json = reporter.toJSON();
 * ```
 */
export const metricsReporterToken = createInjectionToken<MetricsReporter>("MetricsReporter");
