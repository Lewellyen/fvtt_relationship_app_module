/**
 * Injection token for the HealthCheckRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";

/**
 * Injection token for the HealthCheckRegistry.
 *
 * Central registry for health checks that can be dynamically registered.
 * Services implement HealthCheck interface and register themselves.
 *
 * @example
 * ```typescript
 * const registry = container.resolve(healthCheckRegistryToken);
 * registry.register(new ContainerHealthCheck(container));
 * const results = registry.runAll();
 * ```
 */
export const healthCheckRegistryToken =
  createInjectionToken<HealthCheckRegistry>("HealthCheckRegistry");
