import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { CacheService } from "./cache.interface";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service.token";

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
 * - Observer Pattern: Uses CacheConfigObserver to notify about config changes
 */
export class CacheConfigSync {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly cache: CacheService
  ) {}

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
    // CacheService extends CacheConfigObserver, so we can use it directly
    const observer = this.cache;

    unsubscribers.push(
      this.runtimeConfig.onChange("enableCacheService", (enabled) => {
        configManager.updateConfig({ enabled });
        observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        configManager.updateConfig({ defaultTtlMs: ttl });
        observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheMaxEntries", (maxEntries) => {
        configManager.updateConfig({
          maxEntries: typeof maxEntries === "number" && maxEntries > 0 ? maxEntries : undefined,
        });
        observer.onConfigUpdated(configManager.getConfig());
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
