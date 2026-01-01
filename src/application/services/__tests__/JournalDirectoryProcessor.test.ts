import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalDirectoryProcessor } from "@/application/services/JournalDirectoryProcessor";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";
import { APP_DEFAULTS, MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { ok, err } from "@/domain/utils/result";
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
  let mockJournalDirectoryUI: PlatformJournalDirectoryUiPort;
  let mockNotifications: NotificationPublisherPort;
  let mockConfig: JournalVisibilityConfig;

  beforeEach(() => {
    mockJournalDirectoryUI = {
      removeJournalDirectoryEntry: vi.fn().mockReturnValue(ok(undefined)),
      rerenderJournalDirectory: vi.fn().mockReturnValue(ok(true)),
    } as unknown as PlatformJournalDirectoryUiPort;

    mockNotifications = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn().mockReturnValue(ok(undefined)),
      removeChannel: vi.fn().mockReturnValue(ok(true)),
      getChannelNames: vi.fn().mockReturnValue(ok(["ConsoleChannel", "UIChannel"])),
    } as unknown as NotificationPublisherPort;

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

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      const result = processor.processDirectory("journal", [journal]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).toHaveBeenCalledWith(
        "journal",
        "journal-1",
        "Hidden Journal"
      );
      expect(mockNotifications.debug).toHaveBeenCalled();
    });

    it("should return success when no hidden entries", () => {
      const result = processor.processDirectory("journal", []);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).not.toHaveBeenCalled();
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        "No hidden entries to process",
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should return error when removeJournalDirectoryEntry fails", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };
      const error: JournalVisibilityError = {
        code: "DOM_MANIPULATION_FAILED",
        entryId: "journal-1",
        message: "Failed to remove",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(
        err({
          code: "DOM_MANIPULATION_FAILED",
          message: "Failed to remove",
          operation: "remove",
          details: {
            directoryId: "journal",
            journalId: "journal-1",
            journalName: "Hidden Journal",
          },
        })
      );

      const result = processor.processDirectory("journal", [journal]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        "Error removing journal directory entry",
        error,
        {
          channels: ["ConsoleChannel"],
        }
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

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      const result = processor.processDirectory("journal", [journal1, journal2]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).toHaveBeenCalledTimes(2);
    });

    it("should use default name when journal name is missing", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: null,
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      const result = processor.processDirectory("journal", [journal]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).toHaveBeenCalledWith(
        "journal",
        "journal-1",
        mockConfig.unknownName
      );
    });

    it("should sanitize XSS attempts in journal names when logging", () => {
      const xssJournal: JournalEntry = {
        id: "journal-1",
        name: '<script>alert("XSS")</script>',
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      const result = processor.processDirectory("journal", [xssJournal]);
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

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry)
        .mockReturnValueOnce(
          err({
            code: "DOM_MANIPULATION_FAILED",
            message: "Failed to remove journal-1",
            operation: "remove",
            details: { directoryId: "journal", journalId: "journal-1", journalName: "Journal 1" },
          })
        )
        .mockReturnValueOnce(ok(undefined));

      const result = processor.processDirectory("journal", [journal1, journal2]);

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

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      processor.processDirectory("journal", [journal]);

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

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      // Should not crash or hang
      expect(() => {
        processor.processDirectory("journal", [journal]);
      }).not.toThrow();

      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).toHaveBeenCalled();
    });

    it("should handle different directory IDs", () => {
      const journal: JournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
      };

      vi.mocked(mockJournalDirectoryUI.removeJournalDirectoryEntry).mockReturnValue(ok(undefined));

      const result = processor.processDirectory("custom-directory", [journal]);

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.removeJournalDirectoryEntry).toHaveBeenCalledWith(
        "custom-directory",
        "journal-1",
        "Hidden Journal"
      );
    });
  });
});
