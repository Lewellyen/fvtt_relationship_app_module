import { describe, it, expect, vi } from "vitest";
import { HookRegistrationManager } from "@/application/use-cases/hook-registration-manager";

describe("HookRegistrationManager", () => {
  it("should invoke all registered cleanup callbacks on dispose", () => {
    const manager = new HookRegistrationManager();
    const first = vi.fn();
    const second = vi.fn();

    manager.register(first);
    manager.register(second);

    manager.dispose();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("should be idempotent when dispose is called multiple times", () => {
    const manager = new HookRegistrationManager();
    const cleanup = vi.fn();

    manager.register(cleanup);

    manager.dispose();
    manager.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it("should swallow errors from cleanup callbacks and log warning", () => {
    const manager = new HookRegistrationManager();
    const failing = vi.fn(() => {
      throw new Error("test-error");
    });
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    manager.register(failing);

    expect(() => manager.dispose()).not.toThrow();
    expect(failing).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "HookRegistrationManager: failed to unregister hook",
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });
});
