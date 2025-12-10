import { describe, expect, it } from "vitest";
import { CacheConfigManager } from "../CacheConfigManager";
import { DEFAULT_CACHE_SERVICE_CONFIG } from "../../CacheService";
import type { CacheServiceConfig } from "../../cache.interface";

describe("CacheConfigManager", () => {
  it("initializes with default config", () => {
    const manager = new CacheConfigManager();

    const config = manager.getConfig();

    expect(config.enabled).toBe(DEFAULT_CACHE_SERVICE_CONFIG.enabled);
    expect(config.defaultTtlMs).toBe(DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs);
  });

  it("initializes with provided config", () => {
    const config: CacheServiceConfig = {
      enabled: false,
      defaultTtlMs: 10000,
      namespace: "test",
      maxEntries: 100,
    };

    const manager = new CacheConfigManager(config);

    const retrieved = manager.getConfig();

    expect(retrieved.enabled).toBe(false);
    expect(retrieved.defaultTtlMs).toBe(10000);
    expect(retrieved.namespace).toBe("test");
    expect(retrieved.maxEntries).toBe(100);
  });

  it("updates config partially", () => {
    const manager = new CacheConfigManager({
      enabled: true,
      defaultTtlMs: 5000,
    });

    manager.updateConfig({ enabled: false });

    const config = manager.getConfig();

    expect(config.enabled).toBe(false);
    expect(config.defaultTtlMs).toBe(5000); // Unchanged
  });

  it("checks if cache is enabled", () => {
    const manager = new CacheConfigManager({ enabled: true, defaultTtlMs: 5000 });

    expect(manager.isEnabled()).toBe(true);

    manager.updateConfig({ enabled: false });

    expect(manager.isEnabled()).toBe(false);
  });

  it("clamps negative TTL to 0", () => {
    const manager = new CacheConfigManager({
      enabled: true,
      defaultTtlMs: 5000,
    });

    manager.updateConfig({ defaultTtlMs: -100 });

    const config = manager.getConfig();

    expect(config.defaultTtlMs).toBe(0);
  });

  it("handles NaN TTL", () => {
    const manager = new CacheConfigManager({
      enabled: true,
      defaultTtlMs: 5000,
    });

    manager.updateConfig({ defaultTtlMs: Number.NaN });

    const config = manager.getConfig();

    expect(config.defaultTtlMs).toBe(DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs);
  });
});
