/**
 * Injection token for the CacheService configuration.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { CacheServiceConfig } from "@/infrastructure/cache/cache.interface";

/**
 * Injection token for the CacheService configuration.
 */
export const cacheServiceConfigToken =
  createInjectionToken<CacheServiceConfig>("CacheServiceConfig");
