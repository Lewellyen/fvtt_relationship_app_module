/**
 * Injection token for the PerformanceTrackingService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";

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
