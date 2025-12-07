/**
 * Injection token for the RuntimeConfigService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

/**
 * Injection token for the RuntimeConfigService.
 *
 * Provides access to the merged configuration layer that combines build-time
 * environment defaults with runtime Foundry settings and notifies consumers
 * of live changes.
 */
export const runtimeConfigToken =
  createInjectionToken<RuntimeConfigService>("RuntimeConfigService");
