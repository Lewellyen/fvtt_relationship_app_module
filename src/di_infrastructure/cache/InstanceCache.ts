import type { InjectionToken } from "../types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { castCachedServiceInstance } from "../types/runtime-safe-cast";

/**
 * Cache for service instances (Singleton and Scoped lifecycles).
 *
 * Responsibilities:
 * - Store and retrieve service instances by token
 * - Provide access to all instances for disposal
 * - Simple get/set/has/clear operations
 * - Track cache hits/misses for observability (when MetricsCollector is injected)
 *
 * Note: This class does NOT handle disposal logic - that's ScopeManager's responsibility.
 */
export class InstanceCache {
  private instances = new Map<InjectionToken<ServiceType>, ServiceType>();
  private metricsCollector: MetricsCollector | null = null;

  /**
   * Injects the MetricsCollector for cache hit/miss tracking.
   * Called after container validation to enable observability.
   *
   * @param collector - The metrics collector instance
   */
  setMetricsCollector(collector: MetricsCollector): void {
    this.metricsCollector = collector;
  }

  /**
   * Retrieves a cached service instance.
   *
   * @template TServiceType - The type of service to retrieve
   * @param token - The injection token identifying the service
   * @returns The cached instance or undefined if not found
   */
  get<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>
  ): TServiceType | undefined {
    const hasInstance = this.instances.has(token);
    // Track cache access for observability (hit = instance found, miss = not found)
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return castCachedServiceInstance<TServiceType>(this.instances.get(token));
  }

  /**
   * Stores a service instance in the cache.
   *
   * @template TServiceType - The type of service to store
   * @param token - The injection token identifying the service
   * @param instance - The service instance to cache
   */
  set<TServiceType extends ServiceType>(
    token: InjectionToken<TServiceType>,
    instance: TServiceType
  ): void {
    this.instances.set(token, instance);
  }

  /**
   * Checks if a service instance is cached.
   *
   * @template TServiceType - The type of service to check
   * @param token - The injection token identifying the service
   * @returns True if the instance is cached, false otherwise
   */
  has<TServiceType extends ServiceType>(token: InjectionToken<TServiceType>): boolean {
    const hasInstance = this.instances.has(token);
    // Track cache access for observability (hit = instance found, miss = not found)
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return hasInstance;
  }

  /**
   * Clears all cached instances.
   * Note: Does not dispose instances - call getAllInstances() first if disposal is needed.
   */
  clear(): void {
    this.instances.clear();
  }

  /**
   * Returns all cached instances for disposal purposes.
   * Used by ScopeManager to dispose Disposable services.
   *
   * @returns A map of all cached instances
   */
  getAllInstances(): Map<InjectionToken<ServiceType>, ServiceType> {
    return new Map(this.instances);
  }
}
