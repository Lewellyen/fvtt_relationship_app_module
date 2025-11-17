/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

// Test file: `any` needed for mocking container.resolve() responses

import { describe, it, expect, vi } from "vitest";
import { ModuleHookRegistrar } from "../module-hook-registrar";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { HookRegistrar } from "@/core/hooks/hook-registrar.interface";
import { ok, err } from "@/utils/functional/result";
import type { ServiceContainer } from "@/di_infrastructure/container";

function createStubHook(success: boolean): HookRegistrar {
  return {
    register: vi
      .fn()
      .mockImplementation(() =>
        success ? ok(undefined) : err(new Error("Hook registration failed: test-error"))
      ),
    dispose: vi.fn(),
  };
}

function createNotificationCenterMock(): NotificationCenter {
  return {
    notify: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn().mockReturnValue(ok(undefined)),
    addChannel: vi.fn(),
    removeChannel: vi.fn(),
    getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel"]),
  } as unknown as NotificationCenter;
}

function createRegistrarWithHooks(
  hooks: HookRegistrar[],
  notificationCenter: NotificationCenter
): ModuleHookRegistrar {
  const [first, second] = hooks;
  return new ModuleHookRegistrar(first!, second as HookRegistrar | undefined, notificationCenter);
}

describe("ModuleHookRegistrar", () => {
  describe("registerAll", () => {
    it("returns ok when all hooks register successfully", () => {
      const hook1 = createStubHook(true);
      const hook2 = createStubHook(true);
      const notificationCenter = createNotificationCenterMock();
      const registrar = createRegistrarWithHooks([hook1, hook2], notificationCenter);

      const result = registrar.registerAll({} as ServiceContainer);

      expect(result.ok).toBe(true);
      expect(hook1.register).toHaveBeenCalled();
      expect(hook2.register).toHaveBeenCalled();
      expect(notificationCenter.error).not.toHaveBeenCalled();
    });

    it("returns aggregated errors when at least one hook registration fails", () => {
      const successHook = createStubHook(true);
      const failingHook = createStubHook(false);
      const notificationCenter = createNotificationCenterMock();
      const registrar = createRegistrarWithHooks([successHook, failingHook], notificationCenter);

      const result = registrar.registerAll({} as ServiceContainer);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toHaveLength(1);
        expect(result.error[0]?.message).toContain("Hook registration failed");
      }
      expect(notificationCenter.error).toHaveBeenCalledWith(
        "Failed to register hook",
        {
          code: "HOOK_REGISTRATION_FAILED",
          message: expect.stringContaining("Hook registration failed"),
        },
        { channels: ["ConsoleChannel"] }
      );
    });
  });

  describe("disposeAll", () => {
    it("should dispose all hooks", () => {
      const hook1 = createStubHook(true);
      const hook2 = createStubHook(true);
      const notificationCenter = createNotificationCenterMock();
      const registrar = createRegistrarWithHooks([hook1, hook2], notificationCenter);

      registrar.registerAll({} as ServiceContainer);
      registrar.disposeAll();

      expect(hook1.dispose).toHaveBeenCalled();
      expect(hook2.dispose).toHaveBeenCalled();
    });

    it("should dispose hooks even if registration failed", () => {
      const hook1 = createStubHook(true);
      const hook2 = createStubHook(false);
      const notificationCenter = createNotificationCenterMock();
      const registrar = createRegistrarWithHooks([hook1, hook2], notificationCenter);

      registrar.registerAll({} as ServiceContainer);
      registrar.disposeAll();

      expect(hook1.dispose).toHaveBeenCalled();
      expect(hook2.dispose).toHaveBeenCalled();
    });
  });
});
