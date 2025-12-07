import type { PlatformMetricsSnapshotPort } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import type { MetricsSnapshot } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import type { MetricsCollector } from "./metrics-collector";

/**
 * Adapter that wraps MetricsCollector to implement PlatformMetricsSnapshotPort.
 *
 * This adapter allows Application Layer to access metrics without directly
 * depending on Infrastructure Layer's MetricsCollector.
 */
export class MetricsSnapshotAdapter implements PlatformMetricsSnapshotPort {
  constructor(private readonly metricsCollector: MetricsCollector) {}

  getSnapshot(): MetricsSnapshot {
    // MetricsCollector.getSnapshot() returns the same structure as MetricsSnapshot
    return this.metricsCollector.getSnapshot() as MetricsSnapshot;
  }
}
