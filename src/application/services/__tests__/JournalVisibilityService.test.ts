import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  JournalVisibilityService,
  HIDDEN_JOURNAL_CACHE_TAG,
} from "@/application/services/JournalVisibilityService";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { ok, err } from "@/domain/utils/result";
import { createMockDOM } from "@/test/utils/test-helpers";
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

function createMockJournalCollectionPort(): JournalCollectionPort {
  return {
    getAll: vi.fn().mockReturnValue(ok([])),
    getById: vi.fn().mockReturnValue(ok(null)),
    getByIds: vi.fn().mockReturnValue(ok([])),
    exists: vi.fn().mockReturnValue(ok(false)),
    count: vi.fn().mockReturnValue(ok(0)),
    search: vi.fn().mockReturnValue(ok([])),
    query: vi.fn(),
  } as unknown as JournalCollectionPort;
}

function createMockJournalRepository(): JournalRepository {
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
  } as unknown as JournalRepository;
}

function createMockConfig(): JournalVisibilityConfig {
  return {
    moduleNamespace: MODULE_CONSTANTS.MODULE.ID,
    hiddenFlagKey: MODULE_CONSTANTS.FLAGS.HIDDEN,
    unknownName: MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
    cacheKeyFactory: (resource: string): DomainCacheKey => {
      return `mock-cache-key-${resource}` as DomainCacheKey;
    },
  };
}

describe("JournalVisibilityService", () => {
  let service: JournalVisibilityService;
  let mockJournalCollection: JournalCollectionPort;
  let mockJournalRepository: JournalRepository;
  let mockNotifications: PlatformNotificationPort;
  let mockCache: PlatformCachePort;
  let mockJournalDirectoryUI: JournalDirectoryUiPort;
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

    mockCache = {
      isEnabled: true,
      size: 0,
      get: vi.fn().mockReturnValue(null),
      set: vi.fn().mockReturnValue(createMetadata()),
      delete: vi.fn().mockReturnValue(false),
      has: vi.fn().mockReturnValue(false),
      clear: vi.fn().mockReturnValue(0),
      invalidateWhere: vi.fn().mockReturnValue(0),
      getMetadata: vi.fn().mockReturnValue(null),
      getStatistics: vi
        .fn()
        .mockReturnValue({ hits: 0, misses: 0, evictions: 0, size: 0, enabled: true }),
      getOrSet: vi.fn(),
    } as unknown as PlatformCachePort;

    mockJournalDirectoryUI = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
    } as unknown as JournalDirectoryUiPort;

    mockConfig = createMockConfig();

    service = new JournalVisibilityService(
      mockJournalCollection,
      mockJournalRepository,
      mockNotifications,
      mockCache,
      mockJournalDirectoryUI,
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
      const cacheGetMock = mockCache.get as Mock;
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
      const cacheGetMock = mockCache.get as Mock;
      cacheGetMock.mockReturnValueOnce(null);

      service.getHiddenJournalEntries();

      expect(mockCache.set).toHaveBeenCalledWith(
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
  });

  describe("processJournalDirectory", () => {
    it("should hide hidden entries", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1">Hidden Journal</li>`
      );

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        "Hidden Journal",
        container
      );
      expect(mockNotifications.debug).toHaveBeenCalled();
    });

    it("should handle error when getHiddenJournalEntries fails", () => {
      vi.mocked(mockJournalCollection.getAll).mockReturnValue(
        err({
          code: "COLLECTION_NOT_AVAILABLE",
          message: "Error getting entries",
        })
      );

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(false);
      expect(mockNotifications.error).toHaveBeenCalledWith(
        "Error getting hidden journal entries",
        expect.any(Object),
        {
          channels: ["ConsoleChannel"],
        }
      );
      expect(mockJournalDirectoryUI.removeJournalElement).not.toHaveBeenCalled();
    });

    it("should return error when removeEntryFromDOM fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };
      const error: JournalVisibilityError = {
        code: "DOM_MANIPULATION_FAILED",
        entryId: "journal-1",
        message: "Failed to remove",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(
        err({
          code: "DOM_MANIPULATION_FAILED",
          message: "Failed to remove",
          operation: "remove",
          details: { journalId: "journal-1", journalName: "Hidden Journal" },
        })
      );

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockNotifications.warn).toHaveBeenCalledWith("Error removing journal entry", error, {
        channels: ["ConsoleChannel"],
      });
    });

    it("should process multiple hidden entries", () => {
      const journal1: JournalEntry = {
        id: "journal-1",
        name: "Hidden 1",
      };
      const journal2: JournalEntry = {
        id: "journal-2",
        name: "Hidden 2",
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal1, journal2]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(`
        <li class="directory-item" data-entry-id="journal-1">Hidden 1</li>
        <li class="directory-item" data-entry-id="journal-2">Hidden 2</li>
      `);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([journal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        mockConfig.unknownName,
        container
      );
    });

    it("should sanitize XSS attempts in journal names when logging", () => {
      const xssJournal: JournalEntry = {
        id: "journal-1",
        name: '<script>alert("XSS")</script>',
      };

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok([xssJournal]));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = service.processJournalDirectory(container);
      expect(result.ok).toBe(true);

      // Verify logger was called with sanitized name
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        expect.stringContaining("&lt;script&gt;"),
        expect.any(Object),
        expect.objectContaining({ channels: ["ConsoleChannel"] })
      );
      expect(mockNotifications.debug).not.toHaveBeenCalledWith(
        expect.stringContaining("<script>"),
        expect.anything(),
        expect.objectContaining({ channels: ["ConsoleChannel"] })
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
      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      // Should not crash or hang
      expect(() => {
        service.processJournalDirectory(container);
      }).not.toThrow();

      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalled();
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
