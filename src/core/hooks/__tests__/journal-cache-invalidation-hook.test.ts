/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { JournalCacheInvalidationHook } from "../journal-cache-invalidation-hook";
import { ok } from "@/utils/functional/result";
import type { CacheService } from "@/interfaces/cache";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";

describe("JournalCacheInvalidationHook", () => {
  it("registers Foundry hooks and invalidates cache", () => {
    const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
      on: vi
        .fn()
        .mockReturnValueOnce(ok(11))
        .mockReturnValueOnce(ok(22))
        .mockReturnValueOnce(ok(33)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    const mockCache: CacheService = {
      isEnabled: true,
      size: 0,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn().mockReturnValue(0),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    };

    const mockNotificationCenter: NotificationCenter = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn(),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel"]),
    } as unknown as NotificationCenter;

    mockCache.invalidateWhere = vi.fn().mockReturnValueOnce(2);
    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter
    );

    const result = hook.register({} as never);
    expect(result.ok).toBe(true);
    expect(mockHooks.on).toHaveBeenCalledTimes(3);

    const [, callback] = mockHooks.on.mock.calls[0]!;
    callback();

    expect(mockCache.invalidateWhere).toHaveBeenCalledWith(expect.any(Function));
    const predicate = (mockCache.invalidateWhere as unknown as Mock).mock.calls[0]![0];
    expect(predicate({ tags: ["journal:hidden"] } as never)).toBe(true);
    expect(predicate({ tags: [] } as never)).toBe(false);
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("hidden journal cache entries"),
      expect.any(Object),
      { channels: ["ConsoleChannel"] }
    );
  });

  it("logs and propagates registration errors", () => {
    const failingHooks: Pick<FoundryHooks, "on" | "off"> = {
      on: vi.fn().mockReturnValueOnce({ ok: false as const, error: { message: "boom" } }),
      off: vi.fn(),
    };

    const mockCache: CacheService = {
      isEnabled: true,
      size: 0,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn().mockReturnValue(0),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    };

    const mockNotificationCenter: NotificationCenter = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn(),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel"]),
    } as unknown as NotificationCenter;

    const hook = new JournalCacheInvalidationHook(
      failingHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter
    );

    const result = hook.register({} as never);

    expect(result.ok).toBe(false);
    expect(mockNotificationCenter.error).toHaveBeenCalledWith(
      expect.stringContaining("createJournalEntry"),
      expect.objectContaining({ message: "boom" }),
      { channels: ["ConsoleChannel"] }
    );
  });

  it("unregisters hooks on dispose", () => {
    const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
      on: vi
        .fn()
        .mockReturnValueOnce(ok(11))
        .mockReturnValueOnce(ok(22))
        .mockReturnValueOnce(ok(33)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    const mockCache: CacheService = {
      isEnabled: true,
      size: 0,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn().mockReturnValue(0),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    };

    const mockNotificationCenter: NotificationCenter = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn(),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel"]),
    } as unknown as NotificationCenter;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter
    );

    hook.register({} as never);
    hook.dispose();

    expect(mockHooks.off).toHaveBeenCalledWith("createJournalEntry", 11);
    expect(mockHooks.off).toHaveBeenCalledWith("updateJournalEntry", 22);
    expect(mockHooks.off).toHaveBeenCalledWith("deleteJournalEntry", 33);
  });

  it("disposes safely when register was never called", () => {
    const mockHooks: Pick<FoundryHooks, "on" | "off"> = {
      on: vi.fn().mockReturnValue(ok(11)),
      off: vi.fn().mockReturnValue(ok(undefined)),
    };

    const mockCache: CacheService = {
      isEnabled: true,
      size: 0,
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      has: vi.fn(),
      clear: vi.fn(),
      invalidateWhere: vi.fn().mockReturnValue(0),
      getMetadata: vi.fn(),
      getStatistics: vi.fn(),
      getOrSet: vi.fn(),
    };

    const mockNotificationCenter: NotificationCenter = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn(),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel"]),
    } as unknown as NotificationCenter;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter
    );
    expect(() => hook.dispose()).not.toThrow();
  });
});
