/**
 * Injection token for accessing the ServiceContainer itself.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ServiceContainer } from "@/infrastructure/di/container";

/**
 * Injection token for accessing the ServiceContainer itself.
 *
 * Primarily used for infrastructure services (e.g., health checks) that need
 * direct insight into the container state.
 */
export const serviceContainerToken = createInjectionToken<ServiceContainer>("ServiceContainer");
