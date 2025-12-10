import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { HealthStatus } from "@/domain/types/health-status";
import type { MetricsSnapshot } from "@/infrastructure/observability/metrics-types";
import type { IApiHealthMetricsProvider } from "../interfaces/api-component-interfaces";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { moduleHealthServiceToken } from "@/infrastructure/shared/tokens/core/module-health-service.token";

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
    const metricsResult = container.resolveWithError(metricsCollectorToken);
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
    const metricsCollector = castResolvedService<MetricsCollector>(metricsResult.value);
    return metricsCollector.getSnapshot();
  }

  /**
   * Gets module health status.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Health status with checks and overall status
   */
  getHealth(container: PlatformContainerPort): HealthStatus {
    // Delegate to ModuleHealthService for health checks
    const healthServiceResult = container.resolveWithError(moduleHealthServiceToken);
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
    const healthService = castResolvedService<ModuleHealthService>(healthServiceResult.value);
    return healthService.getHealth();
  }
}
