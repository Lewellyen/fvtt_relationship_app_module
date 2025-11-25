import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DIFoundryBootstrapHooksAdapter,
  FoundryBootstrapHooksAdapter,
} from "@/infrastructure/adapters/foundry/bootstrap-hooks-adapter";

type HooksLike = {
  on: (hook: string, callback: () => void) => void;
};

const hooksGlobal = globalThis as typeof globalThis & { Hooks?: HooksLike };

describe("FoundryBootstrapHooksAdapter", () => {
  let adapter: FoundryBootstrapHooksAdapter;
  let originalHooks: HooksLike | undefined;

  beforeEach(() => {
    adapter = new FoundryBootstrapHooksAdapter();
    originalHooks = hooksGlobal.Hooks;
  });

  afterEach(() => {
    if (originalHooks) {
      hooksGlobal.Hooks = originalHooks;
    } else {
      delete hooksGlobal.Hooks;
    }
    vi.restoreAllMocks();
  });

  it("returns platform error when Hooks API is unavailable for init", () => {
    delete hooksGlobal.Hooks;

    const result = adapter.onInit(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PLATFORM_NOT_AVAILABLE");
  });

  it("returns platform error when Hooks API is unavailable for ready", () => {
    delete hooksGlobal.Hooks;

    const result = adapter.onReady(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PLATFORM_NOT_AVAILABLE");
  });

  it("registers init callback via Hooks.on when API exists", () => {
    const on = vi.fn();
    hooksGlobal.Hooks = { on };
    const callback = vi.fn();

    const result = adapter.onInit(callback);

    expect(result.ok).toBe(true);
    expect(on).toHaveBeenCalledWith("init", callback);
  });

  it("maps registration failures to hook errors for ready hook", () => {
    const error = new Error("boom");
    const on = vi.fn().mockImplementation(() => {
      throw error;
    });
    hooksGlobal.Hooks = { on };

    const result = adapter.onReady(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HOOK_REGISTRATION_FAILED");
      expect(result.error.message).toContain("ready");
      expect(result.error.details).toBe(error);
    }
  });

  it("maps registration failures with non-Error values for ready hook", () => {
    const error = "broken ready";
    const on = vi.fn().mockImplementation((hook: string) => {
      if (hook === "ready") {
        throw error;
      }
    });
    hooksGlobal.Hooks = { on };

    const result = adapter.onReady(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HOOK_REGISTRATION_FAILED");
      expect(result.error.message).toContain("ready");
      expect(result.error.details).toBe(error);
    }
  });

  it("maps registration failures to hook errors for init hook", () => {
    const error = new Error("init broken");
    const on = vi.fn().mockImplementation((hook: string) => {
      if (hook === "init") {
        throw error;
      }
    });
    hooksGlobal.Hooks = { on };

    const result = adapter.onInit(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HOOK_REGISTRATION_FAILED");
      expect(result.error.message).toContain("init");
      expect(result.error.details).toBe(error);
    }
  });

  it("maps registration failures with non-Error values for init hook", () => {
    const error = "init broken";
    const on = vi.fn().mockImplementation((hook: string) => {
      if (hook === "init") {
        throw error;
      }
    });
    hooksGlobal.Hooks = { on };

    const result = adapter.onInit(() => undefined);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("HOOK_REGISTRATION_FAILED");
      expect(result.error.message).toContain("init");
      expect(result.error.details).toBe(error);
    }
  });

  it("shares behavior in DI wrapper", () => {
    const on = vi.fn();
    hooksGlobal.Hooks = { on };
    const diAdapter = new DIFoundryBootstrapHooksAdapter();

    const result = diAdapter.onReady(() => undefined);

    expect(result.ok).toBe(true);
    expect(on).toHaveBeenCalledWith("ready", expect.any(Function));
    expect(DIFoundryBootstrapHooksAdapter.dependencies).toEqual([]);
  });
});
