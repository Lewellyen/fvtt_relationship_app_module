import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalVisibilityService } from "../JournalVisibilityService";
import type { FoundryGame, FoundryDocument, FoundryUI } from "@/foundry/interfaces/FoundryGame";
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
      getJournalEntries: vi.fn().mockReturnValue(ok<FoundryJournalEntry[], string>([])),
    };
    mockDocument = {
      getFlag: vi.fn().mockReturnValue(ok<boolean | null, string>(null)),
    };
    mockUI = {
      removeJournalElement: vi.fn().mockReturnValue(ok<void, string>(undefined)),
    };
    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      log: vi.fn(),
    };

    service = new JournalVisibilityService(mockGame, mockDocument, mockUI, mockLogger);
  });

  describe("getHiddenJournalEntries", () => {
    it("should return hidden journal entries", () => {
      const journal1: FoundryJournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      };
      const journal2: FoundryJournalEntry = {
        id: "journal-2",
        name: "Visible Journal",
        getFlag: vi.fn(),
      };

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
      const journal: FoundryJournalEntry = {
        id: "journal-1",
        name: "Visible Journal",
        getFlag: vi.fn(),
      };

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
      const journal: FoundryJournalEntry = {
        id: "journal-1",
        name: "Journal",
        getFlag: vi.fn(),
      };

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(err("Flag error"));

      const result = service.getHiddenJournalEntries();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("processJournalDirectory", () => {
    it("should hide hidden entries", () => {
      const journal: FoundryJournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      };

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
      mockGame.getJournalEntries = vi.fn().mockReturnValue(err("Error getting entries"));

      const { container } = createMockDOM(`<div>Content</div>`);

      service.processJournalDirectory(container);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Error getting hidden journal entries")
      );
      expect(mockUI.removeJournalElement).not.toHaveBeenCalled();
    });

    it("should log warning when removeJournalElement fails", () => {
      const journal: FoundryJournalEntry = {
        id: "journal-1",
        name: "Hidden Journal",
        getFlag: vi.fn(),
      };

      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok([journal]));
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));
      mockUI.removeJournalElement = vi.fn().mockReturnValue(err("Element not found"));

      const { container } = createMockDOM(`<div>Content</div>`);

      service.processJournalDirectory(container);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Error removing journal entry")
      );
    });

    it("should process multiple hidden entries", () => {
      const journal1: FoundryJournalEntry = {
        id: "journal-1",
        name: "Hidden 1",
        getFlag: vi.fn(),
      };
      const journal2: FoundryJournalEntry = {
        id: "journal-2",
        name: "Hidden 2",
        getFlag: vi.fn(),
      };

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
      const journal: FoundryJournalEntry = {
        id: "journal-1",
        name: undefined,
        getFlag: vi.fn(),
      };

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
  });
});

