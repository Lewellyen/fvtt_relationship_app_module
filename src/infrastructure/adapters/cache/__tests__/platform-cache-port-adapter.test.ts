import { describe, it, expect, vi, beforeEach } from "vitest";
import { CachePortAdapter, DICachePortAdapter } from "../platform-cache-port-adapter";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type {
  CacheKey,
  CacheSetOptions,
  CacheEntryMetadata,
  CacheLookupResult,
  CacheStatistics,
  CacheInvalidationPredicate,
} from "@/infrastructure/cache/cache.interface";
import { ok } from "@/infrastructure/shared/utils/result";
import { cacheServiceToken } from "@/infrastructure/shared/tokens";

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
    it("should delegate to cacheService.invalidateWhere", () => {
      const predicate: CacheInvalidationPredicate = (entry) => entry.tags.includes("test");

      vi.mocked(mockCacheService.invalidateWhere).mockReturnValue(2);

      const result = adapter.invalidateWhere(predicate);

      expect(result).toBe(2);
      expect(mockCacheService.invalidateWhere).toHaveBeenCalledWith(predicate);
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
