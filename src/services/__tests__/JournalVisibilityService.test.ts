import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { JournalVisibilityService, HIDDEN_JOURNAL_CACHE_TAG } from "../JournalVisibilityService";
import type { JournalVisibilityPort } from "@/core/ports/journal-visibility-port.interface";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { JournalEntry, JournalVisibilityError } from "@/core/domain/journal-entry";
import { MODULE_CONSTANTS } from "@/constants";
import { ok, err } from "@/utils/functional/result";
import { createMockDOM } from "@/test/utils/test-helpers";
import type { CacheService, CacheEntryMetadata, CacheKey } from "@/interfaces/cache";
import { createMockJournalVisibilityPort } from "@/core/ports/__tests__/journal-visibility-port.mock";

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

describe("JournalVisibilityService", () => {
  let service: JournalVisibilityService;
  let mockPort: JournalVisibilityPort;
  let mockNotificationCenter: NotificationCenter;
  let mockCacheService: CacheService;

  beforeEach(() => {
    mockPort = createMockJournalVisibilityPort();
    mockNotificationCenter = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn(),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel", "UIChannel"]),
    } as unknown as NotificationCenter;

    mockCacheService = {
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
    } as unknown as CacheService;

    service = new JournalVisibilityService(mockPort, mockNotificationCenter, mockCacheService);
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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal1, journal2]));
      vi.mocked(mockPort.getEntryFlag)
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
      const cacheGetMock = mockCacheService.get as Mock;
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
      expect(mockPort.getAllEntries).not.toHaveBeenCalled();
    });

    it("should cache calculated entries on miss", () => {
      const journal: JournalEntry = { id: "journal-1", name: "Hidden" };
      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      const cacheGetMock = mockCacheService.get as Mock;
      cacheGetMock.mockReturnValueOnce(null);

      service.getHiddenJournalEntries();

      expect(mockCacheService.set).toHaveBeenCalledWith(
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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(false));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should propagate error from getAllEntries", () => {
      const error: JournalVisibilityError = {
        code: "INVALID_ENTRY_DATA",
        message: "Failed to get entries",
      };
      vi.mocked(mockPort.getAllEntries).mockReturnValue(err(error));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
    });

    it("should ignore entries where getEntryFlag fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Journal",
      };
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-1",
        message: "Flag error",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(err(error));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should log warning on FLAG_READ_FAILED error", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Journal",
      };
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-1",
        message: "Permission denied",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(err(error));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read hidden flag"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should log warning for FLAG_READ_FAILED errors", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Journal",
      };
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-1",
        message: "Flag not found",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(err(error));

      service.getHiddenJournalEntries();

      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1">Hidden Journal</li>`
      );

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockPort.removeEntryFromDOM).toHaveBeenCalledWith(
        "journal-1",
        "Hidden Journal",
        container
      );
      expect(mockNotificationCenter.debug).toHaveBeenCalled();
    });

    it("should handle error when getHiddenJournalEntries fails", () => {
      const error: JournalVisibilityError = {
        code: "INVALID_ENTRY_DATA",
        message: "Error getting entries",
      };
      vi.mocked(mockPort.getAllEntries).mockReturnValue(err(error));

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Error getting hidden journal entries",
        error,
        {
          channels: ["ConsoleChannel"],
        }
      );
      expect(mockPort.removeEntryFromDOM).not.toHaveBeenCalled();
    });

    it("should return error when removeEntryFromDOM fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };
      const error: JournalVisibilityError = {
        code: "DOM_MANIPULATION_FAILED",
        entryId: "journal-1",
        message: "Element not found",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(err(error));

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        "Error removing journal entry",
        error,
        { channels: ["ConsoleChannel"] }
      );
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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal1, journal2]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(`
        <li class="directory-item" data-entry-id="journal-1">Hidden 1</li>
        <li class="directory-item" data-entry-id="journal-2">Hidden 2</li>
      `);

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockPort.removeEntryFromDOM).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = service.processJournalDirectory(container);

      expect(result.ok).toBe(true);
      expect(mockPort.removeEntryFromDOM).toHaveBeenCalledWith(
        "journal-1",
        MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
        container
      );
    });

    it("should sanitize XSS attempts in journal names when logging", () => {
      const xssJournal: JournalEntry = {
        id: "journal-1",
        name: '<script>alert("XSS")</script>',
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([xssJournal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = service.processJournalDirectory(container);
      expect(result.ok).toBe(true);

      // Verify logger was called with sanitized name
      expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
        expect.stringContaining("&lt;script&gt;"),
        expect.any(Object),
        expect.objectContaining({ channels: ["ConsoleChannel"] })
      );
      expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
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
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-1",
        message: "Failed to read flag",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([xssJournal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(err(error));

      service.getHiddenJournalEntries();

      // Verify logger was called with sanitized name in error message
      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        expect.stringContaining("&lt;img"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
      expect(mockNotificationCenter.warn).not.toHaveBeenCalledWith(
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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok(manyJournals));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(false));

      const startTime = performance.now();
      service.getHiddenJournalEntries();
      const duration = performance.now() - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(mockPort.getAllEntries).toHaveBeenCalledTimes(1);
    });

    it("should handle journal entries with null name gracefully", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));

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

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(ok(true));
      vi.mocked(mockPort.removeEntryFromDOM).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      // Should not crash or hang
      expect(() => {
        service.processJournalDirectory(container);
      }).not.toThrow();

      expect(mockPort.removeEntryFromDOM).toHaveBeenCalled();
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
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-1",
        message: "Error",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok(journals));

      // Mixed results: first fails, second succeeds with true, third succeeds with false
      vi.mocked(mockPort.getEntryFlag)
        .mockReturnValueOnce(err(error))
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
      expect(mockNotificationCenter.warn).toHaveBeenCalled();
    });

    it("should use journal id in warning when name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-id-only",
        name: null,
      };
      const error: JournalVisibilityError = {
        code: "FLAG_READ_FAILED",
        entryId: "journal-id-only",
        message: "Failed to read flag",
      };

      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([journal]));
      vi.mocked(mockPort.getEntryFlag).mockReturnValue(err(error));

      service.getHiddenJournalEntries();

      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        expect.stringContaining("journal-id-only"),
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle empty journal list", () => {
      vi.mocked(mockPort.getAllEntries).mockReturnValue(ok([]));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
      expect(mockPort.getEntryFlag).not.toHaveBeenCalled();
    });
  });
});
