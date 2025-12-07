/**
 * Metrics reporter for formatting and logging metrics.
 *
 * Separated from MetricsCollector to follow Single Responsibility Principle.
 * This class is responsible only for reporting/logging metrics, not collection.
 *
 * @see MetricsCollector for metric collection
 * @see MetricsSampler for sampling decisions
 */

import type { MetricsCollector } from "./metrics-collector";
import type { Logger } from "@/infrastructure/logging/Logger";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability.tokens";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";

/**
 * Table data structure for console.table() output in logSummary().
 * Uses string keys to match console.table() expectations.
 * Naming convention disabled for console.table() compatibility.
 */
interface MetricsTableData {
  "Total Resolutions": number;
  Errors: number;
  "Avg Time (ms)": string;
  "Cache Hit Rate": string;
}

/**
 * Metrics reporter for formatting and logging metrics.
 *
 * Provides methods to format and log metrics data collected by MetricsCollector.
 * Separated from MetricsCollector to follow Single Responsibility Principle.
 *
 * @example
 * ```typescript
 * const reporter = container.resolve(metricsReporterToken);
 * reporter.logSummary();
 * const json = reporter.toJSON();
 * ```
 */
export class MetricsReporter {
  constructor(
    private readonly collector: MetricsCollector,
    private readonly logger?: Logger
  ) {}

  /**
   * Logs a formatted metrics summary to the console.
   * Uses console.table() for easy-to-read tabular output.
   */
  logSummary(): void {
    const snapshot = this.collector.getSnapshot();

    const tableData: MetricsTableData = {
      "Total Resolutions": snapshot.containerResolutions,
      Errors: snapshot.resolutionErrors,
      "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
      "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`,
    };
    console.table(tableData);
  }

  /**
   * Gibt Metrics als JSON zurück.
   *
   * @returns JSON string representation of metrics snapshot
   */
  toJSON(): string {
    return JSON.stringify(this.collector.getSnapshot(), null, 2);
  }
}

/**
 * DI wrapper for MetricsReporter.
 */
export class DIMetricsReporter extends MetricsReporter {
  static dependencies = [metricsCollectorToken, loggerToken] as const;

  constructor(
    collector: MetricsCollector,
    logger: Logger
  ) {
    super(collector, logger);
  }
}

