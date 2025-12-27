import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  JournalVisibilityService,
  HIDDEN_JOURNAL_CACHE_TAG,
} from "@/application/services/JournalVisibilityService";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { CacheReaderPort } from "@/domain/ports/cache/cache-reader-port.interface";
import type { CacheWriterPort } from "@/domain/ports/cache/cache-writer-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import { APP_DEFAULTS, MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { ok, err } from "@/domain/utils/result";
import type { CacheEntryMetadata, CacheKey } from "@/infrastructure/cache/cache.interface";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { DomainCacheKey } from "@/domain/types/cache/cache-types";

function createMetadata(): CacheEntryMetadata {
  return {
    key: "journal-cache" as CacheKey,
    createdAt: 0,
    expiresAt: null,
    lastAccessedAt: 0,
    hits: 0,
    tags: [],
  };
}

function createMockJournalCollectionPort(): PlatformJournalCollectionPort {
  return {
    getAll: vi.fn().mockReturnValue(ok([])),
    getById: vi.fn().mockReturnValue(ok(null)),
    getByIds: vi.fn().mockReturnValue(ok([])),
    exists: vi.fn().mockReturnValue(ok(false)),
    count: vi.fn().mockReturnValue(ok(0)),
    search: vi.fn().mockReturnValue(ok([])),
    query: vi.fn(),
  } as unknown as PlatformJournalCollectionPort;
}

function createMockJournalRepository(): PlatformJournalRepository {
  return {
    getAll: vi.fn().mockReturnValue(ok([])),
    getById: vi.fn().mockReturnValue(ok(null)),
    getByIds: vi.fn().mockReturnValue(ok([])),
    exists: vi.fn().mockReturnValue(ok(false)),
    count: vi.fn().mockReturnValue(ok(0)),
    search: vi.fn().mockReturnValue(ok([])),
    query: vi.fn(),
    create: vi.fn().mockResolvedValue(ok({})),
    createMany: vi.fn().mockResolvedValue(ok([])),
    update: vi.fn().mockResolvedValue(ok({})),
    updateMany: vi.fn().mockResolvedValue(ok([])),
    patch: vi.fn().mockResolvedValue(ok({})),
    upsert: vi.fn().mockResolvedValue(ok({})),
    delete: vi.fn().mockResolvedValue(ok(undefined)),
    deleteMany: vi.fn().mockResolvedValue(ok(undefined)),
    getFlag: vi.fn().mockReturnValue(ok(null)),
    setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as PlatformJournalRepository;
}

function createMockConfig(): JournalVisibilityConfig {
  return {
    moduleNamespace: MODULE_METADATA.ID,
    hiddenFlagKey: DOMAIN_FLAGS.HIDDEN,
    unknownName: APP_DEFAULTS.UNKNOWN_NAME,
    cacheKeyFactory: (resource: string): DomainCacheKey => {
      return `mock-cache-key-${resource}` as DomainCacheKey;
    },
  };
}

describe("JournalVisibilityService", () => {
  let service: JournalVisibilityService;
  let mockJournalCollection: PlatformJournalCollectionPort;
  let mockJournalRepository: PlatformJournalRepository;
  let mockNotifications: PlatformNotificationPort;
  let mockCacheReader: CacheReaderPort;
  let mockCacheWriter: CacheWriterPort;
  let mockConfig: JournalVisibilityConfig;

  beforeEach(() => {
    mockJournalCollection = createMockJournalCollectionPort();
    mockJournalRepository = createMockJournalRepository();
    mockNotifications = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn().mockReturnValue(ok(undefined)),
      removeChannel: vi.fn().mockReturnValue(ok(true)),
      getChannelNames: vi.fn().mockReturnValue(ok(["ConsoleChannel", "UIChannel"])),
    } as unknown as PlatformNotificationPort;

    mockCacheReader = {
      get: vi.fn().mockReturnValue(null),
      has: vi.fn().mockReturnValue(false),
      getMetadata: vi.fn().mockReturnValue(null),
    } as unknown as CacheReaderPort;

    mockCacheWriter = {
      set: vi.fn().mockReturnValue(createMetadata()),
      delete: vi.fn().mockReturnValue(false),
      clear: vi.fn().mockReturnValue(0),
    } as unknown as CacheWriterPort;

    mockConfig = createMockConfig();

    service = new JournalVisibilityService(
      mockJournalCollection,
      mockJournalRepository,
      mockNotifications,
      mockCacheReader,
      mockCacheWriter,
      mockConfig
    );
  });

  describe("getHiddenJournalEntries", () => {
    it("should return hidden journal entries", () => {
      const journal1: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };
      const journal2: JournalEntry = {
        id: "journal-2",
        name: "Visible Journal",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal1, journal2]));
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true)) // journal1 is hidden
        .mockReturnValueOnce(ok(false)); // journal2 is visible

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe("journal-1");
      }
    });

    it("should return cached entries when cache hits", () => {
      const cachedEntry: JournalEntry = { id: "cached", name: "Cached" };
      const cacheGetMock = mockCacheReader.get as Mock;
      cacheGetMock.mockReturnValueOnce({
        hit: true,
        value: [cachedEntry],
        metadata: createMetadata(),
      });

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([cachedEntry]);
      }
      expect(mockJournalCollection.getAll).not.toHaveBeenCalled();
    });

    it("should cache calculated entries on miss", () => {
      const journal: JournalEntry = { id: "journal-1", name: "Hidden" };
      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      const cacheGetMock = mockCacheReader.get as Mock;
      cacheGetMock.mockReturnValueOnce(null);

      service.getHiddenJournalEntries();

      expect(mockCacheWriter.set).toHaveBeenCalledWith(
        expect.anything(),
        expect.arrayContaining([journal]),
        expect.objectContaining({ tags: [HIDDEN_JOURNAL_CACHE_TAG] })
      );
    });

    it("should return empty array when no hidden entries", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Visible Journal",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should propagate error from getAll", () => {
      vi.mocked(mockJournalCollection.getAll).mockReturnValue(
        err({
          code: "COLLECTION_NOT_AVAILABLE",
          message: "Failed to get entries",
        })
      );

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_ERROR");
      }
    });

    it("should ignore entries where getFlag fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Journal",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(
        err({
          code: "ENTITY_NOT_FOUND",
          message: "Flag error",
        })
      );

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should log warning on flag read error", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Journal",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(
        err({
          code: "ENTITY_NOT_FOUND",
          message: "Permission denied",
        })
      );

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read hidden flag"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should sanitize journal names in error logs", () => {
      const xssJournal: JournalEntry = {
        id: "journal-1",
        name: "<img src=x onerror=alert(1)>",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([xssJournal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(
        err({
          code: "ENTITY_NOT_FOUND",
          message: "Failed to read flag",
        })
      );

      service.getHiddenJournalEntries();

      // Verify logger was called with sanitized name in error message
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("&lt;img"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
      expect(mockNotifications.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("<img"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });
  });

  describe("Edge Cases & Performance", () => {
    it("should handle 1000+ journal entries efficiently", () => {
      const manyJournals: JournalEntry[] = [];
      for (let i = 0; i < 1000; i++) {
        manyJournals.push({
          id: `journal-${i}`,
          name: `Journal ${i}`,
        });
      }

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(manyJournals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));

      const startTime = performance.now();
      service.getHiddenJournalEntries();
      const duration = performance.now() - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(mockJournalCollection.getAll).toHaveBeenCalledTimes(1);
    });

    it("should handle journal entries with null name gracefully", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));

      const result = service.getHiddenJournalEntries();

      // Should not crash, should return result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should handle journal entries with extremely long names", () => {
      const longName = "A".repeat(10000);
      const journal: JournalEntry = {
        id: "journal-1",
        name: longName,
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));

      const result = service.getHiddenJournalEntries();

      // Should not crash, should return result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should handle mixed success/failure when reading flags", () => {
      const journals: JournalEntry[] = [
        {
          id: "journal-1",
          name: "Journal 1",
        },
        {
          id: "journal-2",
          name: "Journal 2",
        },
        {
          id: "journal-3",
          name: "Journal 3",
        },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      // Mixed results: first fails, second succeeds with true, third succeeds with false
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(
          err({
            code: "ENTITY_NOT_FOUND",
            message: "Error",
          })
        )
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(ok(false));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Only journal-2 should be hidden
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe("journal-2");
      }
      // Error should have been logged
      expect(mockNotifications.warn).toHaveBeenCalled();
    });

    it("should use journal id in warning when name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-id-only",
        name: null,
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(
        err({
          code: "ENTITY_NOT_FOUND",
          message: "Failed to read flag",
        })
      );

      service.getHiddenJournalEntries();

      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("journal-id-only"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle empty journal list", () => {
      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([]));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
      expect(mockJournalRepository.getFlag).not.toHaveBeenCalled();
    });
  });
});
