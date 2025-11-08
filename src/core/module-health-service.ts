import type { ServiceContainer } from "@/di_infrastructure/container";
import type { MetricsCollector } from "@/observability/metrics-collector";
import type { HealthStatus } from "@/core/module-api";
import { metricsCollectorToken } from "@/tokens/tokenindex";

/**
 * Service for monitoring module health and diagnostics.
 *
 * Responsibilities:
 * - Check container validation state
 * - Check port selection status
 * - Aggregate metrics for health assessment
 * - Provide structured health status
 *
 * Extracted from CompositionRoot to follow Single Responsibility Principle.
 */
export class ModuleHealthService {
  static dependencies = [metricsCollectorToken] as const;

  constructor(
    private readonly container: ServiceContainer,
    private readonly metricsCollector: MetricsCollector
  ) {}

  /**
   * Gets the current health status of the module.
   *
   * Health is determined by:
   * - Container validation state (must be "validated")
   * - Port selection success (at least one port selected)
   * - Resolution errors (none expected)
   *
   * @returns HealthStatus with overall status, individual checks, and timestamp
   *
   * @example
   * ```typescript
   * const healthService = container.resolve(moduleHealthServiceToken);
   * const health = healthService.getHealth();
   *
   * if (health.status !== 'healthy') {
   *   console.warn('Module is not healthy:', health.checks);
   * }
   * ```
   */
  getHealth(): HealthStatus {
    /* c8 ignore next -- Container is always validated after bootstrap, unhealthy path requires internal state manipulation */
    const containerValidated = this.container.getValidationState() === "validated";

    // Get metrics snapshot
    const metrics = this.metricsCollector.getSnapshot();

    // Fallback to containerValidated when performance tracking is disabled (production mode)
    // If container is validated, ports must have been selected successfully
    const hasPortSelections = Object.keys(metrics.portSelections).length > 0 || containerValidated;
    const hasPortFailures = Object.keys(metrics.portSelectionFailures).length > 0;

    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy";
    /* c8 ignore start -- Container is always validated after bootstrap; unhealthy status requires internal manipulation */
    if (!containerValidated) {
      status = "unhealthy";
    } else if (hasPortFailures || metrics.resolutionErrors > 0) {
      /* c8 ignore stop */
      status = "degraded";
    } else {
      status = "healthy";
    }

    return {
      status,
      checks: {
        containerValidated,
        portsSelected: hasPortSelections,
        lastError: hasPortFailures
          ? `Port selection failures detected for versions: ${Object.keys(metrics.portSelectionFailures).join(", ")}`
          : null,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
