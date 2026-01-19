import { describe, it, expect, beforeEach, vi } from "vitest";
import { SvelteRenderer } from "../svelte-renderer";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";
import type { SvelteComponentInstance } from "@/domain/windows/types/component-instance.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { mount, unmount } from "svelte";
import * as resultUtils from "@/domain/utils/result";

// Mock svelte module
vi.mock("svelte", () => ({
  mount: vi.fn(),
  unmount: vi.fn(),
}));

describe("SvelteRenderer", () => {
  let renderer: SvelteRenderer;
  let mockComponent: unknown;
  let mockTarget: HTMLElement;
  let mockViewModel: ViewModel;

  beforeEach(() => {
    renderer = new SvelteRenderer();
    mockComponent = vi.fn();
    mockTarget = document.createElement("div");
    mockViewModel = {
      state: {
        get: () => ({ count: 0 }),
        patch: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      },
      computed: {},
      actions: {},
    };

    vi.clearAllMocks();
  });

  describe("mount", () => {
    it("should mount svelte component successfully", () => {
      const descriptor: ComponentDescriptor = {
        type: "svelte",
        component: mockComponent,
        props: {},
      };

      const mockMounted = { destroy: vi.fn() };
      vi.mocked(mount).mockReturnValue(mockMounted as unknown as ReturnType<typeof mount>);

      const result = renderer.mount(descriptor, mockTarget, mockViewModel);

      expectResultOk(result);
      expect(result.value.type).toBe("svelte");
      expect(result.value.element).toBe(mockTarget);
      expect(vi.mocked(mount)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          target: mockTarget,
          props: expect.objectContaining({
            viewModel: mockViewModel,
          }),
        })
      );
    });

    it("should mount with component props", () => {
      const descriptor: ComponentDescriptor = {
        type: "svelte",
        component: mockComponent,
        props: { title: "Test" },
      };

      const mockMounted = { destroy: vi.fn() };
      vi.mocked(mount).mockReturnValue(mockMounted as unknown as ReturnType<typeof mount>);

      const result = renderer.mount(descriptor, mockTarget, mockViewModel);

      expectResultOk(result);
      expect(vi.mocked(mount)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          target: mockTarget,
          props: expect.objectContaining({
            title: "Test",
            viewModel: mockViewModel,
          }),
        })
      );
    });

    it("should return error for non-svelte component type", () => {
      const descriptor: ComponentDescriptor = {
        type: "react" as "svelte",
        component: mockComponent,
        props: {},
      };

      const result = renderer.mount(descriptor, mockTarget, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
      expect(result.error.message).toContain("SvelteRenderer can only mount svelte components");
    });

    it("should return error when component is not a valid Svelte component function", () => {
      const descriptor: ComponentDescriptor = {
        type: "svelte",
        component: "not-a-function" as unknown,
        props: {},
      };

      const result = renderer.mount(descriptor, mockTarget, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
      expect(result.error.message).toContain(
        "Component descriptor does not contain a valid Svelte component function"
      );
    });

    it("should return error when mount target is not an HTMLElement", () => {
      const descriptor: ComponentDescriptor = {
        type: "svelte",
        component: mockComponent,
        props: {},
      };

      const invalidTarget = {};

      const result = renderer.mount(descriptor, invalidTarget, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidTarget");
      expect(result.error.message).toContain("Mount target is not a valid HTMLElement");
      expect(vi.mocked(mount)).not.toHaveBeenCalled();
    });

    it("should return error if mount fails", () => {
      const descriptor: ComponentDescriptor = {
        type: "svelte",
        component: mockComponent,
        props: {},
      };

      vi.mocked(mount).mockImplementation(() => {
        throw new Error("Mount failed");
      });

      const result = renderer.mount(descriptor, mockTarget, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("MountFailed");
      expect(result.error.message).toContain("Failed to mount svelte component");
    });
  });

  describe("unmount", () => {
    it("should unmount component successfully", () => {
      const instance = {
        id: "test-instance",
        type: "svelte" as const,
        element: mockTarget,
        props: {},
        instance: { destroy: vi.fn() },
      };

      const result = renderer.unmount(instance);

      expectResultOk(result);
      expect(unmount).toHaveBeenCalledWith(instance.instance);
    });

    it("should handle unmount when instance is undefined", () => {
      const instance = {
        id: "test-instance",
        type: "svelte" as const,
        element: mockTarget,
        props: {},
      } as {
        id: string;
        type: "svelte";
        element: HTMLElement;
        props: Record<string, unknown>;
        instance?: unknown;
      };

      const result = renderer.unmount(instance as unknown as SvelteComponentInstance);

      expectResultOk(result);
      expect(unmount).not.toHaveBeenCalled();
    });

    it("should return error if unmount fails", () => {
      const instance = {
        id: "test-instance",
        type: "svelte" as const,
        element: mockTarget,
        props: {},
        instance: { destroy: vi.fn() },
      };

      vi.mocked(unmount).mockImplementation(() => {
        throw new Error("Unmount failed");
      });

      const result = renderer.unmount(instance);

      expectResultErr(result);
      expect(result.error.code).toBe("UnmountFailed");
      expect(result.error.message).toContain("Failed to unmount component");
    });
  });

  describe("update", () => {
    it("should return success without updating (Svelte 5 uses reactive state)", () => {
      const instance = {
        id: "test-instance",
        type: "svelte" as const,
        element: mockTarget,
        props: {},
        instance: { destroy: vi.fn() },
      };

      const result = renderer.update(instance, mockViewModel);

      expectResultOk(result);
    });

    it("should return error if update fails", () => {
      const instance = {
        id: "test-instance",
        type: "svelte" as const,
        element: mockTarget,
        props: {},
        instance: { destroy: vi.fn() },
      };

      // Mock ok() to throw an error to test the catch block
      const originalOk = resultUtils.ok;
      vi.spyOn(resultUtils, "ok").mockImplementation(() => {
        throw new Error("Unexpected error in ok()");
      });

      const result = renderer.update(instance, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("UpdateFailed");
      expect(result.error.message).toContain("Failed to update component");

      // Restore original implementation
      vi.mocked(resultUtils.ok).mockImplementation(originalOk);
    });
  });
});
