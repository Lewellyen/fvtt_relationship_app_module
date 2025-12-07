import type { HealthStatus } from "@/domain/types/health-status";
import type { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";
import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";

/**
 * Service for monitoring module health and diagnostics.
 *
 * Uses Health-Check-Registry Pattern for extensible health monitoring.
 *
 * Responsibilities:
 * - Aggregate health checks from registry
 * - Determine overall health status
 * - Provide structured health status with details
 *
 * Extracted from CompositionRoot to follow Single Responsibility Principle.
 */
export class ModuleHealthService {
  private healthChecksInitialized = false;

  constructor(private readonly registry: HealthCheckRegistry) {}

  /**
   * Gets the current health status of the module.
   *
   * Health is determined by running all registered health checks.
   * Overall status:
   * - "healthy": All checks pass
   * - "unhealthy": Container check fails
   * - "degraded": Other checks fail
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
    // Lazy initialization: Ensure health checks are registered on first call
    // This is done lazily because health checks need to be resolved after container validation
    if (!this.healthChecksInitialized) {
      this.healthChecksInitialized = true;
      // Note: Health checks will be registered when their factories execute
      // This happens automatically when they are resolved for the first time
    }

    const results = this.registry.runAll();

    // Determine overall status
    const allHealthy = Array.from(results.values()).every((result) => result);

    // Determine health status based on results
    const status: "healthy" | "degraded" | "unhealthy" = allHealthy
      ? "healthy"
      : results.get("container") === false
        ? "unhealthy"
        : "degraded";

    // Collect details from unhealthy checks
    const checks = this.registry.getAllChecks();
    let lastError: string | null = null;

    for (const check of checks) {
      const result = results.get(check.name);
      if (!result && check.getDetails) {
        lastError = check.getDetails();
      }
    }

    return {
      status,
      checks: {
        containerValidated: results.get("container") ?? true,
        portsSelected: results.get("metrics") ?? true,
        lastError,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export class DIModuleHealthService extends ModuleHealthService {
  static dependencies = [healthCheckRegistryToken] as const;

  constructor(registry: HealthCheckRegistry) {
    super(registry);
  }
}
