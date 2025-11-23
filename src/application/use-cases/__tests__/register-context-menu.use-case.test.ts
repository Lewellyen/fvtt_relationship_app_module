import { describe, it, expect, vi, beforeEach } from "vitest";
import { RegisterContextMenuUseCase } from "../register-context-menu.use-case";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";

describe("RegisterContextMenuUseCase", () => {
  let mockJournalEvents: JournalEventPort;
  let mockHideHandler: HideJournalContextMenuHandler;
  let useCase: RegisterContextMenuUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalContextMenu: vi
        .fn()
        .mockReturnValue({ ok: true, value: "registration-123" as EventRegistrationId }),
      unregisterListener: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn(),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
    } as unknown as JournalEventPort;

    mockHideHandler = {
      handle: vi.fn(),
    } as unknown as HideJournalContextMenuHandler;

    useCase = new RegisterContextMenuUseCase(mockJournalEvents, mockHideHandler);
  });

  describe("register", () => {
    it("should register context menu handler", () => {
      const result = useCase.register();

      expect(result.ok).toBe(true);
      expect(mockJournalEvents.onJournalContextMenu).toHaveBeenCalledTimes(1);
      expect(mockJournalEvents.onJournalContextMenu).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should call handler when context menu event is triggered", () => {
      const result = useCase.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockJournalEvents.onJournalContextMenu).mock.calls[0]![0];
      const mockEvent = {
        htmlElement: document.createElement("div"),
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(mockHideHandler.handle).toHaveBeenCalledWith(mockEvent);
    });

    it("should return error if registration fails", () => {
      mockJournalEvents.onJournalContextMenu = vi.fn().mockReturnValue({
        ok: false,
        error: { code: "REGISTRATION_FAILED", message: "Failed to register" },
      });

      const result = useCase.register();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Failed to register");
      }
    });

    it("should store registration ID on success", () => {
      const result = useCase.register();

      expect(result.ok).toBe(true);
      // Registration ID is stored internally, can't directly access it
      // but dispose should work if it's stored
      useCase.dispose();
      expect(mockJournalEvents.unregisterListener).toHaveBeenCalledWith("registration-123");
    });
  });

  describe("dispose", () => {
    it("should unregister listener if registered", () => {
      const registerResult = useCase.register();
      expect(registerResult.ok).toBe(true);

      useCase.dispose();

      expect(mockJournalEvents.unregisterListener).toHaveBeenCalledWith("registration-123");
    });

    it("should not unregister if not registered", () => {
      useCase.dispose();

      expect(mockJournalEvents.unregisterListener).not.toHaveBeenCalled();
    });

    it("should clear registration ID after dispose", () => {
      useCase.register();
      useCase.dispose();

      // Second dispose should not call unregister again
      useCase.dispose();
      expect(mockJournalEvents.unregisterListener).toHaveBeenCalledTimes(1);
    });
  });
});
