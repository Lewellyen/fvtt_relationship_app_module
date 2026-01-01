import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvalidateJournalCacheOnChangeUseCase } from "../invalidate-journal-cache-on-change.use-case";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok } from "@/domain/utils/result";

describe("InvalidateJournalCacheOnChangeUseCase", () => {
  let mockJournalEvents: PlatformJournalEventPort;
  let mockCache: CacheInvalidationPort;
  let mockNotifications: NotificationPublisherPort;
  let useCase: InvalidateJournalCacheOnChangeUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "2" }),
      onJournalDeleted: vi.fn().mockReturnValue({ ok: true, value: "3" }),
      unregisterListener: vi.fn(),
    };

    mockCache = {
      invalidateWhere: vi.fn().mockReturnValue(5),
    } as unknown as CacheInvalidationPort;

    mockNotifications = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn().mockReturnValue(ok(undefined)),
      removeChannel: vi.fn().mockReturnValue(ok(true)),
      getChannelNames: vi.fn().mockReturnValue(ok([])),
    } as unknown as NotificationPublisherPort;

    useCase = new InvalidateJournalCacheOnChangeUseCase(
      mockJournalEvents,
      mockCache,
      mockNotifications
    );
  });

  it("should register all journal event listeners", () => {
    useCase.register();

    expect(mockJournalEvents.onJournalCreated).toHaveBeenCalled();
    expect(mockJournalEvents.onJournalUpdated).toHaveBeenCalled();
    expect(mockJournalEvents.onJournalDeleted).toHaveBeenCalled();
  });

  it("should invalidate cache when journal is created", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalCreated).mock.calls[0]![0];
    callback({ journalId: "journal-123", timestamp: Date.now() });

    expect(mockCache.invalidateWhere).toHaveBeenCalled();
    expect(mockNotifications.debug).toHaveBeenCalledWith(
      expect.stringContaining("Invalidated"),
      expect.objectContaining({ journalId: "journal-123" }),
      expect.any(Object)
    );
  });

  it("should invalidate cache when journal is updated", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-456",
      changes: { name: "New Name" },
      timestamp: Date.now(),
    });

    expect(mockCache.invalidateWhere).toHaveBeenCalled();
  });

  it("should trigger UI update when hidden flag changes", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalUpdated).mock.calls[0]![0];
    callback({
      journalId: "journal-789",
      changes: { flags: { hidden: true } },
      timestamp: Date.now(),
    });

    expect(mockNotifications.debug).toHaveBeenCalledWith(
      "Journal hidden flag changed, UI update needed",
      expect.objectContaining({ journalId: "journal-789" }),
      expect.any(Object)
    );
  });

  it("should invalidate cache when journal is deleted", () => {
    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalDeleted).mock.calls[0]![0];
    callback({ journalId: "journal-999", timestamp: Date.now() });

    expect(mockCache.invalidateWhere).toHaveBeenCalled();
  });

  it("should handle registration errors gracefully", () => {
    mockJournalEvents.onJournalCreated = vi
      .fn()
      .mockReturnValue({ ok: false, error: { code: "TEST_ERROR", message: "Test error" } });

    const result = useCase.register();

    expect(result.ok).toBe(false);
    expect(mockNotifications.error).toHaveBeenCalled();
  });

  it("should cleanup listeners on dispose", () => {
    useCase.register();
    useCase.dispose();

    expect(mockJournalEvents.unregisterListener).toHaveBeenCalledTimes(3);
  });

  it("should dispose on registration error to prevent partial registration", () => {
    // First registration succeeds, second fails
    mockJournalEvents.onJournalCreated = vi.fn().mockReturnValue({ ok: true, value: "1" });
    mockJournalEvents.onJournalUpdated = vi
      .fn()
      .mockReturnValue({ ok: false, error: { code: "TEST_ERROR", message: "Test error" } });

    const result = useCase.register();

    expect(result.ok).toBe(false);
    // Should have unregistered the successful registration
    expect(mockJournalEvents.unregisterListener).toHaveBeenCalled();
  });

  it("should not log debug message when no cache entries were invalidated", () => {
    // Mock cache to return 0 removed entries
    const mockCacheZero = {
      invalidateWhere: vi.fn().mockReturnValue(0),
    } as unknown as CacheInvalidationPort;

    useCase = new InvalidateJournalCacheOnChangeUseCase(
      mockJournalEvents,
      mockCacheZero,
      mockNotifications
    );

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalCreated).mock.calls[0]![0];
    callback({ journalId: "journal-123", timestamp: Date.now() });

    expect(mockCacheZero.invalidateWhere).toHaveBeenCalled();
    // debug should not be called when removed === 0
    expect(mockNotifications.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Invalidated"),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
