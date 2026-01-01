import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { JournalDirectoryRerenderScheduler } from "../JournalDirectoryRerenderScheduler";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok } from "@/domain/utils/result";

describe("JournalDirectoryRerenderScheduler", () => {
  let scheduler: JournalDirectoryRerenderScheduler;
  let mockJournalDirectoryUI: PlatformJournalDirectoryUiPort;
  let mockNotifications: NotificationPublisherPort;
  let rerenderSpy: Mock;

  beforeEach(() => {
    vi.useFakeTimers();
    rerenderSpy = vi.fn(() => ok(true));
    mockJournalDirectoryUI = {
      rerenderJournalDirectory: rerenderSpy,
      removeJournalDirectoryEntry: vi.fn(() => ok(undefined)),
    } as unknown as PlatformJournalDirectoryUiPort;

    mockNotifications = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as NotificationPublisherPort;

    scheduler = new JournalDirectoryRerenderScheduler(mockJournalDirectoryUI, mockNotifications);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("requestRerender", () => {
    it("should debounce multiple rapid requests into a single re-render", async () => {
      // Make multiple rapid requests
      scheduler.requestRerender();
      scheduler.requestRerender();
      scheduler.requestRerender();

      // No re-render should have occurred yet
      expect(rerenderSpy).not.toHaveBeenCalled();

      // Advance time by 100ms (debounce delay)
      vi.advanceTimersByTime(100);

      // Should have been called exactly once
      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    });

    it("should reset debounce timer on each new request", async () => {
      scheduler.requestRerender();
      vi.advanceTimersByTime(50); // Halfway through debounce

      scheduler.requestRerender(); // Reset timer
      expect(rerenderSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50); // Still not enough time
      expect(rerenderSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50); // Now 100ms since last request
      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    });

    it("should execute re-render after debounce delay", async () => {
      scheduler.requestRerender();

      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        "Triggered journal directory re-render (debounced)",
        {},
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle multiple separate requests correctly", async () => {
      scheduler.requestRerender();
      vi.advanceTimersByTime(100);
      expect(rerenderSpy).toHaveBeenCalledTimes(1);

      scheduler.requestRerender();
      vi.advanceTimersByTime(100);
      expect(rerenderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("cancelPending", () => {
    it("should cancel pending re-render", async () => {
      scheduler.requestRerender();
      scheduler.cancelPending();

      vi.advanceTimersByTime(100);

      expect(rerenderSpy).not.toHaveBeenCalled();
    });

    it("should handle cancel when no pending re-render", () => {
      // Should not throw
      expect(() => scheduler.cancelPending()).not.toThrow();
    });

    it("should allow new requests after cancellation", async () => {
      scheduler.requestRerender();
      scheduler.cancelPending();

      scheduler.requestRerender();
      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should handle re-render errors gracefully", async () => {
      const error = { code: "ERROR", message: "Re-render failed" };
      rerenderSpy.mockReturnValue({ ok: false, error });

      scheduler.requestRerender();
      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        "Failed to re-render journal directory",
        error,
        { channels: ["ConsoleChannel"] }
      );
      expect(mockNotifications.debug).not.toHaveBeenCalled();
    });

    it("should not log debug message when re-render returns false", async () => {
      rerenderSpy.mockReturnValue(ok(false));

      scheduler.requestRerender();
      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
      expect(mockNotifications.debug).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle very rapid requests", async () => {
      // Make 10 requests in quick succession
      for (let i = 0; i < 10; i++) {
        scheduler.requestRerender();
      }

      expect(rerenderSpy).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle requests with varying delays", async () => {
      scheduler.requestRerender();
      vi.advanceTimersByTime(30);

      scheduler.requestRerender();
      vi.advanceTimersByTime(30);

      scheduler.requestRerender();
      vi.advanceTimersByTime(100);

      expect(rerenderSpy).toHaveBeenCalledTimes(1);
    });
  });
});
