import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { CacheService } from "./cache.interface";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service.token";
import { CacheConfigSyncObserver } from "./config/CacheConfigSyncObserver";

/**
 * Handles synchronization between RuntimeConfig and CacheService.
 * Separated from CacheService to follow Single Responsibility Principle.
 *
 * **Responsibilities:**
 * - Bind RuntimeConfig changes to CacheService config updates
 * - Manage subscription lifecycle
 *
 * **Design Benefits:**
 * - Single Responsibility: Only handles RuntimeConfig synchronization
 * - Reusable: Can be extended for additional config sources
 * - Testable: Isolated from CacheService implementation
 * - Observer Pattern: Uses CacheConfigSyncObserver to notify about config changes
 */
export class CacheConfigSync {
  private unsubscribe: (() => void) | null = null;
  private readonly observer: CacheConfigSyncObserver;

  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly cache: CacheService
  ) {
    // Create observer with necessary components from CacheService
    this.observer = new CacheConfigSyncObserver(
      cache.getStore(),
      cache.getPolicy(),
      cache.getConfigManager()
    );
  }

  /**
   * Binds RuntimeConfig changes to CacheService.
   * Returns unsubscribe function for cleanup.
   *
   * @returns Unsubscribe function to clean up all subscriptions
   */
  bind(): () => void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const unsubscribers: Array<() => void> = [];
    const configManager = this.cache.getConfigManager();

    unsubscribers.push(
      this.runtimeConfig.onChange("enableCacheService", (enabled) => {
        configManager.updateConfig({ enabled });
        this.observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        configManager.updateConfig({ defaultTtlMs: ttl });
        this.observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheMaxEntries", (maxEntries) => {
        configManager.updateConfig({
          maxEntries: typeof maxEntries === "number" && maxEntries > 0 ? maxEntries : undefined,
        });
        this.observer.onConfigUpdated(configManager.getConfig());
      })
    );

    this.unsubscribe = () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      this.unsubscribe = null;
    };

    return this.unsubscribe;
  }

  /**
   * Unbinds RuntimeConfig synchronization.
   */
  unbind(): void {
    this.unsubscribe?.();
  }
}

/**
 * DI wrapper for CacheConfigSync.
 */
export class DICacheConfigSync extends CacheConfigSync {
  static dependencies = [runtimeConfigToken, cacheServiceToken] as const;

  constructor(runtimeConfig: PlatformRuntimeConfigPort, cache: CacheService) {
    super(runtimeConfig, cache);
  }
}
