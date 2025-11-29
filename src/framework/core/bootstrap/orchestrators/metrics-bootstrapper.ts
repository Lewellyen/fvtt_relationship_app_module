import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens";
import { PersistentMetricsCollector } from "@/infrastructure/observability/metrics-persistence/persistent-metrics-collector";

/**
 * Orchestrator for initializing metrics persistence during bootstrap.
 *
 * Responsibilities:
 * - Resolve MetricsCollector
 * - Check if it's a PersistentMetricsCollector
 * - Call initialize() if needed
 */
export class MetricsBootstrapper {
  /**
   * Initializes metrics collector if it supports persistence.
   *
   * @param container - ContainerPort for service resolution
   * @returns Result indicating success (warnings logged but don't fail bootstrap)
   */
  static initializeMetrics(container: ContainerPort): Result<void, string> {
    const metricsResult = container.resolveWithError(metricsCollectorToken);
    if (!metricsResult.ok) {
      // Metrics collector not available - return success (optional)
      return ok(undefined);
    }

    // Check if it's a PersistentMetricsCollector
    const collector = metricsResult.value;
    if (collector instanceof PersistentMetricsCollector) {
      const initResult = collector.initialize();
      if (!initResult.ok) {
        // Log warning but don't fail bootstrap
        return ok(undefined);
      }
    }

    return ok(undefined);
  }
}
