/**
 * Infrastructure service tokens for caching, performance, and retry.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { CacheService, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import type { RetryService } from "@/infrastructure/retry/RetryService";
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
 * Injection token for the ModuleApiInitializer.
 *
 * Initializes and exposes the public module API to external consumers.
 * Manages API-safe tokens and provides health status.
 */
export const moduleApiInitializerToken =
  createInjectionToken<ModuleApiInitializer>("ModuleApiInitializer");
