import { describe, it, expect, vi, beforeEach } from "vitest";
import { TriggerJournalDirectoryReRenderUseCase } from "../trigger-journal-directory-rerender.use-case";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";

describe("TriggerJournalDirectoryReRenderUseCase", () => {
  let mockJournalEvents: JournalEventPort;
  let mockPlatformUI: PlatformUIPort;
  let mockNotificationCenter: NotificationCenter;
  let useCase: TriggerJournalDirectoryReRenderUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      onJournalContextMenu: vi.fn().mockReturnValue({ ok: true, value: "2" }),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockPlatformUI = {
      rerenderJournalDirectory: vi.fn().mockReturnValue({ ok: true, value: true }),
      removeJournalElement: vi.fn(),
      notify: vi.fn(),
    };

    mockNotificationCenter = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      addChannel: vi.fn(),
    } as unknown as NotificationCenter;

    useCase = new TriggerJournalDirectoryReRenderUseCase(
      mockJournalEvents,
      mockPlatformUI,
      mockNotificationCenter
    );
  });

  it("should register onJournalUpdated listener", () => {
    useCase.register();

    expect(mockJournalEvents.onJournalUpdated).toHaveBeenCalled();
  });

  it("should trigger re-render when hidden flag changes", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-123",
      changes: { flags: { hidden: true } },
      timestamp: Date.now(),
    });

    expect(mockPlatformUI.rerenderJournalDirectory).toHaveBeenCalled();
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Triggered journal directory re-render after hidden flag change",
      expect.objectContaining({ journalId: "journal-123" }),
      expect.any(Object)
    );
  });

  it("should not trigger re-render when other fields change", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-456",
      changes: { name: "New Name" },
      timestamp: Date.now(),
    });

    expect(mockPlatformUI.rerenderJournalDirectory).not.toHaveBeenCalled();
  });

  it("should handle re-render failure gracefully", () => {
    mockPlatformUI.rerenderJournalDirectory = vi.fn().mockReturnValue({
      ok: false,
      error: { code: "API_NOT_AVAILABLE", message: "UI not ready" },
    });

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-789",
      changes: { flags: { hidden: false } },
      timestamp: Date.now(),
    });

    expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
      "Failed to re-render journal directory after hidden flag change",
      expect.objectContaining({ code: "API_NOT_AVAILABLE" }),
      expect.any(Object)
    );
  });

  it("should not log debug when re-render returns false", () => {
    mockPlatformUI.rerenderJournalDirectory = vi.fn().mockReturnValue({ ok: true, value: false });

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-999",
      changes: { flags: { hidden: true } },
      timestamp: Date.now(),
    });

    expect(mockPlatformUI.rerenderJournalDirectory).toHaveBeenCalled();
    expect(mockNotificationCenter.debug).not.toHaveBeenCalled();
  });

  it("should handle registration errors gracefully", () => {
    mockJournalEvents.onJournalUpdated = vi
      .fn()
      .mockReturnValue({ ok: false, error: { code: "TEST_ERROR", message: "Test error" } });

    const result = useCase.register();

    expect(result.ok).toBe(false);
  });

  it("should cleanup listener on dispose", () => {
    useCase.register();
    useCase.dispose();

    expect(mockJournalEvents.unregisterListener).toHaveBeenCalledWith("1");
  });

  it("should handle dispose when not registered", () => {
    // Should not throw
    expect(() => useCase.dispose()).not.toThrow();
  });
});
