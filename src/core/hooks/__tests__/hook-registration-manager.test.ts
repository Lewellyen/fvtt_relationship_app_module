import { describe, it, expect, vi } from "vitest";
import { HookRegistrationManager } from "../hook-registration-manager";

describe("HookRegistrationManager", () => {
  it("should invoke all registered cleanup callbacks on dispose", () => {
    const manager = new HookRegistrationManager();
    const first = vi.fn();
    const second = vi.fn();

    manager.register(first);
    manager.register(second);

    manager.dispose();

    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();

    // Subsequent dispose calls should be no-ops
    first.mockClear();
    second.mockClear();
    manager.dispose();
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it("should not throw when a cleanup callback throws and should log a warning", () => {
    const manager = new HookRegistrationManager();
    const failing = vi.fn(() => {
      throw new Error("test-error");
    });
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    manager.register(failing);

    expect(() => manager.dispose()).not.toThrow();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "HookRegistrationManager: failed to unregister hook",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});

import { describe, it, expect, vi } from "vitest";
import { HookRegistrationManager } from "../hook-registration-manager";

describe("HookRegistrationManager", () => {
  it("should call registered cleanup callbacks on dispose", () => {
    const manager = new HookRegistrationManager();
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();

    manager.register(cleanup1);
    manager.register(cleanup2);

    manager.dispose();

    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });

  it("should be idempotent when dispose is called multiple times", () => {
    const manager = new HookRegistrationManager();
    const cleanup = vi.fn();

    manager.register(cleanup);

    manager.dispose();
    manager.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("should swallow errors from cleanup callbacks", () => {
    const manager = new HookRegistrationManager();
    const cleanup = vi.fn(() => {
      throw new Error("fail");
    });

    manager.register(cleanup);

    expect(() => manager.dispose()).not.toThrow();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
