import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { JournalVisibilityService, HIDDEN_JOURNAL_CACHE_TAG } from "../JournalVisibilityService";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { Logger } from "@/interfaces/logger";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundryJournalEntry } from "@/foundry/types";
import { MODULE_CONSTANTS } from "@/constants";
import { ok, err } from "@/utils/functional/result";
import { createMockDOM } from "@/test/utils/test-helpers";
import type { CacheService, CacheEntryMetadata, CacheKey } from "@/interfaces/cache";

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
  let mockFacade: FoundryJournalFacade;
  let mockLogger: Logger;
  let mockNotificationCenter: NotificationCenter;
  let mockCacheService: CacheService;

  beforeEach(() => {
    mockFacade = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getEntryFlag: vi.fn().mockReturnValue(ok(null)),
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
    };
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      withTraceId: vi.fn(),
    };
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

    service = new JournalVisibilityService(
      mockFacade,
      mockLogger,
      mockNotificationCenter,
      mockCacheService
    );
  });

  describe("getHiddenJournalEntries", () => {
    it("should return hidden journal entries", () => {
      const journal1 = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const journal2 = {
        id: "journal-2",
        name: "Visible Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal1, journal2]));
      mockFacade.getEntryFlag = vi
        .fn()
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
      const cachedEntry = { id: "cached", name: "Cached" } as FoundryJournalEntry;
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
      expect(mockFacade.getJournalEntries).not.toHaveBeenCalled();
    });

    it("should cache calculated entries on miss", () => {
      const journal = { id: "journal-1", name: "Hidden" } as FoundryJournalEntry;
      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));
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
      const journal = {
        id: "journal-1",
        name: "Visible Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(false));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should propagate error from getJournalEntries", () => {
      mockFacade.getJournalEntries = vi.fn().mockReturnValue(err("Failed to get entries"));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Failed to get entries");
      }
    });

    it("should ignore entries where getFlag fails", () => {
      const journal = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(err("Flag error"));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should log warning on ACCESS_DENIED error", () => {
      const journal = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi
        .fn()
        .mockReturnValue(err({ code: "ACCESS_DENIED", message: "Permission denied" }));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      // UI notifications removed from facade - only logging remains
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read hidden flag"),
        expect.any(Object)
      );
    });

    it("should log warning for non-ACCESS_DENIED errors", () => {
      const journal = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi
        .fn()
        .mockReturnValue(err({ code: "NOT_FOUND", message: "Flag not found" }));

      service.getHiddenJournalEntries();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read hidden flag"),
        expect.any(Object)
      );
    });
  });

  describe("processJournalDirectory", () => {
    it("should hide hidden entries", () => {
      const journal = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1">Hidden Journal</li>`
      );

      service.processJournalDirectory(container);

      expect(mockFacade.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        "Hidden Journal",
        container
      );
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should handle error when getHiddenJournalEntries fails", () => {
      const errorMessage = "Error getting entries";
      mockFacade.getJournalEntries = vi.fn().mockReturnValue(err(errorMessage));

      const { container } = createMockDOM(`<div>Content</div>`);

      service.processJournalDirectory(container);

      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Error getting hidden journal entries",
        errorMessage,
        {
          channels: ["ConsoleChannel"],
        }
      );
      expect(mockFacade.removeJournalElement).not.toHaveBeenCalled();
    });

    it("should log warning when removeJournalElement fails", () => {
      const journal = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));
      const errorMessage = "Element not found";
      mockFacade.removeJournalElement = vi.fn().mockReturnValue(err(errorMessage));

      const { container } = createMockDOM(`<div>Content</div>`);

      service.processJournalDirectory(container);

      expect(mockLogger.warn).toHaveBeenCalledWith("Error removing journal entry", errorMessage);
    });

    it("should process multiple hidden entries", () => {
      const journal1 = {
        id: "journal-1",
        name: "Hidden 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const journal2 = {
        id: "journal-2",
        name: "Hidden 2",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal1, journal2]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(`
        <li class="directory-item" data-entry-id="journal-1">Hidden 1</li>
        <li class="directory-item" data-entry-id="journal-2">Hidden 2</li>
      `);

      service.processJournalDirectory(container);

      expect(mockFacade.removeJournalElement).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal = {
        id: "journal-1",
        name: undefined,
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      service.processJournalDirectory(container);

      expect(mockFacade.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
        container
      );
    });

    it("should sanitize XSS attempts in journal names when logging", () => {
      const xssJournal = {
        id: "journal-1",
        name: '<script>alert("XSS")</script>',
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([xssJournal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      service.processJournalDirectory(container);

      // Verify logger was called with sanitized name
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining("&lt;script&gt;"));
      expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining("<script>"));
    });

    it("should sanitize journal names in error logs", () => {
      const xssJournal = {
        id: "journal-1",
        name: "<img src=x onerror=alert(1)>",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([xssJournal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(
        err({
          code: "OPERATION_FAILED" as const,
          message: "Failed to read flag",
        })
      );

      service.getHiddenJournalEntries();

      // Verify logger was called with sanitized name in error message
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("&lt;img"),
        expect.any(Object)
      );
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("<img"),
        expect.any(Object)
      );
    });
  });

  describe("Edge Cases & Performance", () => {
    it("should handle 1000+ journal entries efficiently", () => {
      const manyJournals: FoundryJournalEntry[] = [];
      for (let i = 0; i < 1000; i++) {
        manyJournals.push({
          id: `journal-${i}`,
          name: `Journal ${i}`,
          getFlag: vi.fn(),
        } as unknown as FoundryJournalEntry);
      }

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok(manyJournals));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(false));

      const startTime = performance.now();
      service.getHiddenJournalEntries();
      const duration = performance.now() - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(mockFacade.getJournalEntries).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed journal objects gracefully", () => {
      const malformedJournal = {
        id: null, // Invalid ID
        name: undefined,
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([malformedJournal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const result = service.getHiddenJournalEntries();

      // Should not crash, should return result
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should handle journal entries with extremely long names", () => {
      const longName = "A".repeat(10000);
      const journal = {
        id: "journal-1",
        name: longName,
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockFacade.getEntryFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      // Should not crash or hang
      expect(() => {
        service.processJournalDirectory(container);
      }).not.toThrow();

      expect(mockFacade.removeJournalElement).toHaveBeenCalled();
    });

    it("should handle mixed success/failure when reading flags", () => {
      const journals = [
        {
          id: "journal-1",
          name: "Journal 1",
          getFlag: vi.fn(),
        },
        {
          id: "journal-2",
          name: "Journal 2",
          getFlag: vi.fn(),
        },
        {
          id: "journal-3",
          name: "Journal 3",
          getFlag: vi.fn(),
        },
      ] as unknown as FoundryJournalEntry[];

      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok(journals));

      // Mixed results: first fails, second succeeds with true, third succeeds with false
      mockFacade.getEntryFlag = vi
        .fn()
        .mockReturnValueOnce(err({ code: "OPERATION_FAILED" as const, message: "Error" }))
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
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should handle empty journal list", () => {
      mockFacade.getJournalEntries = vi.fn().mockReturnValue(ok([]));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
      expect(mockFacade.getEntryFlag).not.toHaveBeenCalled();
    });
  });
});
