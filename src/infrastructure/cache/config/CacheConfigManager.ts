import type { CacheServiceConfig } from "../cache.interface";
import type { ICacheConfigManager } from "./cache-config-manager.interface";
import { APP_DEFAULTS } from "@/application/constants/app-constants";

const DEFAULT_CACHE_SERVICE_CONFIG: CacheServiceConfig = {
  enabled: true,
  defaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
  namespace: "global",
};

function clampTtl(ttl: number | undefined, fallback: number): number {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback;
  }
  return ttl < 0 ? 0 : ttl;
}

/**
 * Manages cache configuration.
 * Responsible only for configuration management.
 */
export class CacheConfigManager implements ICacheConfigManager {
  private config: CacheServiceConfig;

  constructor(config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG) {
    const resolvedMaxEntries =
      typeof config?.maxEntries === "number" && config.maxEntries > 0
        ? config.maxEntries
        : undefined;

    this.config = {
      ...DEFAULT_CACHE_SERVICE_CONFIG,
      ...config,
      defaultTtlMs: clampTtl(config?.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs),
      ...(resolvedMaxEntries !== undefined ? { maxEntries: resolvedMaxEntries } : {}),
    };
  }

  updateConfig(partial: Partial<CacheServiceConfig>): void {
    const merged: CacheServiceConfig = {
      ...this.config,
      ...partial,
    };

    merged.defaultTtlMs = clampTtl(merged.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs);

    this.config = merged;
  }

  getConfig(): CacheServiceConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}
