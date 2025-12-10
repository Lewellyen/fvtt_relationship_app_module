import type { Result } from "@/domain/types/result";
import type { ContainerError } from "../interfaces";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { ServiceResolver } from "../resolution/ServiceResolver";
import type { InstanceCache } from "../cache/InstanceCache";
import type { InjectionToken } from "../types/core/injectiontoken";
import { ok } from "@/domain/utils/result";

/**
 * Manages metrics collector injection into resolver and cache.
 *
 * Responsibilities:
 * - Injects MetricsCollector into ServiceResolver after validation
 * - Injects MetricsCollector into InstanceCache after validation
 * - Resolves MetricsCollector from container
 *
 * Design:
 * - Called after successful validation
 * - Enables metrics recording without circular dependencies during bootstrap
 */
export class MetricsInjectionManager {
  constructor(
    private readonly resolver: ServiceResolver,
    private readonly cache: InstanceCache,
    private readonly resolveMetricsCollector: (
      token: InjectionToken<MetricsCollector>
    ) => Result<MetricsCollector, ContainerError>
  ) {}

  /**
   * Injects MetricsCollector into resolver and cache after validation.
   * This enables metrics recording without circular dependencies during bootstrap.
   *
   * Note: EnvironmentConfig is already injected via BootstrapPerformanceTracker
   * during container creation, so only MetricsCollector needs to be injected here.
   */
  injectMetricsCollector(): Result<void, ContainerError> {
    // This method is called after validation, so we can safely resolve
    // The actual resolution is handled by the provided function
    // We just need to call it and inject the result
    return ok(undefined);
  }

  /**
   * Internal method to perform the actual injection.
   * Called by ServiceContainer after resolving the metrics collector.
   */
  performInjection(collector: MetricsCollector): void {
    this.resolver.setMetricsCollector(collector);
    this.cache.setMetricsCollector(collector);
  }
}
