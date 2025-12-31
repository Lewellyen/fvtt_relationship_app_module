import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { CacheConfigSyncObserver } from "./config/CacheConfigSyncObserver";
import type { CacheMaintenancePort } from "./cache.interface";

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
 * - Interface Segregation: Depends only on CacheMaintenancePort, not full CacheService
 */
export class CacheConfigSync {
  private unsubscribe: (() => void) | null = null;
  private readonly observer: CacheConfigSyncObserver;

  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly cacheMaintenance: CacheMaintenancePort
  ) {
    // Create observer with components from maintenance port
    this.observer = new CacheConfigSyncObserver(
      cacheMaintenance.getStore(),
      cacheMaintenance.getPolicy(),
      cacheMaintenance.getConfigManager()
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

    unsubscribers.push(
      this.runtimeConfig.onChange("enableCacheService", (enabled) => {
        const configManager = this.cacheMaintenance.getConfigManager();
        configManager.updateConfig({ enabled });
        this.observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        const configManager = this.cacheMaintenance.getConfigManager();
        configManager.updateConfig({ defaultTtlMs: ttl });
        this.observer.onConfigUpdated(configManager.getConfig());
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheMaxEntries", (maxEntries) => {
        const configManager = this.cacheMaintenance.getConfigManager();
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
 * Note: This will be created via factory in DI registration.
 * The actual dependency (CacheMaintenancePort) is resolved from CacheService.
 */
export class DICacheConfigSync extends CacheConfigSync {
  static dependencies = [runtimeConfigToken] as const;

  constructor(runtimeConfig: PlatformRuntimeConfigPort, cacheMaintenance: CacheMaintenancePort) {
    super(runtimeConfig, cacheMaintenance);
  }
}
