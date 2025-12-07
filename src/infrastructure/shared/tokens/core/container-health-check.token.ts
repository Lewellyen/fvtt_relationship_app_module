/**
 * Injection token for the ContainerHealthCheck.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";

/**
 * Injection token for the ContainerHealthCheck.
 *
 * Health check that validates the DI container state.
 *
 * @example
 * ```typescript
 * const check = container.resolve(containerHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if container is validated
 * ```
 */
export const containerHealthCheckToken =
  createInjectionToken<ContainerHealthCheck>("ContainerHealthCheck");
