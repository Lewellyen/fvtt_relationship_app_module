/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-deprecated */

// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import {
  JournalCacheInvalidationHook,
  DIJournalCacheInvalidationHook,
} from "@/application/use-cases/journal-cache-invalidation-hook";
import { ok } from "@/infrastructure/shared/utils/result";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";

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
    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      failingHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );
    expect(() => hook.dispose()).not.toThrow();
  });

  it("should not log debug message when no cache entries are invalidated", () => {
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
      invalidateWhere: vi.fn().mockReturnValue(0), // No entries invalidated
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    const result = hook.register({} as never);
    expect(result.ok).toBe(true);
    expect(mockHooks.on).toHaveBeenCalledTimes(3);

    // Trigger the hook callback
    const [, callback] = mockHooks.on.mock.calls[0]!;
    callback();

    // Verify invalidateWhere was called
    expect(mockCache.invalidateWhere).toHaveBeenCalledWith(expect.any(Function));

    // Verify debug was NOT called because removed === 0
    expect(mockNotificationCenter.debug).not.toHaveBeenCalled();
  });

  it("should handle updateJournalEntry hook with hidden flag changed", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with journal entry that has hidden flag
    const mockEntry = {
      id: "test-entry-123",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI with journal app
    const mockJournalApp = {
      id: "journal",
      render: vi.fn(),
      constructor: { name: "JournalDirectory" },
    };
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      sidebar: {
        tabs: {
          journal: mockJournalApp,
        },
      },
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    const result = hook.register({} as never);
    expect(result.ok).toBe(true);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;
    expect(updateCallback).toBeDefined();

    // Call with entry argument
    updateCallback!({ id: "test-entry-123" });

    // Verify flag was checked
    expect(mockJournal.get).toHaveBeenCalledWith("test-entry-123");
    expect(mockEntry.getFlag).toHaveBeenCalled();

    // Verify re-render was triggered
    expect(mockJournalApp.render).toHaveBeenCalledWith(false);
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
  });

  it("should handle getEntryFromHookArgs with array argument", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object - flag must be set (true or false) for checkHiddenFlagChanged to return true
    const mockEntry = {
      id: "test-entry-456",
      getFlag: vi.fn().mockReturnValue(true), // Flag is set, so checkHiddenFlagChanged will return true
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with array argument (Foundry sometimes passes arrays)
    // The structure: args[0] is an array containing the entry
    // So we pass an array as first argument: [{ id: "test-entry-456" }]
    updateCallback!([{ id: "test-entry-456" }] as any);

    // Verify entry was extracted from array and flag was checked
    expect(mockJournal.get).toHaveBeenCalledWith("test-entry-456");
    expect(mockEntry.getFlag).toHaveBeenCalled();

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle checkHiddenFlagChanged when game.journal is missing", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object without journal
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: undefined,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-nojournal" });

    // Should not throw or call rerenderJournalDirectory
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle checkHiddenFlagChanged when entry is not found", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with journal that returns null
    const mockJournal = {
      get: vi.fn().mockReturnValue(null), // Entry not found
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-notfound" });

    // Should not throw or call rerenderJournalDirectory
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle checkHiddenFlagChanged error cases", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object that throws error
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: {
        get: vi.fn().mockImplementation(() => {
          throw new Error("Test error");
        }),
      },
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with entry that will cause error
    updateCallback!({ id: "test-entry-error" });

    // Verify error was logged
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Failed to check hidden flag",
      expect.objectContaining({ error: expect.any(String), entryId: "test-entry-error" }),
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getHiddenFlagValue when game.journal is missing", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object - first call returns true (checkHiddenFlagChanged), then journal becomes undefined
    let callCount = 0;
    const mockEntry = {
      id: "test-entry-nojournal",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockEntry; // First call in checkHiddenFlagChanged
        }
        return null; // Second call in getHiddenFlagValue - entry not found
      }),
    };
    const originalGame = (globalThis as any).game;
    // Use a Proxy to dynamically change journal to undefined after checkHiddenFlagChanged
    let journalValue: any = mockJournal;
    (globalThis as any).game = new Proxy(
      {
        get journal() {
          // After first call to checkHiddenFlagChanged, return undefined for getHiddenFlagValue
          if (callCount >= 1) {
            journalValue = undefined;
          }
          return journalValue;
        },
      },
      {
        get(target, prop) {
          if (prop === "journal") {
            return target.journal;
          }
          return (target as any)[prop];
        },
      }
    );

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-nojournal" });

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle checkHiddenFlagChanged when entry has no getFlag method", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with entry that has no getFlag method
    const mockEntry = {
      id: "test-entry-no-getflag",
      // No getFlag method
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-no-getflag" });

    // Should not throw or call rerenderJournalDirectory (checkHiddenFlagChanged returns false)
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getHiddenFlagValue when entry has no getFlag method", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with entry that has no getFlag method
    const mockEntry = {
      id: "test-entry-no-getflag",
      // No getFlag method
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // First, set up a scenario where checkHiddenFlagChanged returns true
    // but then getHiddenFlagValue encounters an entry without getFlag
    // We need to mock game.journal.get to return different values on different calls
    let callCount = 0;
    mockJournal.get = vi.fn().mockImplementation((_id: string) => {
      callCount++;
      if (callCount === 1) {
        // First call in checkHiddenFlagChanged - return entry with getFlag that returns true
        return {
          id: "test-entry-no-getflag",
          getFlag: vi.fn().mockReturnValue(true),
        };
      } else {
        // Second call in getHiddenFlagValue - return entry without getFlag
        return {
          id: "test-entry-no-getflag",
          // No getFlag method
        };
      }
    });

    updateCallback!({ id: "test-entry-no-getflag" });

    // getHiddenFlagValue should return null when entry has no getFlag
    // So the debug message should still be called (because checkHiddenFlagChanged returned true)
    // but with null as the flag value
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.objectContaining({ context: expect.objectContaining({ hiddenFlag: null }) }),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getHiddenFlagValue when entry is not found", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object - first call returns entry with flag, second call returns null
    let callCount = 0;
    const mockEntry = {
      id: "test-entry-notfound",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockEntry; // First call in checkHiddenFlagChanged
        }
        return null; // Second call in getHiddenFlagValue - entry not found
      }),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-notfound" });

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getHiddenFlagValue error cases", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object that throws error in getFlag
    // First call returns true (for checkHiddenFlagChanged), second call throws (for getHiddenFlagValue)
    let callCount = 0;
    const mockEntry = {
      id: "test-entry-error",
      getFlag: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return true; // First call in checkHiddenFlagChanged - returns true
        }
        // Second call in getHiddenFlagValue - throws error
        throw new Error("Flag read error");
      }),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with entry that has flag set to true (so checkHiddenFlagChanged returns true)
    // But getFlag will throw error in getHiddenFlagValue
    updateCallback!({ id: "test-entry-error" });

    // Verify getFlag was called twice (once in checkHiddenFlagChanged, once in getHiddenFlagValue)
    expect(mockEntry.getFlag).toHaveBeenCalledTimes(2);

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getEntryFromHookArgs error cases", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Create an object that throws when accessing properties
    const problematicArg = {
      get id() {
        throw new Error("Cannot access id");
      },
    };

    // Call with problematic argument
    updateCallback!(problematicArg);

    // Verify error was logged
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Failed to extract entry from hook args",
      expect.objectContaining({ error: expect.any(String) }),
      { channels: ["ConsoleChannel"] }
    );
  });

  it("should handle rerenderJournalDirectory when journal not open", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-789",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector to return null (journal not open)
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(null);

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-789" });

    // Verify debug message about journal not open
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Journal directory not open, skipping re-render",
      {},
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
  });

  it("should handle rerenderJournalDirectory when UI not available", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-ui",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI as undefined
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = undefined;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-ui" });

    // Verify debug message about UI not available
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "UI not available, skipping journal directory re-render",
      {},
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
  });

  it("should handle rerenderJournalDirectory with ui.sidebar.journal path", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-sidebar",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI with journal at ui.sidebar.journal (not tabs.journal)
    const mockJournalApp = {
      id: "journal",
      render: vi.fn(),
      constructor: { name: "JournalDirectory" },
    };
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      sidebar: {
        journal: mockJournalApp, // This path, not tabs.journal
      },
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-sidebar" });

    // Verify render was called
    expect(mockJournalApp.render).toHaveBeenCalledWith(false);

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
  });

  it("should handle rerenderJournalDirectory with ui.journal path", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-ui",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI with journal at ui.journal (not sidebar)
    const mockJournalApp = {
      id: "journal",
      render: vi.fn(),
      constructor: { name: "JournalDirectory" },
    };
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      journal: mockJournalApp, // This path
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-ui" });

    // Verify render was called
    expect(mockJournalApp.render).toHaveBeenCalledWith(false);

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
  });

  it("should handle rerenderJournalDirectory with ui.apps.find path", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-apps",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI with journal in ui.apps array
    const mockJournalApp = {
      id: "journal",
      render: vi.fn(),
      constructor: { name: "JournalDirectory" },
    };
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      apps: [mockJournalApp], // This path - find in apps array
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-apps" });

    // Verify render was called
    expect(mockJournalApp.render).toHaveBeenCalledWith(false);

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
  });

  it("should handle rerenderJournalDirectory with hooks.call fallback", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-hooks",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI without journal app, but with Hooks.call
    const mockHooksCall = vi.fn();
    const originalHooks = (globalThis as any).Hooks;
    (globalThis as any).Hooks = {
      call: mockHooksCall,
    };

    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      sidebar: {},
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-hooks" });

    // Verify hooks.call was used as fallback
    expect(mockHooksCall).toHaveBeenCalledWith("renderJournalDirectory", expect.any(Object), [
      mockJournalElement,
    ]);

    // Verify the fallback app object has a render function that can be called
    const callArgs = mockHooksCall.mock.calls[0];
    const fallbackApp = callArgs?.[1];
    expect(fallbackApp).toBeDefined();
    expect(fallbackApp.id).toBe("journal");
    expect(typeof fallbackApp.render).toBe("function");
    // Call the render function to ensure it's covered
    expect(() => fallbackApp.render()).not.toThrow();

    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Manually triggered renderJournalDirectory hook",
      expect.any(Object),
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
    (globalThis as any).Hooks = originalHooks;
  });

  it("should handle rerenderJournalDirectory when app not found", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-notfound",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector for journal element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock UI without journal app and without Hooks.call
    const originalUI = (globalThis as any).ui;
    (globalThis as any).ui = {
      sidebar: {},
    };
    const originalHooks = (globalThis as any).Hooks;
    (globalThis as any).Hooks = {};

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-notfound" });

    // Verify debug message about app not found
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      "Could not trigger journal directory re-render (app not found)",
      expect.objectContaining({
        context: expect.objectContaining({
          hasUI: true,
          hasSidebar: true,
          hasTabs: false,
          hasJournalTab: false,
          hasJournalElement: true,
        }),
      }),
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    (globalThis as any).ui = originalUI;
    (globalThis as any).Hooks = originalHooks;
  });

  it("should handle rerenderJournalDirectory error cases", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object
    const mockEntry = {
      id: "test-entry-error",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector to throw error
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockImplementation(() => {
      throw new Error("Query selector error");
    });

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-error" });

    // Verify error was logged as warning
    expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
      "Failed to re-render journal directory",
      expect.objectContaining({
        code: "RERENDER_FAILED",
        message: "Query selector error",
      }),
      { channels: ["ConsoleChannel"] }
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
  });

  it("should handle getEntryFromHookArgs with empty args", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with empty args
    updateCallback!();

    // Should not throw
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle getEntryFromHookArgs with empty array", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with empty array as first arg
    updateCallback!([]);

    // Should not throw
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle getEntryFromHookArgs with array entry without id", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with array containing entry without id
    updateCallback!([{ name: "test" }] as any);

    // Should not throw
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle updateJournalEntry with entry but no id", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Call with entry without id
    updateCallback!({ name: "test" });

    // Should not throw or call checkHiddenFlagChanged
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should handle updateJournalEntry when hidden flag not changed", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with entry that has no flag set (undefined)
    const mockEntry = {
      id: "test-entry-noflag",
      getFlag: vi.fn().mockReturnValue(undefined),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-noflag" });

    // Should not trigger re-render when flag is not set
    expect(mockNotificationCenter.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getHiddenFlagValue when flag is neither true nor false", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with entry where getFlag returns different values
    // First call (in checkHiddenFlagChanged) returns true, second call (in getHiddenFlagValue) returns null
    const mockEntry = {
      id: "test-entry-inconsistent",
      getFlag: vi
        .fn()
        .mockReturnValueOnce(true) // First call in checkHiddenFlagChanged - flag is set
        .mockReturnValueOnce(null), // Second call in getHiddenFlagValue - flag is null (not true/false)
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-inconsistent" });

    // Should trigger re-render even though getHiddenFlagValue returns null
    // (because checkHiddenFlagChanged returned true)
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("Hidden flag changed"),
      expect.any(Object),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should handle getEntryFromHookArgs with non-Error exception", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    // Create a mock that throws a non-Error exception (string)
    const mockArgs = new Proxy([], {
      get() {
        throw "String error"; // Non-Error exception
      },
    });

    updateCallback!(mockArgs);

    // Should handle the error gracefully
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("Failed to extract entry from hook args"),
      expect.objectContaining({
        error: "String error",
      }),
      expect.any(Object)
    );
  });

  it("should handle rerenderJournalDirectory with non-Error exception", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object with entry that has hidden flag set
    const mockEntry = {
      id: "test-entry-rerender-error",
      getFlag: vi.fn().mockReturnValue(true),
    };
    const mockJournal = {
      get: vi.fn().mockReturnValue(mockEntry),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    // Mock document.querySelector to return an element
    const mockJournalElement = document.createElement("div");
    mockJournalElement.id = "journal";
    const originalQuerySelector = document.querySelector;
    document.querySelector = vi.fn().mockReturnValue(mockJournalElement);

    // Mock ui to throw a non-Error exception
    const originalUI = (globalThis as any).ui;
    Object.defineProperty(globalThis, "ui", {
      get() {
        throw { message: "Object error", code: "CUSTOM_ERROR" }; // Non-Error exception
      },
      configurable: true,
    });

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-rerender-error" });

    // Should handle the error gracefully
    expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
      expect.stringContaining("Failed to re-render journal directory"),
      expect.objectContaining({
        code: "RERENDER_FAILED",
        message: expect.any(String),
        stack: undefined, // Non-Error exceptions don't have stack
      }),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
    document.querySelector = originalQuerySelector;
    Object.defineProperty(globalThis, "ui", {
      value: originalUI,
      configurable: true,
      writable: true,
    });
  });

  it("should handle checkHiddenFlagChanged with non-Error exception", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    // Mock global game object where journal.get throws a non-Error exception
    const mockJournal = {
      get: vi.fn().mockImplementation(() => {
        throw { message: "Object error", code: "CUSTOM_ERROR" }; // Non-Error exception
      }),
    };
    const originalGame = (globalThis as any).game;
    (globalThis as any).game = {
      journal: mockJournal,
    };

    const hook = new JournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    hook.register({} as never);

    // Find updateJournalEntry hook callback
    const updateCall = mockHooks.on.mock.calls.find(
      ([hookName]) => hookName === "updateJournalEntry"
    );
    const updateCallback = updateCall?.[1] as ((...args: unknown[]) => void) | undefined;

    updateCallback!({ id: "test-entry-check-error" });

    // Should handle the error gracefully
    // String({ message: "Object error" }) returns "[object Object]"
    expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
      expect.stringContaining("Failed to check hidden flag"),
      expect.objectContaining({
        error: "[object Object]",
        entryId: "test-entry-check-error",
      }),
      expect.any(Object)
    );

    // Restore globals
    (globalThis as any).game = originalGame;
  });

  it("should instantiate DIJournalCacheInvalidationHook", () => {
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

    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockJournalVisibility: JournalVisibilityService = {
      processJournalDirectory: vi.fn(),
      getHiddenJournalEntries: vi.fn(),
    } as unknown as JournalVisibilityService;

    const hook = new DIJournalCacheInvalidationHook(
      mockHooks as FoundryHooks,
      mockCache,
      mockNotificationCenter,
      mockFoundryGame,
      mockJournalVisibility
    );

    expect(hook).toBeInstanceOf(JournalCacheInvalidationHook);
    expect(hook).toBeInstanceOf(DIJournalCacheInvalidationHook);

    // Verify it works the same as the base class
    const result = hook.register({} as never);
    expect(result.ok).toBe(true);
  });
});
