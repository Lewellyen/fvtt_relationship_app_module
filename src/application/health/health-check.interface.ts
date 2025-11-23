import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for health checks.
 * Services can implement this to provide health status.
 */
export interface HealthCheck extends Disposable {
  /**
   * Unique identifier for this health check.
   */
  readonly name: string;

  /**
   * Performs the health check.
   * @returns true if healthy, false otherwise
   */
  check(): boolean;

  /**
   * Optional: Provides detailed error message if unhealthy.
   */
  getDetails?(): string | null;
}
