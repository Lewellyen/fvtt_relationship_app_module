import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalVisibilityService } from "../JournalVisibilityService";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { Logger } from "@/interfaces/logger";
import type { FoundryJournalEntry } from "@/foundry/types";
import { MODULE_CONSTANTS } from "@/constants";
import { ok, err } from "@/utils/result";
import { createMockDOM } from "@/test/utils/test-helpers";

describe("JournalVisibilityService", () => {
  let service: JournalVisibilityService;
  let mockGame: FoundryGame;
  let mockDocument: FoundryDocument;
  let mockUI: FoundryUI;
  let mockLogger: Logger;

  beforeEach(() => {
    mockGame = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getJournalEntryById: vi.fn().mockReturnValue(ok(null)),
    };
    mockDocument = {
      getFlag: vi.fn().mockReturnValue(ok(null)),
      setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    };
    mockUI = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      findElement: vi.fn().mockReturnValue(ok(null)),
      notify: vi.fn().mockReturnValue(ok(undefined)),
    };
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
      withTraceId: vi.fn(),
    };

    service = new JournalVisibilityService(mockGame, mockDocument, mockUI, mockLogger);
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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal1, journal2]));
      mockDocument.getFlag = vi
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

    it("should return empty array when no hidden entries", () => {
      const journal = {
        id: "journal-1",
        name: "Visible Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(false));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should propagate error from getJournalEntries", () => {
      mockGame.getJournalEntries = vi.fn().mockReturnValue(err("Failed to get entries"));

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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(err("Flag error"));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should show UI notification on ACCESS_DENIED error", () => {
      const journal = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi
        .fn()
        .mockReturnValue(err({ code: "ACCESS_DENIED", message: "Permission denied" }));
      mockUI.notify = vi.fn().mockReturnValue(ok(undefined));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      expect(mockUI.notify).toHaveBeenCalledWith(
        expect.stringContaining("could not be accessed"),
        "warning"
      );
    });

    it("should not show UI notification for non-ACCESS_DENIED errors", () => {
      const journal = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi
        .fn()
        .mockReturnValue(err({ code: "NOT_FOUND", message: "Flag not found" }));
      mockUI.notify = vi.fn().mockReturnValue(ok(undefined));

      service.getHiddenJournalEntries();

      expect(mockUI.notify).not.toHaveBeenCalled();
    });
  });

  describe("processJournalDirectory", () => {
    it("should hide hidden entries", () => {
      const journal = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1">Hidden Journal</li>`
      );

      service.processJournalDirectory(container);

      expect(mockUI.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        "Hidden Journal",
        container
      );
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it("should log error when getHiddenJournalEntries fails", () => {
      const errorMessage = "Error getting entries";
      mockGame.getJournalEntries = vi.fn().mockReturnValue(err(errorMessage));

      const { container } = createMockDOM(`<div>Content</div>`);

      service.processJournalDirectory(container);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error getting hidden journal entries",
        errorMessage
      );
      expect(mockUI.removeJournalElement).not.toHaveBeenCalled();
    });

    it("should log warning when removeJournalElement fails", () => {
      const journal = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));
      const errorMessage = "Element not found";
      mockUI.removeJournalElement = vi.fn().mockReturnValue(err(errorMessage));

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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal1, journal2]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(`
        <li class="directory-item" data-entry-id="journal-1">Hidden 1</li>
        <li class="directory-item" data-entry-id="journal-2">Hidden 2</li>
      `);

      service.processJournalDirectory(container);

      expect(mockUI.removeJournalElement).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal = {
        id: "journal-1",
        name: undefined,
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      service.processJournalDirectory(container);

      expect(mockUI.removeJournalElement).toHaveBeenCalledWith(
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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([xssJournal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([xssJournal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(
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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok(manyJournals));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(false));

      const startTime = performance.now();
      service.getHiddenJournalEntries();
      const duration = performance.now() - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
      expect(mockGame.getJournalEntries).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed journal objects gracefully", () => {
      const malformedJournal = {
        id: null, // Invalid ID
        name: undefined,
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([malformedJournal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      // Should not crash or hang
      expect(() => {
        service.processJournalDirectory(container);
      }).not.toThrow();

      expect(mockUI.removeJournalElement).toHaveBeenCalled();
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

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok(journals));

      // Mixed results: first fails, second succeeds with true, third succeeds with false
      mockDocument.getFlag = vi
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
      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([]));

      const result = service.getHiddenJournalEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
      expect(mockDocument.getFlag).not.toHaveBeenCalled();
    });
  });
});
