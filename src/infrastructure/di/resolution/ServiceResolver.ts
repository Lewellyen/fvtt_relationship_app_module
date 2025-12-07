import type { Result } from "@/domain/types/result";
import type { InjectionToken } from "../types/core/injectiontoken";
import type { ContainerError } from "../interfaces";
import type { ServiceRegistry } from "../registry/ServiceRegistry";
import type { ServiceRegistration } from "../types/core/serviceregistration";
import { InstanceCache } from "../cache/InstanceCache";
import { err } from "@/domain/utils/result";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { PerformanceTracker } from "@/infrastructure/observability/performance-tracker.interface";
import { LifecycleResolver } from "./lifecycle-resolver";
import { ServiceInstantiatorImpl } from "./service-instantiator";
import type { DependencyResolver } from "./dependency-resolver.interface";
import type { ServiceInstantiator } from "./service-instantiation.interface";

/**
 * Resolves service instances based on lifecycle and registration.
 *
 * Responsibilities:
 * - Resolve services by token
 * - Handle alias resolution
 * - Delegate lifecycle resolution to LifecycleResolver
 * - Delegate service instantiation to ServiceInstantiator
 *
 * Design:
 * - Works with Result pattern (no throws)
 * - Wraps factory errors in FactoryFailedError
 * - Parent resolver for Singleton sharing across scopes
 * - PerformanceTracker injected via constructor (avoids circular dependency)
 * - MetricsCollector injected after container validation for metrics recording
 * - Lifecycle-specific resolution delegated to LifecycleResolver (SRP)
 * - Service instantiation delegated to ServiceInstantiator (SRP)
 * - Implements DependencyResolver and ServiceInstantiator interfaces to break circular dependencies
 */
export class ServiceResolver implements DependencyResolver, ServiceInstantiator {
  private metricsCollector: MetricsCollector | null = null;
  private readonly lifecycleResolver: LifecycleResolver;
  private readonly instantiator: ServiceInstantiatorImpl;

  constructor(
    private readonly registry: ServiceRegistry,
    private readonly cache: InstanceCache,
    private readonly parentResolver: ServiceResolver | null,
    private readonly scopeName: string,
    private readonly performanceTracker: PerformanceTracker
  ) {
    // Pass parentResolver as DependencyResolver to break circular dependency
    this.lifecycleResolver = new LifecycleResolver(
      cache,
      parentResolver,
      scopeName
    );
    // Pass this as DependencyResolver to break circular dependency
    this.instantiator = new ServiceInstantiatorImpl(this);
  }

  /**
   * Sets the MetricsCollector for metrics recording.
   * Called by ServiceContainer after validation.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
  }

  /**
   * Resolves a service by token.
   *
   * Handles:
   * - Alias resolution (recursive)
   * - Lifecycle-specific resolution (delegated to LifecycleResolver)
   * - Performance tracking
   * - Metrics recording
   *
   * Performance tracking is handled by the injected PerformanceTracker.
   *
   * @template T - The type of service to resolve
   * @param token - The injection token identifying the service
   * @returns Result with service instance or error
   */
  resolve<T>(token: InjectionToken<T>): Result<T, ContainerError> {
    return this.performanceTracker.track(
      () => {
        // Check if service is registered
        const registration = this.registry.getRegistration(token);
        if (!registration) {
          const stack = new Error().stack;
          const error: ContainerError = {
            code: "TokenNotRegistered",
            message: `Service ${String(token)} not registered`,
            tokenDescription: String(token),
            ...(stack !== undefined && { stack }), // Only include stack if defined
            timestamp: Date.now(),
            containerScope: this.scopeName,
          };
          return err(error);
        }

        // Handle alias resolution
        if (registration.providerType === "alias" && registration.aliasTarget) {
          return this.resolve(registration.aliasTarget);
        }

        // Delegate to LifecycleResolver
        return this.lifecycleResolver.resolve(token, registration, this, this);
      },
      (duration, result) => {
        this.metricsCollector?.recordResolution(token, duration, result.ok);
      }
    );
  }

  /**
   * Instantiates a service based on registration type.
   *
   * CRITICAL: Returns Result to preserve error context and avoid breaking Result-Contract.
   * Delegates to ServiceInstantiatorImpl for actual instantiation logic.
   *
   * This method implements the ServiceInstantiator interface, allowing lifecycle
   * strategies to instantiate services without depending on ServiceResolver directly.
   *
   * @template T - The type of service to instantiate
   * @param token - The injection token (used for error messages)
   * @param registration - The service registration metadata
   * @returns Result with instance or detailed error (DependencyResolveFailed, FactoryFailed, etc.)
   */
  instantiate<T>(
    token: InjectionToken<T>,
    registration: ServiceRegistration<T>
  ): Result<T, ContainerError> {
    return this.instantiator.instantiate(token, registration);
  }
}
