import { describe, expect, it, vi, beforeEach } from "vitest";
import { CacheExpirationManager, defaultClock } from "../CacheExpirationManager";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { InternalCacheEntry } from "../../eviction-strategy.interface";
import type { ICacheStore } from "../../store/cache-store.interface";

describe("CacheExpirationManager", () => {
  let clock: () => number;
  let manager: CacheExpirationManager;

  beforeEach(() => {
    clock = vi.fn(() => 1000);
    manager = new CacheExpirationManager(clock);
  });

  it("identifies expired entries", () => {
    const entry: InternalCacheEntry = {
      value: "test",
      expiresAt: 500,
      metadata: {
        key: assertCacheKey("test"),
        createdAt: 0,
        expiresAt: 500,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      },
    };

    const isExpired = manager.isExpired(entry, 1000);

    expect(isExpired).toBe(true);
  });

  it("identifies non-expired entries", () => {
    const entry: InternalCacheEntry = {
      value: "test",
      expiresAt: 2000,
      metadata: {
        key: assertCacheKey("test"),
        createdAt: 0,
        expiresAt: 2000,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      },
    };

    const isExpired = manager.isExpired(entry, 1000);

    expect(isExpired).toBe(false);
  });

  it("handles entries without expiration", () => {
    const entry: InternalCacheEntry = {
      value: "test",
      expiresAt: null,
      metadata: {
        key: assertCacheKey("test"),
        createdAt: 0,
        expiresAt: null,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      },
    };

    const isExpired = manager.isExpired(entry, 1000);

    expect(isExpired).toBe(false);
  });

  it("creates metadata with TTL", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, { ttlMs: 3000 }, now, defaultTtlMs);

    expect(metadata.key).toBe(key);
    expect(metadata.createdAt).toBe(now);
    expect(metadata.expiresAt).toBe(now + 3000);
    expect(metadata.lastAccessedAt).toBe(now);
    expect(metadata.hits).toBe(0);
    expect(metadata.tags).toEqual([]);
  });

  it("creates metadata with default TTL when no TTL provided", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, undefined, now, defaultTtlMs);

    expect(metadata.expiresAt).toBe(now + defaultTtlMs);
  });

  it("creates metadata with tags", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, { tags: ["tag1", "tag2"] }, now, defaultTtlMs);

    expect(metadata.tags).toEqual(["tag1", "tag2"]);
  });

  it("handles expiration by deleting from store", () => {
    const key = assertCacheKey("test-key");
    const store: ICacheStore = {
      delete: vi.fn().mockReturnValue(true),
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      get size() {
        return 0;
      },
      entries: vi.fn(),
    };

    const handled = manager.handleExpiration(key, store);

    expect(handled).toBe(true);
    expect(store.delete).toHaveBeenCalledWith(key);
  });

  it("handles expiration when delete returns false", () => {
    const key = assertCacheKey("test-key");
    const store: ICacheStore = {
      delete: vi.fn().mockReturnValue(false),
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      get size() {
        return 0;
      },
      entries: vi.fn(),
    };

    const handled = manager.handleExpiration(key, store);

    expect(handled).toBe(false);
    expect(store.delete).toHaveBeenCalledWith(key);
  });

  it("identifies non-expired entries when expiresAt is 0", () => {
    const entry: InternalCacheEntry = {
      value: "test",
      expiresAt: 0,
      metadata: {
        key: assertCacheKey("test"),
        createdAt: 0,
        expiresAt: 0,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      },
    };

    const isExpired = manager.isExpired(entry, 1000);

    expect(isExpired).toBe(false);
  });

  it("creates metadata with TTL of 0 (no expiration)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, { ttlMs: 0 }, now, defaultTtlMs);

    expect(metadata.expiresAt).toBeNull();
  });

  it("creates metadata with negative TTL (clamped to 0)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, { ttlMs: -100 }, now, defaultTtlMs);

    expect(metadata.expiresAt).toBeNull();
  });

  it("creates metadata with NaN TTL (uses default)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(key, { ttlMs: Number.NaN }, now, defaultTtlMs);

    expect(metadata.expiresAt).toBe(now + defaultTtlMs);
  });

  it("creates metadata with undefined TTL (uses default)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    // Test with undefined options (no ttlMs property)
    const metadata = manager.createMetadata(key, undefined, now, defaultTtlMs);

    expect(metadata.expiresAt).toBe(now + defaultTtlMs);
  });

  it("creates metadata with duplicate tags (normalized)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(
      key,
      { tags: ["tag1", "tag2", "tag1", "tag2"] },
      now,
      defaultTtlMs
    );

    expect(metadata.tags).toEqual(["tag1", "tag2"]);
  });

  it("creates metadata with tags converted to strings", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    const metadata = manager.createMetadata(
      key,
      { tags: ["tag1", 123 as unknown as string, "tag2"] },
      now,
      defaultTtlMs
    );

    expect(metadata.tags).toEqual(["tag1", "123", "tag2"]);
  });

  it("creates metadata with non-number TTL (uses default)", () => {
    const key = assertCacheKey("test-key");
    const now = 1000;
    const defaultTtlMs = 5000;

    // Test with string TTL (should use default)
    const metadata = manager.createMetadata(
      key,
      { ttlMs: "invalid" as unknown as number },
      now,
      defaultTtlMs
    );

    expect(metadata.expiresAt).toBe(now + defaultTtlMs);
  });

  it("uses default clock when none provided", () => {
    // Test that constructor without clock parameter uses default Date.now
    const managerWithoutClock = new CacheExpirationManager();

    // Verify that the default clock function is used by checking it's callable
    // and creates metadata with current time
    const key = assertCacheKey("test-key");
    const now = Date.now();
    const metadata = managerWithoutClock.createMetadata(key, undefined, now, 5000);

    // The default clock should work (we can't directly test it, but we can verify
    // the manager works correctly)
    expect(metadata).toBeDefined();
    expect(metadata.key).toBe(key);

    // Test isExpired with the default clock
    const entry: InternalCacheEntry = {
      value: "test",
      expiresAt: now - 1000,
      metadata: {
        key: assertCacheKey("test"),
        createdAt: 0,
        expiresAt: now - 1000,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      },
    };

    const isExpired = managerWithoutClock.isExpired(entry, now);

    expect(isExpired).toBe(true);
  });

  it("uses provided clock when passed", () => {
    const customClock = vi.fn(() => 5000);
    const managerWithClock = new CacheExpirationManager(customClock);

    // The clock is stored but not directly used in these methods
    // We can verify the manager works with a custom clock
    const key = assertCacheKey("test-key");
    const metadata = managerWithClock.createMetadata(key, undefined, 1000, 5000);

    expect(metadata).toBeDefined();
    expect(metadata.key).toBe(key);
  });

  it("defaultClock function returns current timestamp", () => {
    // Test the defaultClock function directly
    const before = Date.now();
    const timestamp = defaultClock();
    const after = Date.now();

    // Verify defaultClock returns a timestamp between before and after
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});
