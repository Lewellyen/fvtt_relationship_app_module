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

    unsubscribers.push(
      this.runtimeConfig.onChange("enableCacheService", (enabled) => {
        this.cache.updateConfig({ enabled });
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        this.cache.updateConfig({ defaultTtlMs: ttl });
      })
    );

    unsubscribers.push(
      this.runtimeConfig.onChange("cacheMaxEntries", (maxEntries) => {
        this.cache.updateConfig({
          maxEntries: typeof maxEntries === "number" && maxEntries > 0 ? maxEntries : undefined,
        });
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
