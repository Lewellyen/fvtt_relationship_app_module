import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ProcessJournalDirectoryOnRenderUseCase,
  DIProcessJournalDirectoryOnRenderUseCase,
} from "../process-journal-directory-on-render.use-case";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";

describe("ProcessJournalDirectoryOnRenderUseCase", () => {
  let mockJournalEvents: PlatformJournalEventPort;
  let mockJournalVisibility: JournalVisibilityService;
  let mockNotificationCenter: PlatformNotificationPort;
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
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      addChannel: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeChannel: vi.fn().mockReturnValue({ ok: true, value: false }),
      getChannelNames: vi.fn().mockReturnValue({ ok: true, value: [] }),
    } as unknown as PlatformNotificationPort;

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

  it("should handle dispose without register gracefully", () => {
    // Should not throw when disposing without registering
    expect(() => useCase.dispose()).not.toThrow();
    expect(mockJournalEvents.unregisterListener).not.toHaveBeenCalled();
  });
});

describe("DIProcessJournalDirectoryOnRenderUseCase", () => {
  let mockJournalEvents: PlatformJournalEventPort;
  let mockJournalVisibility: JournalVisibilityService;
  let mockNotificationCenter: PlatformNotificationPort;
  let useCase: DIProcessJournalDirectoryOnRenderUseCase;

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
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      addChannel: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeChannel: vi.fn().mockReturnValue({ ok: true, value: false }),
      getChannelNames: vi.fn().mockReturnValue({ ok: true, value: [] }),
    } as unknown as PlatformNotificationPort;

    useCase = new DIProcessJournalDirectoryOnRenderUseCase(
      mockJournalEvents,
      mockJournalVisibility,
      mockNotificationCenter
    );
  });

  it("should have correct dependencies", () => {
    expect(DIProcessJournalDirectoryOnRenderUseCase.dependencies).toBeDefined();
    expect(DIProcessJournalDirectoryOnRenderUseCase.dependencies.length).toBe(3);
  });

  it("should work like base class", () => {
    const result = useCase.register();
    expect(result.ok).toBe(true);
    expect(mockJournalEvents.onJournalDirectoryRendered).toHaveBeenCalled();
  });
});
