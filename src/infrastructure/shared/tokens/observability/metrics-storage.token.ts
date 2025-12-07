/**
 * Injection token for metrics persistence storage.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";

/**
 * Injection token for metrics persistence storage.
 */
export const metricsStorageToken = createInjectionToken<MetricsStorage>("MetricsStorage");
