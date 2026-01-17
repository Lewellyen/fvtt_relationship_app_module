import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { HealthStatus } from "@/domain/types/health-status";
import type { IApiHealthMetricsProvider } from "../interfaces/api-component-interfaces";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import type {
  PlatformMetricsSnapshotPort,
  MetricsSnapshot,
} from "@/domain/ports/platform-metrics-snapshot-port.interface";
import { platformMetricsSnapshotPortToken } from "@/application/tokens/domain-ports.tokens";
import { moduleHealthServiceToken } from "@/application/tokens/application.tokens";

/**
 * ApiHealthMetricsProvider
 *
 * Responsible for providing health and metrics information.
 * Separated from ModuleApiInitializer for Single Responsibility Principle.
 */
export class ApiHealthMetricsProvider implements IApiHealthMetricsProvider {
  /**
   * Gets a snapshot of performance metrics.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Current metrics snapshot
   */
  getMetrics(container: PlatformContainerPort): MetricsSnapshot {
    const metricsResult = container.resolveWithError<PlatformMetricsSnapshotPort>(
      platformMetricsSnapshotPortToken
    );
    if (!metricsResult.ok) {
      return {
        containerResolutions: 0,
        resolutionErrors: 0,
        avgResolutionTimeMs: 0,
        portSelections: {},
        portSelectionFailures: {},
        cacheHitRate: 0,
      };
    }
    const metricsPort = metricsResult.value;
    return metricsPort.getSnapshot();
  }

  /**
   * Gets module health status.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Health status with checks and overall status
   */
  getHealth(container: PlatformContainerPort): HealthStatus {
    // Delegate to ModuleHealthService for health checks
    const healthServiceResult =
      container.resolveWithError<ModuleHealthService>(moduleHealthServiceToken);
    if (!healthServiceResult.ok) {
      // Fallback health status if service cannot be resolved
      return {
        status: "unhealthy",
        checks: {
          containerValidated: false,
          portsSelected: false,
          lastError: "ModuleHealthService not available",
        },
        timestamp: new Date().toISOString(),
      };
    }
    const healthService = healthServiceResult.value;
    return healthService.getHealth();
  }
}
