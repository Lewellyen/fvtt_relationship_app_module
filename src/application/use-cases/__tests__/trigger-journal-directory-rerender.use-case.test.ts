import { describe, it, expect, vi, beforeEach } from "vitest";
import { TriggerJournalDirectoryReRenderUseCase } from "../trigger-journal-directory-rerender.use-case";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";

describe("TriggerJournalDirectoryReRenderUseCase", () => {
  let mockJournalEvents: PlatformJournalEventPort;
  let mockJournalDirectoryUI: PlatformJournalDirectoryUiPort;
  let mockNotificationCenter: NotificationPublisherPort;
  let useCase: TriggerJournalDirectoryReRenderUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockJournalDirectoryUI = {
      rerenderJournalDirectory: vi.fn().mockReturnValue({ ok: true, value: true }),
      removeJournalElement: vi.fn(),
    };

    mockNotificationCenter = {
      debug: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      error: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      info: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      warn: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      addChannel: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      removeChannel: vi.fn().mockReturnValue({ ok: true, value: false }),
      getChannelNames: vi.fn().mockReturnValue({ ok: true, value: [] }),
    } as unknown as NotificationPublisherPort;

    useCase = new TriggerJournalDirectoryReRenderUseCase(
      mockJournalEvents,
      mockJournalDirectoryUI,
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
      changes: {
        flags: {
          [MODULE_METADATA.ID]: {
            [DOMAIN_FLAGS.HIDDEN]: true,
          },
        },
      },
      timestamp: Date.now(),
    });

    expect(mockJournalDirectoryUI.rerenderJournalDirectory).toHaveBeenCalled();
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

    expect(mockJournalDirectoryUI.rerenderJournalDirectory).not.toHaveBeenCalled();
  });

  it("should handle re-render failure gracefully", () => {
    mockJournalDirectoryUI.rerenderJournalDirectory = vi.fn().mockReturnValue({
      ok: false,
      error: { code: "API_NOT_AVAILABLE", message: "UI not ready" },
    });

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-789",
      changes: {
        flags: {
          [MODULE_METADATA.ID]: {
            [DOMAIN_FLAGS.HIDDEN]: false,
          },
        },
      },
      timestamp: Date.now(),
    });

    expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
      "Failed to re-render journal directory after hidden flag change",
      expect.objectContaining({ code: "API_NOT_AVAILABLE" }),
      expect.any(Object)
    );
  });

  it("should not log debug when re-render returns false", () => {
    mockJournalDirectoryUI.rerenderJournalDirectory = vi
      .fn()
      .mockReturnValue({ ok: true, value: false });

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-999",
      changes: {
        flags: {
          [MODULE_METADATA.ID]: {
            [DOMAIN_FLAGS.HIDDEN]: true,
          },
        },
      },
      timestamp: Date.now(),
    });

    expect(mockJournalDirectoryUI.rerenderJournalDirectory).toHaveBeenCalled();
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
