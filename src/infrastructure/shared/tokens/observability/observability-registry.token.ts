/**
 * Injection token for the ObservabilityRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";

/**
 * Injection token for the ObservabilityRegistry.
 *
 * Central registry for self-registering observable services.
 * Services register themselves at construction time for automatic observability.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(observability: ObservabilityRegistry) {
 *     observability.registerPortSelector(this);
 *   }
 * }
 * ```
 */
export const observabilityRegistryToken =
  createInjectionToken<ObservabilityRegistry>("ObservabilityRegistry");
