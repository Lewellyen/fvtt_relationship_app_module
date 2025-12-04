import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachePortAdapter, DICachePortAdapter } from "../platform-cache-port-adapter";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type {
  CacheKey,
  CacheSetOptions,
  CacheEntryMetadata,
  CacheLookupResult,
  CacheStatistics,
} from "@/infrastructure/cache/cache.interface";
import type {
  DomainCacheInvalidationPredicate,
  DomainCacheSetOptions,
} from "@/domain/types/cache/cache-types";
import { ok } from "@/domain/utils/result";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";

describe("CachePortAdapter", () => {
  let adapter: CachePortAdapter;
  let mockCacheService: CacheService;

  beforeEach(() => {
    mockCacheService = {
      isEnabled: true,
      size: 5,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn(),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    } as unknown as CacheService;

    adapter = new CachePortAdapter(mockCacheService);
  });

  describe("isEnabled", () => {
    it("should delegate to cacheService.isEnabled", () => {
      expect(adapter.isEnabled).toBe(true);
      expect(mockCacheService.isEnabled).toBe(true);
    });
  });

  describe("size", () => {
    it("should delegate to cacheService.size", () => {
      expect(adapter.size).toBe(5);
      expect(mockCacheService.size).toBe(5);
    });
  });

  describe("get", () => {
    it("should delegate to cacheService.get", () => {
      const key = "test-key" as CacheKey;
      const expectedResult: CacheLookupResult<string> = {
        hit: true,
        value: "test-value",
        metadata: {
          key,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 1,
          tags: [],
        },
      };

      vi.mocked(mockCacheService.get).mockReturnValue(expectedResult);

      const result = adapter.get<string>(key);

      expect(result).toEqual(expectedResult);
      expect(mockCacheService.get).toHaveBeenCalledWith(key);
    });

    it("should handle result with undefined value", () => {
      const key = "test-key" as CacheKey;
      // When value is undefined, we don't include it in the object
      const lookupResult = {
        hit: true,
        metadata: {
          key,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 1,
          tags: [],
        },
      } as CacheLookupResult<string>;

      vi.mocked(mockCacheService.get).mockReturnValue(lookupResult);

      const result = adapter.get<string>(key);

      expect(result).toBeDefined();
      expect(result?.hit).toBe(true);
      expect(result?.value).toBeUndefined();
      expect(result?.metadata).toBeDefined();
      expect(mockCacheService.get).toHaveBeenCalledWith(key);
    });
  });

  describe("set", () => {
    it("should delegate to cacheService.set", () => {
      const key = "test-key" as CacheKey;
      const value = "test-value";
      const options: CacheSetOptions = { ttlMs: 1000, tags: ["test"] };
      const expectedMetadata: CacheEntryMetadata = {
        key,
        createdAt: 0,
        expiresAt: 1000,
        lastAccessedAt: 0,
        hits: 0,
        tags: ["test"],
      };

      vi.mocked(mockCacheService.set).mockReturnValue(expectedMetadata);

      const result = adapter.set(key, value, options);

      expect(result).toEqual(expectedMetadata);
      expect(mockCacheService.set).toHaveBeenCalledWith(key, value, options);
    });

    it("should handle empty options object (both ttlMs and tags undefined)", () => {
      const key = "test-key" as CacheKey;
      const value = "test-value";
      const options: DomainCacheSetOptions = {};
      const expectedMetadata: CacheEntryMetadata = {
        key,
        createdAt: 0,
        expiresAt: null,
        lastAccessedAt: 0,
        hits: 0,
        tags: [],
      };

      vi.mocked(mockCacheService.set).mockReturnValue(expectedMetadata);

      const result = adapter.set(key, value, options);

      expect(result).toEqual(expectedMetadata);
      // When options is empty, it should be mapped to undefined
      expect(mockCacheService.set).toHaveBeenCalledWith(key, value, undefined);
    });
  });

  describe("delete", () => {
    it("should delegate to cacheService.delete", () => {
      const key = "test-key" as CacheKey;

      vi.mocked(mockCacheService.delete).mockReturnValue(true);

      const result = adapter.delete(key);

      expect(result).toBe(true);
      expect(mockCacheService.delete).toHaveBeenCalledWith(key);
    });
  });

  describe("has", () => {
    it("should delegate to cacheService.has", () => {
      const key = "test-key" as CacheKey;

      vi.mocked(mockCacheService.has).mockReturnValue(true);

      const result = adapter.has(key);

      expect(result).toBe(true);
      expect(mockCacheService.has).toHaveBeenCalledWith(key);
    });
  });

  describe("clear", () => {
    it("should delegate to cacheService.clear", () => {
      vi.mocked(mockCacheService.clear).mockReturnValue(3);

      const result = adapter.clear();

      expect(result).toBe(3);
      expect(mockCacheService.clear).toHaveBeenCalled();
    });
  });

  describe("invalidateWhere", () => {
    it("should delegate to cacheService.invalidateWhere with mapped predicate", () => {
      const predicate: DomainCacheInvalidationPredicate = (entry) => entry.tags.includes("test");

      vi.mocked(mockCacheService.invalidateWhere).mockReturnValue(2);

      const result = adapter.invalidateWhere(predicate);

      expect(result).toBe(2);
      // The adapter maps the Domain predicate to Infrastructure predicate
      // So we check that a function was passed (not the exact same reference)
      expect(mockCacheService.invalidateWhere).toHaveBeenCalledWith(expect.any(Function));
      // Verify the mapped predicate works correctly
      const calledPredicate = vi.mocked(mockCacheService.invalidateWhere).mock.calls[0]![0]!;
      const testMetadata: CacheEntryMetadata = {
        key: "test-key" as CacheKey,
        createdAt: 0,
        expiresAt: null,
        lastAccessedAt: 0,
        hits: 0,
        tags: ["test"],
      };
      expect(calledPredicate(testMetadata)).toBe(true);
    });
  });

  describe("getMetadata", () => {
    it("should delegate to cacheService.getMetadata", () => {
      const key = "test-key" as CacheKey;
      const expectedMetadata: CacheEntryMetadata = {
        key,
        createdAt: 0,
        expiresAt: null,
        lastAccessedAt: 0,
        hits: 1,
        tags: [],
      };

      vi.mocked(mockCacheService.getMetadata).mockReturnValue(expectedMetadata);

      const result = adapter.getMetadata(key);

      expect(result).toEqual(expectedMetadata);
      expect(mockCacheService.getMetadata).toHaveBeenCalledWith(key);
    });

    it("should return null when cacheService.getMetadata returns null", () => {
      const key = "test-key" as CacheKey;

      vi.mocked(mockCacheService.getMetadata).mockReturnValue(null);

      const result = adapter.getMetadata(key);

      expect(result).toBeNull();
      expect(mockCacheService.getMetadata).toHaveBeenCalledWith(key);
    });
  });

  describe("getStatistics", () => {
    it("should delegate to cacheService.getStatistics", () => {
      const expectedStats: CacheStatistics = {
        hits: 10,
        misses: 5,
        evictions: 2,
        size: 5,
        enabled: true,
      };

      vi.mocked(mockCacheService.getStatistics).mockReturnValue(expectedStats);

      const result = adapter.getStatistics();

      expect(result).toEqual(expectedStats);
      expect(mockCacheService.getStatistics).toHaveBeenCalled();
    });
  });

  describe("getOrSet", () => {
    it("should delegate to cacheService.getOrSet", async () => {
      const key = "test-key" as CacheKey;
      const factory = vi.fn().mockResolvedValue("factory-value");
      const options: CacheSetOptions = { ttlMs: 1000 };
      const expectedResult: CacheLookupResult<string> = {
        hit: false,
        value: "factory-value",
        metadata: {
          key,
          createdAt: 0,
          expiresAt: 1000,
          lastAccessedAt: 0,
          hits: 0,
          tags: [],
        },
      };

      vi.mocked(mockCacheService.getOrSet).mockResolvedValue(ok(expectedResult));

      const result = await adapter.getOrSet(key, factory, options);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedResult);
      }
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(key, factory, options);
    });

    it("should propagate errors from cacheService.getOrSet", async () => {
      const key = "test-key" as CacheKey;
      const factory = vi.fn().mockResolvedValue("factory-value");
      const options: CacheSetOptions = { ttlMs: 1000 };
      const errorResult = { ok: false as const, error: "Cache error" };

      vi.mocked(mockCacheService.getOrSet).mockResolvedValue(errorResult);

      const result = await adapter.getOrSet(key, factory, options);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Cache error");
      }
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(key, factory, options);
    });

    it("should handle undefined options", async () => {
      const key = "test-key" as CacheKey;
      const factory = vi.fn().mockResolvedValue("factory-value");
      const expectedResult: CacheLookupResult<string> = {
        hit: false,
        value: "factory-value",
        metadata: {
          key,
          createdAt: 0,
          expiresAt: null,
          lastAccessedAt: 0,
          hits: 0,
          tags: [],
        },
      };

      vi.mocked(mockCacheService.getOrSet).mockResolvedValue(ok(expectedResult));

      const result = await adapter.getOrSet(key, factory, undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedResult);
      }
      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(key, factory, undefined);
    });
  });
});

describe("DICachePortAdapter", () => {
  it("should have correct dependencies", () => {
    expect(DICachePortAdapter.dependencies).toEqual([cacheServiceToken]);
  });

  it("should extend CachePortAdapter", () => {
    const mockCacheService = {
      isEnabled: true,
      size: 0,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn(),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    } as unknown as CacheService;

    const adapter = new DICachePortAdapter(mockCacheService);

    expect(adapter).toBeInstanceOf(CachePortAdapter);
    expect(adapter.isEnabled).toBe(true);
  });
});
