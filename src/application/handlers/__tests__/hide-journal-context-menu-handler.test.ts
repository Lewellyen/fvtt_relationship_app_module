import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  HideJournalContextMenuHandler,
  DIHideJournalContextMenuHandler,
} from "../hide-journal-context-menu-handler";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { ok } from "@/domain/utils/result";

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
    getFlag: vi.fn().mockReturnValue(ok(false)),
    setFlag: vi.fn().mockResolvedValue(ok(undefined)),
    unsetFlag: vi.fn().mockResolvedValue(ok(undefined)),
  } as unknown as PlatformJournalRepository;
}

describe("HideJournalContextMenuHandler", () => {
  let mockJournalRepository: PlatformJournalRepository;
  let mockPlatformUI: PlatformUIPort;
  let mockNotificationCenter: NotificationPublisherPort;
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
    } as unknown as NotificationPublisherPort;

    handler = new HideJournalContextMenuHandler(
      mockJournalRepository,
      mockPlatformUI,
      mockNotificationCenter
    );
  });

  describe("handle", () => {
    it("should not add menu item if no journal ID found", () => {
      const event: JournalContextMenuEvent = {
        journalId: "",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
      expect(mockJournalRepository.getFlag).not.toHaveBeenCalled();
    });

    it("should add menu item even if already exists (duplicates are handled by JournalContextMenuLibWrapperService)", () => {
      // WICHTIG: Die Prüfung auf existingItem wurde entfernt, da der JournalContextMenuLibWrapperService
      // die alten Einträge entfernt, bevor neue hinzugefügt werden. Der Handler fügt daher
      // den Eintrag hinzu, auch wenn bereits einer existiert.
      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [{ name: "Journal ausblenden", icon: "<i></i>", callback: vi.fn() }],
        timestamp: Date.now(),
      };

      handler.handle(event);

      // Der Handler fügt den Eintrag hinzu (der Service entfernt Duplikate)
      expect(event.options.length).toBeGreaterThanOrEqual(1);
      // Prüfe, ob der neue Eintrag hinzugefügt wurde
      const newItem = event.options.find((item) => item.name === "Journal ausblenden");
      expect(newItem).toBeDefined();
      expect(mockJournalRepository.getFlag).toHaveBeenCalled();
    });

    it("should not add menu item if journal is already hidden", () => {
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
      expect(mockJournalRepository.getFlag).toHaveBeenCalledWith(
        "journal-123",
        MODULE_METADATA.ID,
        DOMAIN_FLAGS.HIDDEN
      );
    });

    it("should add menu item if journal is not hidden", () => {
      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
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
        MODULE_METADATA.ID,
        DOMAIN_FLAGS.HIDDEN
      );
    });

    it("should use journalId from event", () => {
      const event: JournalContextMenuEvent = {
        journalId: "journal-456",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(mockJournalRepository.getFlag).toHaveBeenCalledWith(
        "journal-456",
        MODULE_METADATA.ID,
        DOMAIN_FLAGS.HIDDEN
      );
    });

    it("should hide journal when callback is executed", async () => {
      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      expect(callback).toBeDefined();
      if (callback) {
        await callback("journal-123");

        expect(mockJournalRepository.setFlag).toHaveBeenCalledWith(
          "journal-123",
          MODULE_METADATA.ID,
          DOMAIN_FLAGS.HIDDEN,
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

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        await callback("journal-123");

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

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        await callback("journal-123");

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

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        await callback("journal-123");

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

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        await callback("journal-123");

        expect(mockPlatformUI.notify).toHaveBeenCalledWith(
          `Journal "journal-123" wurde ausgeblendet`,
          "info"
        );
      }
    });

    it("should log debug message after successful hide", async () => {
      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      if (callback) {
        await callback("journal-123");

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

      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      expect(event.options).toHaveLength(0);
    });

    it("should log error and return early if journalIdParam does not match eventJournalId (coverage for lines 58-72)", async () => {
      const event: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      handler.handle(event);

      const callback = event.options[0]?.callback;
      expect(callback).toBeDefined();
      if (callback) {
        // Call callback with different journalId to trigger validation error
        await callback("journal-456"); // Different from event.journalId

        expect(mockNotificationCenter.error).toHaveBeenCalledWith(
          "Journal ID mismatch in context menu callback: expected journal-123, got journal-456",
          {
            code: "JOURNAL_ID_MISMATCH",
            message: "Expected journalId journal-123 but received journal-456",
            details: {
              expectedJournalId: "journal-123",
              receivedJournalId: "journal-456",
            },
          },
          { channels: ["ConsoleChannel"] }
        );

        // Verify that setFlag was NOT called (early return)
        expect(mockJournalRepository.setFlag).not.toHaveBeenCalled();
      }
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
