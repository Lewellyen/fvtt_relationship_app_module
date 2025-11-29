import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  HideJournalContextMenuHandler,
  DIHideJournalContextMenuHandler,
} from "../hide-journal-context-menu-handler";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { ok } from "@/domain/utils/result";

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
    getFlag: vi.fn().mockReturnValue(ok(false)),
    setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as JournalRepository;
}

describe("HideJournalContextMenuHandler", () => {
  let mockJournalRepository: JournalRepository;
  let mockPlatformUI: PlatformUIPort;
  let mockNotificationCenter: PlatformNotificationPort;
  let handler: HideJournalContextMenuHandler;

  beforeEach(() => {
    mockJournalRepository = createMockJournalRepository();
    // Setup getById to return journal with name
    vi.mocked(mockJournalRepository.getById).mockReturnValue(
      ok({ id: "journal-123", name: "Mein Tagebuch" })
    );

    mockPlatformUI = {
      notify: vi.fn().mockReturnValue({ ok: true, value: undefined }),
    } as unknown as PlatformUIPort;

    mockNotificationCenter = {
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      addChannel: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeChannel: vi.fn().mockReturnValue({ ok: true, value: false }),
      getChannelNames: vi.fn().mockReturnValue({ ok: true, value: [] }),
    } as unknown as PlatformNotificationPort;

    handler = new HideJournalContextMenuHandler(
      mockJournalRepository,
      mockPlatformUI,
      mockNotificationCenter
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
      expect(mockJournalRepository.getFlag).not.toHaveBeenCalled();
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
      expect(mockJournalRepository.getFlag).not.toHaveBeenCalled();
    });

    it("should not add menu item if journal is already hidden", () => {
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));

      const mockElement = document.createElement("div");
      mockElement.setAttribute("data-entry-id", "journal-123");
      const event: JournalContextMenuEvent = {
        htmlElement: mockElement,
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
      expect(mockJournalRepository.getFlag).toHaveBeenCalledWith(
        "journal-123",
        MODULE_CONSTANTS.MODULE.ID,
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
      expect(mockJournalRepository.getFlag).toHaveBeenCalledWith(
        "journal-123",
        MODULE_CONSTANTS.MODULE.ID,
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

      expect(mockJournalRepository.getFlag).toHaveBeenCalledWith(
        "journal-456",
        MODULE_CONSTANTS.MODULE.ID,
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

        expect(mockJournalRepository.setFlag).toHaveBeenCalledWith(
          "journal-123",
          MODULE_CONSTANTS.MODULE.ID,
          MODULE_CONSTANTS.FLAGS.HIDDEN,
          true
        );
        expect(mockJournalRepository.getById).toHaveBeenCalledWith("journal-123");
        expect(mockPlatformUI.notify).toHaveBeenCalledWith(
          `Journal "Mein Tagebuch" wurde ausgeblendet`,
          "info"
        );
      }
    });

    it("should log error if hide fails", async () => {
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValue({
        ok: false,
        error: { code: "OPERATION_FAILED", message: "Failed" },
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

        expect(mockNotificationCenter.error).toHaveBeenCalledWith(
          "Failed to hide journal journal-123",
          { code: "OPERATION_FAILED", message: "Failed" },
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

        expect(mockJournalRepository.getById).toHaveBeenCalledWith("journal-123");
        expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
          "Failed to show notification after hiding journal",
          { code: "NOTIFY_ERROR", message: "Notification failed" },
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    it("should use journal ID as fallback if journal entry not found", async () => {
      vi.mocked(mockJournalRepository.getById).mockReturnValue(ok(null));

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

        expect(mockJournalRepository.getById).toHaveBeenCalledWith("journal-123");
        expect(mockPlatformUI.notify).toHaveBeenCalledWith(
          `Journal "journal-123" wurde ausgeblendet`,
          "info"
        );
      }
    });

    it("should use journal ID as fallback if journal entry has no name", async () => {
      vi.mocked(mockJournalRepository.getById).mockReturnValue(
        ok({ id: "journal-123", name: null })
      );

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

    it("should not add menu item if getFlag fails", () => {
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue({
        ok: false,
        error: { code: "ENTITY_NOT_FOUND", message: "Failed" },
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

  describe("DIHideJournalContextMenuHandler", () => {
    it("should instantiate with correct dependencies", () => {
      const diHandler = new DIHideJournalContextMenuHandler(
        mockJournalRepository,
        mockPlatformUI,
        mockNotificationCenter
      );

      expect(diHandler).toBeInstanceOf(HideJournalContextMenuHandler);
    });
  });
});
