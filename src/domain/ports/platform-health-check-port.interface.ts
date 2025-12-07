import type { HealthCheck } from "@/domain/types/health-check";

/**
 * Platform-agnostic port for health check registry.
 * Provides centralized health monitoring for services.
 */
export interface PlatformHealthCheckPort {
  /**
   * Registers a health check.
   */
  register(check: HealthCheck): void;

  /**
   * Unregisters a health check by name.
   */
  unregister(name: string): void;

  /**
   * Runs all registered health checks.
   * @returns Map of check name to health status (true = healthy, false = unhealthy)
   */
  runAll(): Map<string, boolean>;

  /**
   * Gets a specific health check by name.
   */
  getCheck(name: string): HealthCheck | undefined;

  /**
   * Gets all registered health checks.
   */
  getAllChecks(): HealthCheck[];
}
