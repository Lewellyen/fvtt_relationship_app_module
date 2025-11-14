import { describe, it, expect, vi } from "vitest";
import type { Mock } from "vitest";
import { JournalCacheInvalidationHook } from "../journal-cache-invalidation-hook";
import { foundryHooksToken } from "@/foundry/foundrytokens";
import { cacheServiceToken, loggerToken, notificationCenterToken } from "@/tokens/tokenindex";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { CacheService } from "@/interfaces/cache";
import type { Logger } from "@/interfaces/logger";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import { ok } from "@/utils/functional/result";

type MockHookFunctions = {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
};

type MockContainer = {
  container: ServiceContainer;
  mockHooks: MockHookFunctions;
  mockCache: CacheService;
  mockLogger: Logger;
  mockNotificationCenter: NotificationCenter;
};

function createMockContainer(overrides: Partial<Record<symbol, unknown>> = {}): MockContainer {
  const mockHooks = {
    on: vi.fn().mockReturnValueOnce(ok(11)).mockReturnValueOnce(ok(22)).mockReturnValueOnce(ok(33)),
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

  const mockLogger: Logger = {
    log: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    withTraceId: vi.fn().mockReturnThis(),
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

  const services: Record<symbol, unknown> = {
    [foundryHooksToken]: mockHooks,
    [cacheServiceToken]: mockCache,
    [loggerToken]: mockLogger,
    [notificationCenterToken]: mockNotificationCenter,
    ...overrides,
  };

  const container: ServiceContainer = {
    resolveWithError: vi.fn((token: symbol) =>
      services[token]
        ? { ok: true as const, value: services[token] }
        : { ok: false as const, error: { code: "NOT_FOUND", message: "not found" } }
    ),
  } as unknown as ServiceContainer;

  return {
    container,
    mockHooks,
    mockCache,
    mockLogger,
    mockNotificationCenter,
  };
}

describe("JournalCacheInvalidationHook", () => {
  it("registers Foundry hooks and invalidates cache", () => {
    const { container, mockHooks, mockCache, mockLogger } = createMockContainer();
    mockCache.invalidateWhere = vi.fn().mockReturnValueOnce(2);
    const hook = new JournalCacheInvalidationHook();

    const result = hook.register(container);
    expect(result.ok).toBe(true);
    expect(mockHooks.on).toHaveBeenCalledTimes(3);

    const [, callback] = mockHooks.on.mock.calls[0]!;
    callback();

    expect(mockCache.invalidateWhere).toHaveBeenCalledWith(expect.any(Function));
    const predicate = (mockCache.invalidateWhere as unknown as Mock).mock.calls[0]![0];
    expect(predicate({ tags: ["journal:hidden"] } as never)).toBe(true);
    expect(predicate({ tags: [] } as never)).toBe(false);
    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("hidden journal cache entries")
    );
  });

  it("logs and propagates registration errors", () => {
    const failingHooks = {
      on: vi.fn().mockReturnValueOnce({ ok: false as const, error: { message: "boom" } }),
      off: vi.fn(),
    };
    const { container, mockNotificationCenter } = createMockContainer({
      [foundryHooksToken]: failingHooks,
    });
    const hook = new JournalCacheInvalidationHook();

    const result = hook.register(container);

    expect(result.ok).toBe(false);
    expect(mockNotificationCenter.error).toHaveBeenCalledWith(
      expect.stringContaining("createJournalEntry"),
      expect.objectContaining({ message: "boom" }),
      { channels: ["ConsoleChannel"] }
    );
  });

  it("unregisters hooks on dispose", () => {
    const { container, mockHooks } = createMockContainer();
    const hook = new JournalCacheInvalidationHook();

    hook.register(container);
    hook.dispose();

    expect(mockHooks.off).toHaveBeenCalledWith("createJournalEntry", 11);
    expect(mockHooks.off).toHaveBeenCalledWith("updateJournalEntry", 22);
    expect(mockHooks.off).toHaveBeenCalledWith("deleteJournalEntry", 33);
  });

  it("disposes safely when register was never called", () => {
    const hook = new JournalCacheInvalidationHook();
    expect(() => hook.dispose()).not.toThrow();
  });
});
