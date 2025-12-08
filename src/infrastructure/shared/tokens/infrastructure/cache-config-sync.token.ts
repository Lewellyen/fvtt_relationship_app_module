/**
 * Injection token for the CacheConfigSync.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { CacheConfigSync } from "@/infrastructure/cache/CacheConfigSync";

/**
 * Injection token for the CacheConfigSync.
 */
export const cacheConfigSyncToken = createInjectionToken<CacheConfigSync>("CacheConfigSync");
