import type { CacheServiceConfig } from "../cache.interface";
import type { CacheConfigObserver } from "../cache-config-observer.interface";
import type { ICacheStore } from "../store/cache-store.interface";
import type { CachePolicy } from "../policy/cache-policy.interface";
import type { ICacheConfigManager } from "./cache-config-manager.interface";

/**
 * Observer for cache configuration updates.
 * Handles cache clearing and capacity enforcement when config changes.
 *
 * **Single Responsibility:**
 * - Reacts to configuration changes
 * - Clears cache when disabled
 * - Enforces capacity when maxEntries changes
 *
 * **Design Benefits:**
 * - Separated from CacheService
 * - Can be used by CacheConfigSync
 * - Testable in isolation
 */
export class CacheConfigSyncObserver implements CacheConfigObserver {
  constructor(
    private readonly store: ICacheStore,
    private readonly policy: CachePolicy,
    private readonly configManager: ICacheConfigManager
  ) {}

  /**
   * Called when cache configuration is updated.
   * Implements CacheConfigObserver to react to configuration changes.
   *
   * @param config - The updated cache configuration
   */
  onConfigUpdated(config: CacheServiceConfig): void {
    if (!config.enabled) {
      this.clearStore();
      return;
    }

    const currentConfig = this.configManager.getConfig();
    if (typeof config.maxEntries === "number" && config.maxEntries !== currentConfig.maxEntries) {
      this.enforceCapacity(config);
    }
  }

  private clearStore(): void {
    this.store.clear();
  }

  private enforceCapacity(config: CacheServiceConfig): void {
    if (!config.maxEntries) {
      return;
    }
    this.policy.enforceCapacity(this.store.size, config);
  }
}
