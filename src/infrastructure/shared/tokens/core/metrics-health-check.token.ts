/**
 * Injection token for the MetricsHealthCheck.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { HealthCheck } from "@/application/health/health-check.interface";

/**
 * Injection token for the MetricsHealthCheck.
 *
 * Health check that validates metrics and port selection status.
 *
 * @example
 * ```typescript
 * const check = container.resolve(metricsHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if no port failures
 * ```
 */
export const metricsHealthCheckToken = createInjectionToken<HealthCheck>("MetricsHealthCheck");
