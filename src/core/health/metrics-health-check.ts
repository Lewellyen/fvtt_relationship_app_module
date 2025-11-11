/**
 * Health check for metrics and port selection status.
 */

import type { HealthCheck } from "./health-check.interface";
import type { MetricsCollector } from "@/observability/metrics-collector";

export class MetricsHealthCheck implements HealthCheck {
  readonly name = "metrics";

  constructor(private readonly metrics: MetricsCollector) {}

  check(): boolean {
    const snapshot = this.metrics.getSnapshot();
    const hasPortFailures = Object.keys(snapshot.portSelectionFailures).length > 0;
    return !hasPortFailures && snapshot.resolutionErrors === 0;
  }

  getDetails(): string | null {
    const snapshot = this.metrics.getSnapshot();
    const failures = Object.keys(snapshot.portSelectionFailures);
    if (failures.length > 0) {
      return `Port selection failures: ${failures.join(", ")}`;
    }
    if (snapshot.resolutionErrors > 0) {
      return `Resolution errors: ${snapshot.resolutionErrors}`;
    }
    return null;
  }

  dispose(): void {
    // No cleanup needed - metricsCollector is managed externally
  }
}
