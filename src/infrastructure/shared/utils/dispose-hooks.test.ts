import { describe, it, expect, vi } from "vitest";
import { disposeHooks } from "@/infrastructure/shared/utils/dispose-hooks";
import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";

describe("disposeHooks", () => {
  it("should call dispose on all hooks", () => {
    const hook1 = {
      dispose: vi.fn(),
      register: vi.fn(),
    } as unknown as EventRegistrar;
    const hook2 = {
      dispose: vi.fn(),
      register: vi.fn(),
    } as unknown as EventRegistrar;

    disposeHooks([hook1, hook2]);

    expect(hook1.dispose).toHaveBeenCalledOnce();
    expect(hook2.dispose).toHaveBeenCalledOnce();
  });

  it("should handle empty array", () => {
    expect(() => disposeHooks([])).not.toThrow();
  });

  it("should handle single hook", () => {
    const hook = {
      dispose: vi.fn(),
      register: vi.fn(),
    } as unknown as EventRegistrar;

    disposeHooks([hook]);

    expect(hook.dispose).toHaveBeenCalledOnce();
  });
});
