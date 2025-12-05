import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalDirectoryProcessor } from "@/application/services/JournalDirectoryProcessor";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";
import { APP_DEFAULTS, MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { ok, err } from "@/domain/utils/result";
import { createMockDOM } from "@/test/utils/test-helpers";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { DomainCacheKey } from "@/domain/types/cache/cache-types";

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

describe("JournalDirectoryProcessor", () => {
  let processor: JournalDirectoryProcessor;
  let mockJournalDirectoryUI: JournalDirectoryUiPort;
  let mockNotifications: PlatformNotificationPort;
  let mockConfig: JournalVisibilityConfig;

  beforeEach(() => {
    mockJournalDirectoryUI = {
      removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
      rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
    } as unknown as JournalDirectoryUiPort;

    mockNotifications = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn().mockReturnValue(ok(undefined)),
      removeChannel: vi.fn().mockReturnValue(ok(true)),
      getChannelNames: vi.fn().mockReturnValue(ok(["ConsoleChannel", "UIChannel"])),
    } as unknown as PlatformNotificationPort;

    mockConfig = createMockConfig();

    processor = new JournalDirectoryProcessor(
      mockJournalDirectoryUI,
      mockNotifications,
      mockConfig
    );
  });

  describe("processDirectory", () => {
    it("should hide hidden entries", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1">Hidden Journal</li>`
      );

      const result = processor.processDirectory(container, [journal]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalledWith(
        "journal-1",
        "Hidden Journal",
        container
      );
      expect(mockNotifications.debug).toHaveBeenCalled();
    });

    it("should return success when no hidden entries", () => {
      const { container } = createMockDOM(`<div>Content</div>`);

      const result = processor.processDirectory(container, []);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).not.toHaveBeenCalled();
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        "No hidden entries to process",
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should return error when removeJournalElement fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };
      const error: JournalVisibilityError = {
        code: "DOM_MANIPULATION_FAILED",
        entryId: "journal-1",
        message: "Failed to remove",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(
        err({
          code: "DOM_MANIPULATION_FAILED",
          message: "Failed to remove",
          operation: "remove",
          details: { journalId: "journal-1", journalName: "Hidden Journal" },
        })
      );

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = processor.processDirectory(container, [journal]);

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

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(`
        <li class="directory-item" data-entry-id="journal-1">Hidden 1</li>
        <li class="directory-item" data-entry-id="journal-2">Hidden 2</li>
      `);

      const result = processor.processDirectory(container, [journal1, journal2]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = processor.processDirectory(container, [journal]);

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

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      const result = processor.processDirectory(container, [xssJournal]);
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

    it("should handle mixed success/failure when removing entries", () => {
      const journal1: JournalEntry = {
        id: "journal-1",
        name: "Journal 1",
      };
      const journal2: JournalEntry = {
        id: "journal-2",
        name: "Journal 2",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement)
        .mockReturnValueOnce(
          err({
            code: "DOM_MANIPULATION_FAILED",
            message: "Failed to remove journal-1",
            operation: "remove",
            details: { journalId: "journal-1", journalName: "Journal 1" },
          })
        )
        .mockReturnValueOnce(ok(undefined));

      const { container } = createMockDOM(`<div>Content</div>`);

      const result = processor.processDirectory(container, [journal1, journal2]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DOM_MANIPULATION_FAILED");
        if (result.error.code === "DOM_MANIPULATION_FAILED") {
          expect(result.error.entryId).toBe("journal-1");
        }
      }
      expect(mockNotifications.warn).toHaveBeenCalledTimes(1);
    });

    it("should log debug message with hidden count", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(`<div>Content</div>`);

      processor.processDirectory(container, [journal]);

      expect(mockNotifications.debug).toHaveBeenCalledWith(
        "Processing journal directory for hidden entries",
        expect.objectContaining({ context: expect.objectContaining({ hiddenCount: 1 }) }),
        { channels: ["ConsoleChannel"] }
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle journal entries with extremely long names", () => {
      const longName = "A".repeat(10000);
      const journal: JournalEntry = {
        id: "journal-1",
        name: longName,
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(
        `<li class="directory-item" data-entry-id="journal-1"></li>`
      );

      // Should not crash or hang
      expect(() => {
        processor.processDirectory(container, [journal]);
      }).not.toThrow();

      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalled();
    });

    it("should handle empty HTML element", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalElement).mockReturnValue(ok(undefined));

      const { container } = createMockDOM(`<div></div>`);

      const result = processor.processDirectory(container, [journal]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalElement).toHaveBeenCalled();
    });
  });
});
