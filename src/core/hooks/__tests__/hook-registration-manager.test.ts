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
