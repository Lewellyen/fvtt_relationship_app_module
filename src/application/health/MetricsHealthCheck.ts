import type { PlatformMetricsSnapshotPort } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import { platformMetricsSnapshotPortToken } from "@/application/tokens/domain-ports.tokens";
import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
import type { HealthCheck } from "./health-check.interface";
import type { HealthCheckRegistry } from "./HealthCheckRegistry";

/**
 * Health check that surfaces critical issues from the metrics collector
 * (port selection failures and container resolution errors).
 */
export class MetricsHealthCheck implements HealthCheck {
  readonly name = "metrics";
  private readonly metricsSnapshotPort: PlatformMetricsSnapshotPort;

  constructor(metricsSnapshotPort: PlatformMetricsSnapshotPort) {
    this.metricsSnapshotPort = metricsSnapshotPort;
  }

  check(): boolean {
    const snapshot = this.metricsSnapshotPort.getSnapshot();
    const hasPortFailures = Object.keys(snapshot.portSelectionFailures).length > 0;
    const hasResolutionErrors = snapshot.resolutionErrors > 0;
    return !hasPortFailures && !hasResolutionErrors;
  }

  getDetails(): string | null {
    const snapshot = this.metricsSnapshotPort.getSnapshot();
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
  static dependencies = [platformMetricsSnapshotPortToken, healthCheckRegistryToken] as const;

  constructor(metricsSnapshotPort: PlatformMetricsSnapshotPort, registry: HealthCheckRegistry) {
    super(metricsSnapshotPort);
    registry.register(this);
  }
}
