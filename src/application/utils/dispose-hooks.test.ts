import { describe, it, expect, vi } from "vitest";
import { disposeHooks } from "@/application/utils/dispose-hooks";
import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";

describe("disposeHooks", () => {
  it("should call dispose on all hooks", () => {
    const hook1: EventRegistrar = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
    };
    const hook2: EventRegistrar = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
    };

    disposeHooks([hook1, hook2]);

    expect(hook1.dispose).toHaveBeenCalledTimes(1);
    expect(hook2.dispose).toHaveBeenCalledTimes(1);
  });

  it("should handle empty array", () => {
    expect(() => disposeHooks([])).not.toThrow();
  });

  it("should handle single hook", () => {
    const hook: EventRegistrar = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      dispose: vi.fn(),
    };

    disposeHooks([hook]);

    expect(hook.dispose).toHaveBeenCalledTimes(1);
  });
});
