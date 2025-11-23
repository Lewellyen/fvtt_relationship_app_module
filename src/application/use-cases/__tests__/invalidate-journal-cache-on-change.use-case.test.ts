import { describe, it, expect, vi, beforeEach } from "vitest";
import { InvalidateJournalCacheOnChangeUseCase } from "../invalidate-journal-cache-on-change.use-case";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";

describe("InvalidateJournalCacheOnChangeUseCase", () => {
  let mockJournalEvents: JournalEventPort;
  let mockCache: CacheService;
  let mockNotificationCenter: NotificationCenter;
  let useCase: InvalidateJournalCacheOnChangeUseCase;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalUpdated: vi.fn().mockReturnValue({ ok: true, value: "2" }),
      onJournalDeleted: vi.fn().mockReturnValue({ ok: true, value: "3" }),
      onJournalDirectoryRendered: vi.fn(),
      onJournalContextMenu: vi.fn().mockReturnValue({ ok: true, value: "4" }),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn().mockReturnValue(5),
    } as unknown as CacheService;

    mockNotificationCenter = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      addChannel: vi.fn(),
    } as unknown as NotificationCenter;

    useCase = new InvalidateJournalCacheOnChangeUseCase(
      mockJournalEvents,
      mockCache,
      mockNotificationCenter
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
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
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

    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
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
    expect(mockNotificationCenter.error).toHaveBeenCalled();
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
    mockCache.invalidateWhere = vi.fn().mockReturnValue(0);

    useCase = new InvalidateJournalCacheOnChangeUseCase(
      mockJournalEvents,
      mockCache,
      mockNotificationCenter
    );

    useCase.register();

    const callback = vi.mocked(mockJournalEvents.onJournalCreated).mock.calls[0]![0];
    callback({ journalId: "journal-123", timestamp: Date.now() });

    expect(mockCache.invalidateWhere).toHaveBeenCalled();
    // debug should not be called when removed === 0
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Invalidated"),
      expect.any(Object),
      expect.any(Object)
    );
  });
});
