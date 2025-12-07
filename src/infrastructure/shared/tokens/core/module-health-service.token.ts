/**
 * Injection token for the ModuleHealthService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";

/**
 * Injection token for the ModuleHealthService.
 *
 * Provides module health monitoring and diagnostics.
 * Checks container validation, port selection, and metrics for health assessment.
 *
 * @example
 * ```typescript
 * const healthService = container.resolve(moduleHealthServiceToken);
 * const health = healthService.getHealth();
 * console.log(`Module status: ${health.status}`);
 * ```
 */
export const moduleHealthServiceToken =
  createInjectionToken<ModuleHealthService>("ModuleHealthService");
