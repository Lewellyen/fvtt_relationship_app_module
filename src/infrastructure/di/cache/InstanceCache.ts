import type { InjectionToken } from "../types/core/injectiontoken";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { castCachedServiceInstance } from "../types/utilities/runtime-safe-cast";

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
  private instances = new Map<InjectionToken<unknown>, unknown>();
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
   * @template Tunknown - The type of service to retrieve
   * @param token - The injection token identifying the service
   * @returns The cached instance or undefined if not found
   */
  get<T>(token: InjectionToken<T>): T | undefined {
    const hasInstance = this.instances.has(token);
    // Track cache access for observability (hit = instance found, miss = not found)
    this.metricsCollector?.recordCacheAccess(hasInstance);
    return castCachedServiceInstance<T>(this.instances.get(token));
  }

  /**
   * Stores a service instance in the cache.
   *
   * @template Tunknown - The type of service to store
   * @param token - The injection token identifying the service
   * @param instance - The service instance to cache
   */
  set<T>(token: InjectionToken<T>, instance: T): void {
    this.instances.set(token, instance);
  }

  /**
   * Checks if a service instance is cached.
   *
   * @template Tunknown - The type of service to check
   * @param token - The injection token identifying the service
   * @returns True if the instance is cached, false otherwise
   */
  has<T>(token: InjectionToken<T>): boolean {
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
  getAllInstances(): Map<InjectionToken<unknown>, unknown> {
    return new Map(this.instances);
  }
}
