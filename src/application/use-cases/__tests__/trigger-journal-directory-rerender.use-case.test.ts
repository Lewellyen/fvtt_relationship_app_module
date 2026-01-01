import { describe, it, expect, vi, beforeEach } from "vitest";
import { TriggerJournalDirectoryReRenderUseCase } from "../trigger-journal-directory-rerender.use-case";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";

describe("TriggerJournalDirectoryReRenderUseCase", () => {
  let mockJournalEvents: PlatformJournalEventPort;
  let mockScheduler: JournalDirectoryRerenderScheduler;
  let mockNotificationCenter: NotificationPublisherPort;
  let useCase: TriggerJournalDirectoryReRenderUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn(),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalDeleted: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockScheduler = {
      requestRerender: vi.fn(),
      cancelPending: vi.fn(),
    } as unknown as JournalDirectoryRerenderScheduler;

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
      mockScheduler,
      mockNotificationCenter
    );
  });

  it("should register onJournalUpdated listener", () => {
    useCase.register();

    expect(mockJournalEvents.onJournalUpdated).toHaveBeenCalled();
  });

  it("should request re-render via scheduler when hidden flag changes", () => {
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

    expect(mockScheduler.requestRerender).toHaveBeenCalledTimes(1);
  });

  it("should not request re-render when other fields change", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-456",
      changes: { name: "New Name" },
      timestamp: Date.now(),
    });

    expect(mockScheduler.requestRerender).not.toHaveBeenCalled();
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
