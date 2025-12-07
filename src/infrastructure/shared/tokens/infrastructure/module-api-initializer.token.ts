/**
 * Injection token for the ModuleApiInitializer.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";

/**
 * Injection token for the ModuleApiInitializer.
 *
 * Initializes and exposes the public module API to external consumers.
 * Manages API-safe tokens and provides health status.
 */
export const moduleApiInitializerToken =
  createInjectionToken<ModuleApiInitializer>("ModuleApiInitializer");
