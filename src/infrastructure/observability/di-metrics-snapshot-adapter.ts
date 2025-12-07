import { MetricsSnapshotAdapter } from "./metrics-snapshot-adapter";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import type { MetricsCollector } from "./metrics-collector";

/**
 * DI-enabled wrapper for MetricsSnapshotAdapter.
 * Resolves MetricsCollector from container.
 */
export class DIMetricsSnapshotAdapter extends MetricsSnapshotAdapter {
  static dependencies = [metricsCollectorToken] as const;

  constructor(metricsCollector: MetricsCollector) {
    super(metricsCollector);
  }
}
