import { describe, it, expect, vi, beforeEach } from "vitest";
import { HideJournalContextMenuHandler } from "../hide-journal-context-menu-handler";
import type { JournalVisibilityPort } from "@/domain/ports/journal-visibility-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { ok } from "@/infrastructure/shared/utils/result";

describe("HideJournalContextMenuHandler", () => {
  let mockJournalVisibility: JournalVisibilityPort;
  let mockPlatformUI: PlatformUIPort;
  let mockNotificationCenter: NotificationCenter;
  let mockFoundryGame: FoundryGame;
  let handler: HideJournalContextMenuHandler;

  beforeEach(() => {
    mockJournalVisibility = {
      getEntryFlag: vi.fn().mockReturnValue({ ok: true, value: false }),
      setEntryFlag: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
      isHidden: vi.fn().mockReturnValue({ ok: true, value: false }),
      getHiddenJournalEntries: vi.fn().mockReturnValue({ ok: true, value: [] }),
      processJournalDirectory: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as JournalVisibilityPort;

    mockPlatformUI = {
      notify: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as PlatformUIPort;

    mockNotificationCenter = {
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      notify: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as NotificationCenter;

    mockFoundryGame = {
      getJournalEntries: vi.fn().mockReturnValue(ok([])),
      getJournalEntryById: vi
        .fn()
        .mockReturnValue(ok({ id: "journal-123", name: "Mein Tagebuch", getFlag: vi.fn() })),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundryGame;

    handler = new HideJournalContextMenuHandler(
      mockJournalVisibility,
      mockPlatformUI,
      mockNotificationCenter,
      mockFoundryGame
    );
  });

  describe("handle", () => {
    it("should not add menu item if no journal ID found", () => {
      const mockElement = document.createElement("div");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
      expect(mockJournalVisibility.getEntryFlag).not.toHaveBeenCalled();
    });

    it("should not add menu item if already exists", () => {
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [{ name: "Journal ausblenden", icon: "<i></i>", callback: vi.fn() }],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(1);
      expect(mockJournalVisibility.getEntryFlag).not.toHaveBeenCalled();
    });

    it("should not add menu item if journal is already hidden", () => {
      mockJournalVisibility.getEntryFlag = vi.fn().mockReturnValue({ ok: true, value: true });

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
      expect(mockJournalVisibility.getEntryFlag).toHaveBeenCalledWith(
        { id: "journal-123", name: null },
        MODULE_CONSTANTS.FLAGS.HIDDEN
      );
    });

    it("should add menu item if journal is not hidden", () => {
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(1);
      expect(event.options[0]?.name).toBe("Journal ausblenden");
      expect(event.options[0]?.icon).toBe('<i class="fas fa-eye-slash"></i>');
      expect(typeof event.options[0]?.callback).toBe("function");
      expect(mockJournalVisibility.getEntryFlag).toHaveBeenCalledWith(
        { id: "journal-123", name: null },
        MODULE_CONSTANTS.FLAGS.HIDDEN
      );
    });

    it("should use data-document-id if available", () => {
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-document-id", "journal-456");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(mockJournalVisibility.getEntryFlag).toHaveBeenCalledWith(
        { id: "journal-456", name: null },
        MODULE_CONSTANTS.FLAGS.HIDDEN
      );
    });

    it("should hide journal when callback is executed", async () => {
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      expect(callback).toBeDefined();
      if (callback) {
        const mockLi = document.createElement("li");
        await callback(mockLi);

        expect(mockJournalVisibility.setEntryFlag).toHaveBeenCalledWith(
          { id: "journal-123", name: null },
          MODULE_CONSTANTS.FLAGS.HIDDEN,
          true
        );
        expect(mockFoundryGame.getJournalEntryById).toHaveBeenCalledWith("journal-123");
        expect(mockPlatformUI.notify).toHaveBeenCalledWith(
          `Journal "Mein Tagebuch" wurde ausgeblendet`,
          "info"
        );
      }
    });

    it("should log error if hide fails", async () => {
      mockJournalVisibility.setEntryFlag = vi
        .fn()
        .mockResolvedValue({ ok: false, error: { code: "ERROR", message: "Failed" } });

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        const mockLi = document.createElement("li");
        await callback(mockLi);

        expect(mockNotificationCenter.error).toHaveBeenCalledWith(
          "Failed to hide journal journal-123",
          { code: "ERROR", message: "Failed" },
          { channels: ["ConsoleChannel", "UINotificationChannel"] }
        );
      }
    });

    it("should log warning if notification fails", async () => {
      mockPlatformUI.notify = vi.fn().mockReturnValue({
        ok: false,
        error: { code: "NOTIFY_ERROR", message: "Notification failed" },
      });

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        const mockLi = document.createElement("li");
        await callback(mockLi);

        expect(mockFoundryGame.getJournalEntryById).toHaveBeenCalledWith("journal-123");
        expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
          "Failed to show notification after hiding journal",
          { code: "NOTIFY_ERROR", message: "Notification failed" },
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    it("should use journal ID as fallback if journal entry not found", async () => {
      mockFoundryGame.getJournalEntryById = vi.fn().mockReturnValue(ok(null));

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        const mockLi = document.createElement("li");
        await callback(mockLi);

        expect(mockFoundryGame.getJournalEntryById).toHaveBeenCalledWith("journal-123");
        expect(mockPlatformUI.notify).toHaveBeenCalledWith(
          `Journal "journal-123" wurde ausgeblendet`,
          "info"
        );
      }
    });

    it("should log debug message after successful hide", async () => {
      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        const mockLi = document.createElement("li");
        await callback(mockLi);

        expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
          "Journal journal-123 (Mein Tagebuch) hidden via context menu",
          { journalId: "journal-123", journalName: "Mein Tagebuch" },
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    it("should not add menu item if getEntryFlag fails", () => {
      mockJournalVisibility.getEntryFlag = vi.fn().mockReturnValue({
        ok: false,
        error: { code: "ERROR", message: "Failed" },
      });

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
    });
  });
});
