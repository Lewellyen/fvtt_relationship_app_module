import type { CacheServiceConfig } from "../cache-config.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { CacheMetricsObserver } from "../cache-metrics-observer.interface";
import { CacheStore } from "../store/CacheStore";
import { CacheExpirationManager } from "../expiration/CacheExpirationManager";
import { CacheStatisticsCollector } from "../statistics/CacheStatisticsCollector";
import { CacheConfigManager } from "../config/CacheConfigManager";
import { CacheCapacityManager } from "../cache-capacity-manager";
import { LRUEvictionStrategy } from "../lru-eviction-strategy";
import { EvictionStrategyRegistry } from "../eviction-strategy-registry";
import { CacheMetricsCollector } from "../cache-metrics-collector";
import { CacheRuntime } from "../runtime/CacheRuntime";
import { CachePolicy } from "../policy/CachePolicy";
import { CacheTelemetry } from "../telemetry/CacheTelemetry";
import type { ICacheStore } from "../store/cache-store.interface";
import type { ICacheExpirationManager } from "../expiration/cache-expiration-manager.interface";
import type { ICacheStatisticsCollector } from "../statistics/cache-statistics-collector.interface";
import type { ICacheConfigManager } from "../config/cache-config-manager.interface";
import type { CacheRuntime as ICacheRuntime } from "../runtime/cache-runtime.interface";
import type { CachePolicy as ICachePolicy } from "../policy/cache-policy.interface";
import type { CacheTelemetry as ICacheTelemetry } from "../telemetry/cache-telemetry.interface";

/**
 * Composition of cache components.
 * Contains all components needed by CacheService.
 */
export interface CacheComposition {
  runtime: ICacheRuntime;
  policy: ICachePolicy;
  telemetry: ICacheTelemetry;
  store: ICacheStore;
  configManager: ICacheConfigManager;
  expirationManager: ICacheExpirationManager;
}

/**
 * Factory for creating cache component compositions.
 * Separates component creation from CacheService to follow SRP.
 *
 * **Responsibilities:**
 * - Creates and wires all cache subcomponents
 * - Handles dependency resolution (capacity manager, metrics observer, etc.)
 * - Provides testable composition logic
 *
 * **Design Benefits:**
 * - Single Responsibility: Only handles composition
 * - Testable: Can be mocked or replaced
 * - Maintainable: Clear separation of concerns
 */
export class CacheCompositionFactory {
  /**
   * Creates a complete cache composition from configuration.
   *
   * @param config - Cache service configuration
   * @param metricsCollector - Optional metrics collector
   * @param clock - Clock function (defaults to Date.now)
   * @param capacityManager - Optional capacity manager (created if not provided)
   * @param metricsObserver - Optional metrics observer (created if not provided)
   * @param store - Optional store (created if not provided)
   * @param expirationManager - Optional expiration manager (created if not provided)
   * @param statisticsCollector - Optional statistics collector (created if not provided)
   * @param configManager - Optional config manager (created if not provided)
   * @param runtime - Optional runtime (created if not provided)
   * @param policy - Optional policy (created if not provided)
   * @param telemetry - Optional telemetry (created if not provided)
   * @returns Complete cache composition
   */
  create(
    config: CacheServiceConfig,
    metricsCollector?: MetricsCollector,
    clock: () => number = () => Date.now(),
    capacityManager?: CacheCapacityManager,
    metricsObserver?: CacheMetricsObserver,
    store?: ICacheStore,
    expirationManager?: ICacheExpirationManager,
    statisticsCollector?: ICacheStatisticsCollector,
    configManager?: ICacheConfigManager,
    runtime?: ICacheRuntime,
    policy?: ICachePolicy,
    telemetry?: ICacheTelemetry
  ): CacheComposition {
    // Initialize core dependencies
    const resolvedStore = store ?? new CacheStore();
    const resolvedConfigManager = configManager ?? new CacheConfigManager(config);
    const resolvedExpirationManager = expirationManager ?? new CacheExpirationManager(clock);

    // Initialize capacity manager if not provided
    let resolvedCapacityManager = capacityManager;
    if (!resolvedCapacityManager) {
      const registry = EvictionStrategyRegistry.getInstance();
      // Ensure default LRU strategy is registered
      if (!registry.has("lru")) {
        registry.register("lru", new LRUEvictionStrategy());
      }
      // Get strategy from registry (defaults to "lru" if not specified)
      const strategyKey = config.evictionStrategyKey ?? "lru";
      const strategy = registry.getOrDefault(strategyKey, "lru");
      if (!strategy) {
        // Fallback to LRU if strategy not found (should not happen if "lru" is registered)
        resolvedCapacityManager = new CacheCapacityManager(
          new LRUEvictionStrategy(),
          resolvedStore
        );
      } else {
        resolvedCapacityManager = new CacheCapacityManager(strategy, resolvedStore);
      }
    }

    // Initialize statistics collector
    const resolvedMetricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
    const resolvedStatisticsCollector =
      statisticsCollector ?? new CacheStatisticsCollector(resolvedMetricsObserver);

    // Initialize specialized components
    const resolvedTelemetry = telemetry ?? new CacheTelemetry(resolvedStatisticsCollector);
    const resolvedPolicy = policy ?? new CachePolicy(resolvedCapacityManager);
    const resolvedRuntime =
      runtime ??
      new CacheRuntime(
        resolvedStore,
        resolvedExpirationManager,
        resolvedConfigManager,
        resolvedTelemetry,
        resolvedPolicy,
        clock
      );

    return {
      runtime: resolvedRuntime,
      policy: resolvedPolicy,
      telemetry: resolvedTelemetry,
      store: resolvedStore,
      configManager: resolvedConfigManager,
      expirationManager: resolvedExpirationManager,
    };
  }
}
