import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RegisterContextMenuUseCase,
  DIRegisterContextMenuUseCase,
} from "../register-context-menu.use-case";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";

describe("RegisterContextMenuUseCase", () => {
  let mockContextMenuRegistration: PlatformContextMenuRegistrationPort;
  let mockHandlers: JournalContextMenuHandler[];
  let mockLogger: Logger;
  let useCase: RegisterContextMenuUseCase;

  beforeEach(() => {
    mockContextMenuRegistration = {
      addCallback: vi.fn(),
      removeCallback: vi.fn(),
    } as unknown as PlatformContextMenuRegistrationPort;

    const mockHandler: JournalContextMenuHandler = {
      handle: vi.fn(),
    };
    mockHandlers = [mockHandler];

    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    useCase = new RegisterContextMenuUseCase(mockContextMenuRegistration, mockHandlers, mockLogger);
  });

  describe("register", () => {
    it("should register callback with context menu registration port", () => {
      const result = useCase.register();

      expect(result.ok).toBe(true);
      expect(mockContextMenuRegistration.addCallback).toHaveBeenCalledTimes(1);
      expect(mockContextMenuRegistration.addCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should call handler when context menu event is triggered", () => {
      const result = useCase.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockContextMenuRegistration.addCallback).mock.calls[0]![0] as (
        event: JournalContextMenuEvent
      ) => void;
      const mockEvent: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(mockHandlers[0]!.handle).toHaveBeenCalledWith(mockEvent);
    });

    it("should call all handlers when context menu event is triggered", () => {
      const handler1: JournalContextMenuHandler = { handle: vi.fn() };
      const handler2: JournalContextMenuHandler = { handle: vi.fn() };
      const handlers = [handler1, handler2];
      const useCaseWithMultipleHandlers = new RegisterContextMenuUseCase(
        mockContextMenuRegistration,
        handlers,
        mockLogger
      );

      const result = useCaseWithMultipleHandlers.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockContextMenuRegistration.addCallback).mock.calls[0]![0] as (
        event: JournalContextMenuEvent
      ) => void;
      const mockEvent: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(handler1.handle).toHaveBeenCalledWith(mockEvent);
      expect(handler2.handle).toHaveBeenCalledWith(mockEvent);
    });

    it("should continue with next handler when one handler throws", () => {
      const handler1: JournalContextMenuHandler = {
        handle: vi.fn().mockImplementation(() => {
          throw new Error("Handler 1 error");
        }),
      };
      const handler2: JournalContextMenuHandler = { handle: vi.fn() };
      const handlers = [handler1, handler2];
      const useCaseWithErrorHandler = new RegisterContextMenuUseCase(
        mockContextMenuRegistration,
        handlers,
        mockLogger
      );

      const result = useCaseWithErrorHandler.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockContextMenuRegistration.addCallback).mock.calls[0]![0] as (
        event: JournalContextMenuEvent
      ) => void;
      const mockEvent: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(handler1.handle).toHaveBeenCalledWith(mockEvent);
      expect(handler2.handle).toHaveBeenCalledWith(mockEvent);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Context menu handler failed"),
        expect.any(Object)
      );
    });

    it("should handle non-Error exceptions", () => {
      const handler1: JournalContextMenuHandler = {
        handle: vi.fn().mockImplementation(() => {
          throw "String error"; // Not an Error instance
        }),
      };
      const handler2: JournalContextMenuHandler = { handle: vi.fn() };
      const handlers = [handler1, handler2];
      const useCaseWithNonErrorException = new RegisterContextMenuUseCase(
        mockContextMenuRegistration,
        handlers,
        mockLogger
      );

      const result = useCaseWithNonErrorException.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockContextMenuRegistration.addCallback).mock.calls[0]![0] as (
        event: JournalContextMenuEvent
      ) => void;
      const mockEvent: JournalContextMenuEvent = {
        journalId: "journal-123",
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(handler1.handle).toHaveBeenCalledWith(mockEvent);
      expect(handler2.handle).toHaveBeenCalledWith(mockEvent);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Context menu handler failed"),
        expect.objectContaining({
          error: expect.any(Error),
          handler: expect.any(String),
        })
      );
    });

    it("should always return success", () => {
      const result = useCase.register();

      expect(result.ok).toBe(true);
    });
  });

  describe("dispose", () => {
    it("should remove callback if registered", () => {
      const registerResult = useCase.register();
      expect(registerResult.ok).toBe(true);

      useCase.dispose();

      expect(mockContextMenuRegistration.removeCallback).toHaveBeenCalledTimes(1);
      expect(mockContextMenuRegistration.removeCallback).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should not remove callback if not registered", () => {
      useCase.dispose();

      expect(mockContextMenuRegistration.removeCallback).not.toHaveBeenCalled();
    });

    it("should clear callback after dispose", () => {
      useCase.register();
      useCase.dispose();

      // Second dispose should not call removeCallback again
      useCase.dispose();
      expect(mockContextMenuRegistration.removeCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("DIRegisterContextMenuUseCase", () => {
    it("should instantiate with correct dependencies", () => {
      const diUseCase = new DIRegisterContextMenuUseCase(
        mockContextMenuRegistration,
        mockHandlers,
        mockLogger
      );

      expect(diUseCase).toBeInstanceOf(RegisterContextMenuUseCase);
    });
  });
});
