import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessJournalDirectoryOnRenderUseCase } from "../process-journal-directory-on-render.use-case";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";

describe("ProcessJournalDirectoryOnRenderUseCase", () => {
  let mockJournalEvents: JournalEventPort;
  let mockJournalVisibility: JournalVisibilityService;
  let mockNotificationCenter: NotificationCenter;
  let useCase: ProcessJournalDirectoryOnRenderUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn(),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockJournalVisibility = {
      processJournalDirectory: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    mockNotificationCenter = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      addChannel: vi.fn(),
    } as unknown as NotificationCenter;

    useCase = new ProcessJournalDirectoryOnRenderUseCase(
      mockJournalEvents,
      mockJournalVisibility,
      mockNotificationCenter
    );
  });

  it("should register journal directory rendered listener", () => {
    useCase.register();

    expect(mockJournalEvents.onJournalDirectoryRendered).toHaveBeenCalled();
  });

  it("should process journal directory when rendered", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalDirectoryRendered).mock.calls[0]![0];
    const mockElement = document.createElement("div");
    callback({ htmlElement: mockElement, timestamp: Date.now() });

    expect(mockJournalVisibility.processJournalDirectory).toHaveBeenCalledWith(mockElement);
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Journal directory rendered, processing visibility",
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle processing errors gracefully", () => {
    mockJournalVisibility.processJournalDirectory = vi
      .fn()
      .mockReturnValue({ ok: false, error: { code: "TEST_ERROR", message: "Test error" } });

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalDirectoryRendered).mock.calls[0]![0];
    const mockElement = document.createElement("div");
    callback({ htmlElement: mockElement, timestamp: Date.now() });

    expect(mockNotificationCenter.error).toHaveBeenCalledWith(
      "Failed to process journal directory",
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle registration failure", () => {
    mockJournalEvents.onJournalDirectoryRendered = vi
      .fn()
      .mockReturnValue({ ok: false, error: { code: "TEST_ERROR", message: "Test error" } });

    const result = useCase.register();

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Test error");
    }
  });

  it("should cleanup listener on dispose", () => {
    useCase.register();
    useCase.dispose();

    expect(mockJournalEvents.unregisterListener).toHaveBeenCalledWith("1");
  });

  it("should handle multiple dispose calls gracefully", () => {
    useCase.register();
    useCase.dispose();
    useCase.dispose(); // Should not throw

    // Should only call unregister once
    expect(mockJournalEvents.unregisterListener).toHaveBeenCalledTimes(1);
  });
});
