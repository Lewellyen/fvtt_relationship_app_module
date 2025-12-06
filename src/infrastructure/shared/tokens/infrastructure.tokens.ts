/**
 * Infrastructure service tokens for caching, performance, and retry.
 *
 * WICHTIG: ModuleApiInitializer Type-Import entfernt, um letzten Zyklus zu beheben!
 * Token-Generics werden beim resolve() aufgelöst.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { CacheService, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import type { RetryService } from "@/infrastructure/retry/RetryService";

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
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 * Dies behebt den letzten Zyklus: infrastructure.tokens ↔ module-api-initializer ↔ ... ↔ FoundryI18nPort
 */
export const moduleApiInitializerToken = createInjectionToken<any>("ModuleApiInitializer");

/**
 * Injection token for the module ID.
 *
 * Provides the module identifier string for Infrastructure services.
 * Registered as a static value in static-values.config.ts to avoid
 * Infrastructure layer depending on Application layer constants.
 */
export const moduleIdToken = createInjectionToken<string>("ModuleId");
