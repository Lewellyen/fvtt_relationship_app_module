/**
 * Infrastructure service tokens for caching, performance, retry, and hooks.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { CacheService, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { RenderJournalDirectoryHook } from "@/application/use-cases/render-journal-directory-hook";
import type { JournalCacheInvalidationHook } from "@/application/use-cases/journal-cache-invalidation-hook";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";

/**
 * Injection token for the CacheService configuration.
 */
export const cacheServiceConfigToken =
  createInjectionToken<CacheServiceConfig>("CacheServiceConfig");

/**
 * Injection token for the CacheService.
 */
export const cacheServiceToken = createInjectionToken<CacheService>("CacheService");

/**
 * Injection token for the PerformanceTrackingService.
 *
 * Provides centralized performance tracking with sampling support.
 * Automatically injects EnvironmentConfig and MetricsCollector.
 *
 * @example
 * ```typescript
 * const perfService = container.resolve(performanceTrackingServiceToken);
 * const result = perfService.track(() => expensiveOperation());
 * ```
 */
export const performanceTrackingServiceToken = createInjectionToken<PerformanceTrackingService>(
  "PerformanceTrackingService"
);

/**
 * Injection token for the RetryService.
 *
 * Provides retry operations with exponential backoff and automatic logging.
 * Automatically injects Logger and MetricsCollector.
 *
 * @example
 * ```typescript
 * const retryService = container.resolve(retryServiceToken);
 * const result = await retryService.retry(
 *   () => fetchData(),
 *   { maxAttempts: 3, operationName: "fetchData" }
 * );
 * ```
 */
export const retryServiceToken = createInjectionToken<RetryService>("RetryService");

/**
 * Injection token for the RenderJournalDirectoryHook.
 *
 * Hook that triggers when journal directory is rendered.
 * Registered via DI to enable proper dependency injection.
 *
 * @example
 * ```typescript
 * const hook = container.resolve(renderJournalDirectoryHookToken);
 * ```
 */
export const renderJournalDirectoryHookToken = createInjectionToken<RenderJournalDirectoryHook>(
  "RenderJournalDirectoryHook"
);

/**
 * Injection token for the JournalCacheInvalidationHook.
 *
 * Hook that invalidates journal cache when entries are updated.
 * Registered via DI to enable proper dependency injection.
 */
export const journalCacheInvalidationHookToken = createInjectionToken<JournalCacheInvalidationHook>(
  "JournalCacheInvalidationHook"
);

/**
 * Injection token for the ModuleApiInitializer.
 *
 * Initializes and exposes the public module API to external consumers.
 * Manages API-safe tokens and provides health status.
 */
export const moduleApiInitializerToken =
  createInjectionToken<ModuleApiInitializer>("ModuleApiInitializer");
