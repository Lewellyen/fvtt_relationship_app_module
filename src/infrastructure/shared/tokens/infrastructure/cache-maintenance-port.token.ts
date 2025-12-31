/**
 * Injection token for the CacheMaintenancePort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { CacheMaintenancePort } from "@/infrastructure/cache/cache.interface";

/**
 * Injection token for the CacheMaintenancePort.
 *
 * Provides access to cache internal components (config manager, store, policy)
 * for infrastructure components that need maintenance capabilities.
 *
 * Follows Interface Segregation Principle (ISP) by separating maintenance
 * operations from normal cache operations.
 */
export const cacheMaintenancePortToken =
  createInjectionToken<CacheMaintenancePort>("CacheMaintenancePort");
