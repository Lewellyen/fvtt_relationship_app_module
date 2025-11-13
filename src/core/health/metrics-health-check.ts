import type { MetricsCollector } from "@/observability/metrics-collector";
import { healthCheckRegistryToken, metricsCollectorToken } from "@/tokens/tokenindex";
import type { HealthCheck } from "./health-check.interface";
import type { HealthCheckRegistry } from "./health-check-registry";

/**
 * Health check that surfaces critical issues from the metrics collector
 * (port selection failures and container resolution errors).
 */
export class MetricsHealthCheck implements HealthCheck {
  readonly name = "metrics";
  private readonly metricsCollector: MetricsCollector;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
  }

  check(): boolean {
    const snapshot = this.metricsCollector.getSnapshot();
    const hasPortFailures = Object.keys(snapshot.portSelectionFailures).length > 0;
    const hasResolutionErrors = snapshot.resolutionErrors > 0;
    return !hasPortFailures && !hasResolutionErrors;
  }

  getDetails(): string | null {
    const snapshot = this.metricsCollector.getSnapshot();
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
    // No resources to dispose – collector lives for the entire runtime.
  }
}

export class DIMetricsHealthCheck extends MetricsHealthCheck {
  static dependencies = [metricsCollectorToken, healthCheckRegistryToken] as const;

  constructor(metricsCollector: MetricsCollector, registry: HealthCheckRegistry) {
    super(metricsCollector);
    registry.register(this);
  }
}
