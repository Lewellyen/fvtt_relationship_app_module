import type { HealthStatus } from "@/core/module-api";
import type { HealthCheckRegistry } from "@/core/health/health-check-registry";
import { healthCheckRegistryToken } from "@/tokens/tokenindex";

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
  static dependencies = [healthCheckRegistryToken] as const;

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
    const someUnhealthy = Array.from(results.values()).some((result) => !result);

    let status: "healthy" | "degraded" | "unhealthy";
    if (allHealthy) {
      status = "healthy";
    } else if (someUnhealthy) {
      // Container check failure = unhealthy, other failures = degraded
      status = results.get("container") === false ? "unhealthy" : "degraded";
    } /* c8 ignore start -- Defensive: This branch is logically unreachable (allHealthy is inverse of someUnhealthy) */ else {
      status = "healthy";
    }
    /* c8 ignore stop */

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
