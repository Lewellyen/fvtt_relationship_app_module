import { describe, it, expect, vi } from "vitest";
import { LogLevel } from "@/domain/types/log-level";
import { RuntimeConfigEventEmitter } from "../RuntimeConfigEventEmitter";

describe("RuntimeConfigEventEmitter", () => {
  it("registers a listener and returns unsubscribe function", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.onChange("logLevel", listener);

    expect(typeof unsubscribe).toBe("function");
  });

  it("notifies listeners when notify is called", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener = vi.fn();
    emitter.onChange("logLevel", listener);

    emitter.notify("logLevel", LogLevel.ERROR);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(LogLevel.ERROR);
  });

  it("does not notify if no listeners are registered", () => {
    const emitter = new RuntimeConfigEventEmitter();

    // Should not throw
    emitter.notify("logLevel", LogLevel.ERROR);
  });

  it("allows multiple listeners for the same key", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    emitter.onChange("logLevel", listener1);
    emitter.onChange("logLevel", listener2);

    emitter.notify("logLevel", LogLevel.WARN);

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener1).toHaveBeenCalledWith(LogLevel.WARN);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledWith(LogLevel.WARN);
  });

  it("allows unsubscribing a listener", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.onChange("cacheDefaultTtlMs", listener);

    unsubscribe();
    emitter.notify("cacheDefaultTtlMs", 10000);

    expect(listener).not.toHaveBeenCalled();
  });

  it("removes listener map entry when last listener is removed", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // Add two listeners
    const unsubscribe1 = emitter.onChange("logLevel", listener1);
    const unsubscribe2 = emitter.onChange("logLevel", listener2);

    // Remove first listener - map entry should still exist
    unsubscribe1();
    emitter.notify("logLevel", LogLevel.DEBUG);
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);

    // Remove second listener - map entry should be removed
    unsubscribe2();
    emitter.notify("logLevel", LogLevel.WARN);
    expect(listener2).toHaveBeenCalledTimes(1); // Still only called once from before

    // Verify we can add a new listener after cleanup
    const listener3 = vi.fn();
    emitter.onChange("logLevel", listener3);
    emitter.notify("logLevel", LogLevel.ERROR);
    expect(listener3).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledWith(LogLevel.ERROR);
  });

  it("handles different keys independently", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const logListener = vi.fn();
    const cacheListener = vi.fn();

    emitter.onChange("logLevel", logListener);
    emitter.onChange("enableCacheService", cacheListener);

    emitter.notify("logLevel", LogLevel.ERROR);
    emitter.notify("enableCacheService", false);

    expect(logListener).toHaveBeenCalledTimes(1);
    expect(logListener).toHaveBeenCalledWith(LogLevel.ERROR);
    expect(cacheListener).toHaveBeenCalledTimes(1);
    expect(cacheListener).toHaveBeenCalledWith(false);
  });

  it("handles unsubscribing non-existent listener gracefully", () => {
    const emitter = new RuntimeConfigEventEmitter();
    const listener = vi.fn();
    const unsubscribe = emitter.onChange("logLevel", listener);

    unsubscribe();
    // Unsubscribing again should not throw
    unsubscribe();
  });
});
