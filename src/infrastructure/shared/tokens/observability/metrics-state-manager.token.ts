/**
 * Injection token for the MetricsStateManager service.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { IMetricsStateManager } from "@/infrastructure/observability/interfaces/metrics-state-manager.interface";

/**
 * Injection token for the MetricsStateManager service.
 *
 * Provides state change management for metrics with observer pattern.
 *
 * @example
 * ```typescript
 * const stateManager = container.resolve(metricsStateManagerToken);
 * stateManager.onStateChanged(() => console.log("State changed"));
 * stateManager.notifyStateChanged();
 * ```
 */
export const metricsStateManagerToken =
  createInjectionToken<IMetricsStateManager>("MetricsStateManager");
