import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RegisterContextMenuUseCase,
  DIRegisterContextMenuUseCase,
} from "../register-context-menu.use-case";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";

describe("RegisterContextMenuUseCase", () => {
  let mockContextMenuLibWrapperService: JournalContextMenuLibWrapperService;
  let mockHideHandler: HideJournalContextMenuHandler;
  let useCase: RegisterContextMenuUseCase;

  beforeEach(() => {
    mockContextMenuLibWrapperService = {
      addCallback: vi.fn(),
      removeCallback: vi.fn(),
      register: vi.fn(),
      dispose: vi.fn(),
    } as unknown as JournalContextMenuLibWrapperService;

    mockHideHandler = {
      handle: vi.fn(),
    } as unknown as HideJournalContextMenuHandler;

    useCase = new RegisterContextMenuUseCase(mockContextMenuLibWrapperService, mockHideHandler);
  });

  describe("register", () => {
    it("should register callback with libWrapper service", () => {
      const result = useCase.register();

      expect(result.ok).toBe(true);
      expect(mockContextMenuLibWrapperService.addCallback).toHaveBeenCalledTimes(1);
      expect(mockContextMenuLibWrapperService.addCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it("should call handler when context menu event is triggered", () => {
      const result = useCase.register();
      expect(result.ok).toBe(true);

      const callback = vi.mocked(mockContextMenuLibWrapperService.addCallback).mock
        .calls[0]![0] as (event: JournalContextMenuEvent) => void;
      const mockEvent: JournalContextMenuEvent = {
        htmlElement: document.createElement("div"),
        options: [],
        timestamp: Date.now(),
      };

      callback(mockEvent);

      expect(mockHideHandler.handle).toHaveBeenCalledWith(mockEvent);
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

      expect(mockContextMenuLibWrapperService.removeCallback).toHaveBeenCalledTimes(1);
      expect(mockContextMenuLibWrapperService.removeCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it("should not remove callback if not registered", () => {
      useCase.dispose();

      expect(mockContextMenuLibWrapperService.removeCallback).not.toHaveBeenCalled();
    });

    it("should clear callback after dispose", () => {
      useCase.register();
      useCase.dispose();

      // Second dispose should not call removeCallback again
      useCase.dispose();
      expect(mockContextMenuLibWrapperService.removeCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("DIRegisterContextMenuUseCase", () => {
    it("should instantiate with correct dependencies", () => {
      const diUseCase = new DIRegisterContextMenuUseCase(
        mockContextMenuLibWrapperService,
        mockHideHandler
      );

      expect(diUseCase).toBeInstanceOf(RegisterContextMenuUseCase);
    });
  });
});
