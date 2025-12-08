import { describe, it, expect, vi, beforeEach } from "vitest";
import { CacheConfigSync } from "../CacheConfigSync";
import { CacheService } from "../CacheService";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { DEFAULT_CACHE_SERVICE_CONFIG } from "../CacheService";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";

describe("CacheConfigSync", () => {
  let runtimeConfig: PlatformRuntimeConfigPort;
  let cache: CacheService;
  let configSync: CacheConfigSync;

  beforeEach(() => {
    runtimeConfig = createMockRuntimeConfig();
    cache = new CacheService(DEFAULT_CACHE_SERVICE_CONFIG);
    configSync = new CacheConfigSync(runtimeConfig, cache);
  });

  it("binds enableCacheService changes to cache", () => {
    runtimeConfig.onChange = vi.fn().mockReturnValue(() => {});

    configSync.bind();

    expect(runtimeConfig.onChange).toHaveBeenCalledWith("enableCacheService", expect.any(Function));
    const mockOnChange = runtimeConfig.onChange as ReturnType<typeof vi.fn>;
    const callback = mockOnChange.mock.calls[0]?.[1];
    expect(callback).toBeDefined();

    expect(cache.isEnabled).toBe(true);
    callback?.(false);
    expect(cache.isEnabled).toBe(false);
    callback?.(true);
    expect(cache.isEnabled).toBe(true);
  });

  it("binds cacheDefaultTtlMs changes to cache", () => {
    runtimeConfig.onChange = vi.fn().mockReturnValue(() => {});

    configSync.bind();

    expect(runtimeConfig.onChange).toHaveBeenCalledWith("cacheDefaultTtlMs", expect.any(Function));
    const mockOnChange = runtimeConfig.onChange as ReturnType<typeof vi.fn>;
    const callback = mockOnChange.mock.calls[1]?.[1];
    expect(callback).toBeDefined();

    callback?.(1000);
    expect(cache.getStatistics().enabled).toBe(true);
  });

  it("binds cacheMaxEntries changes to cache", () => {
    runtimeConfig.onChange = vi.fn().mockReturnValue(() => {});

    configSync.bind();

    expect(runtimeConfig.onChange).toHaveBeenCalledWith("cacheMaxEntries", expect.any(Function));
    const mockOnChange = runtimeConfig.onChange as ReturnType<typeof vi.fn>;
    const callback = mockOnChange.mock.calls[2]?.[1];
    expect(callback).toBeDefined();

    callback?.(5);
    // Verify maxEntries is set by checking capacity enforcement
    cache.set(assertCacheKey("test-key-1"), "value1");
    cache.set(assertCacheKey("test-key-2"), "value2");
    cache.set(assertCacheKey("test-key-3"), "value3");
    cache.set(assertCacheKey("test-key-4"), "value4");
    cache.set(assertCacheKey("test-key-5"), "value5");
    cache.set(assertCacheKey("test-key-6"), "value6"); // Should trigger eviction

    // Cache should enforce maxEntries limit
    expect(cache.size).toBeLessThanOrEqual(5);
  });

  it("handles invalid cacheMaxEntries values", () => {
    runtimeConfig.onChange = vi.fn().mockReturnValue(() => {});

    configSync.bind();

    const mockOnChange = runtimeConfig.onChange as ReturnType<typeof vi.fn>;
    const callback = mockOnChange.mock.calls[2]?.[1];
    expect(callback).toBeDefined();

    // Invalid values should be ignored
    callback?.(0);
    callback?.(-1);
    callback?.(NaN);
    // Cache should still work
    expect(cache.isEnabled).toBe(true);
  });

  it("returns unsubscribe function from bind", () => {
    const unsubscribers: Array<() => void> = [];
    runtimeConfig.onChange = vi.fn().mockImplementation(() => {
      const unsub = vi.fn();
      unsubscribers.push(unsub);
      return unsub;
    });

    const unsubscribe = configSync.bind();

    expect(typeof unsubscribe).toBe("function");
    expect(unsubscribers.length).toBe(3);

    unsubscribe();

    // All unsubscribers should have been called
    for (const unsub of unsubscribers) {
      expect(unsub).toHaveBeenCalled();
    }
  });

  it("unbinds all subscriptions when unbind is called", () => {
    const unsubscribers: Array<() => void> = [];
    runtimeConfig.onChange = vi.fn().mockImplementation(() => {
      const unsub = vi.fn();
      unsubscribers.push(unsub);
      return unsub;
    });

    configSync.bind();
    configSync.unbind();

    // All unsubscribers should have been called
    for (const unsub of unsubscribers) {
      expect(unsub).toHaveBeenCalled();
    }
  });

  it("replaces existing binding when bind is called multiple times", () => {
    const unsubscribers: Array<() => void> = [];
    runtimeConfig.onChange = vi.fn().mockImplementation(() => {
      const unsub = vi.fn();
      unsubscribers.push(unsub);
      return unsub;
    });

    configSync.bind();
    const firstUnsubscribe = unsubscribers.length;

    configSync.bind();
    const secondUnsubscribe = unsubscribers.length;

    // Should have created new subscriptions
    expect(secondUnsubscribe).toBeGreaterThan(firstUnsubscribe);
    // Previous unsubscribers should have been called
    expect(unsubscribers[0]).toHaveBeenCalled();
  });
});

function createMockRuntimeConfig(): PlatformRuntimeConfigPort {
  const listeners = new Map<string, Set<(value: unknown) => void>>();

  return {
    get: vi.fn().mockReturnValue(undefined),
    setFromPlatform: vi.fn(),
    onChange: vi.fn().mockImplementation((key: string, callback: (value: unknown) => void) => {
      if (!listeners.has(key)) {
        listeners.set(key, new Set());
      }
      listeners.get(key)!.add(callback);

      return () => {
        listeners.get(key)?.delete(callback);
      };
    }),
  } as unknown as PlatformRuntimeConfigPort;
}
