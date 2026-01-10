import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowRendererCoordinator } from "../window-renderer-coordinator";
import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { IRenderEnginePort } from "@/domain/windows/ports/render-engine-port.interface";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";
import type { ComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("WindowRendererCoordinator", () => {
  let coordinator: WindowRendererCoordinator;
  let mockRegistry: IRendererRegistry;
  let mockRenderer: IRenderEnginePort;
  let mockDescriptor: ComponentDescriptor;
  let mockMountPoint: HTMLElement;
  let mockViewModel: ViewModel;
  let mockInstance: ComponentInstance;

  beforeEach(() => {
    mockRenderer = {
      mount: vi.fn(),
      unmount: vi.fn(),
      update: vi.fn(),
    } as unknown as IRenderEnginePort;

    mockRegistry = {
      register: vi.fn(),
      get: vi.fn().mockReturnValue(ok(mockRenderer)),
    } as unknown as IRendererRegistry;

    mockDescriptor = {
      type: "svelte",
      component: vi.fn(),
      props: {},
    };

    mockMountPoint = document.createElement("div");

    mockViewModel = {
      state: {
        get: vi.fn().mockReturnValue({}),
        patch: vi.fn(),
        subscribe: vi.fn(() => () => {}),
      },
      computed: {},
      actions: {},
    };

    mockInstance = {
      id: "instance-1",
      type: "svelte",
      element: mockMountPoint,
      props: {},
      instance: {},
    } as ComponentInstance;

    coordinator = new WindowRendererCoordinator(mockRegistry);
  });

  describe("mount", () => {
    it("should mount component successfully", () => {
      vi.mocked(mockRenderer.mount).mockReturnValue(ok(mockInstance));

      const result = coordinator.mount(mockDescriptor, mockMountPoint, mockViewModel);

      expectResultOk(result);
      expect(result.value).toBe(mockInstance);
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.mount).toHaveBeenCalledWith(
        mockDescriptor,
        mockMountPoint,
        mockViewModel
      );
    });

    it("should return error if renderer not found", () => {
      vi.mocked(mockRegistry.get).mockReturnValue(
        err({
          code: "RendererNotFound",
          message: "Renderer not found",
        })
      );

      const result = coordinator.mount(mockDescriptor, mockMountPoint, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
      expect(result.error.message).toContain('Renderer for type "svelte" not found');
      expect(mockRenderer.mount).not.toHaveBeenCalled();
    });

    it("should return error if mount fails", () => {
      vi.mocked(mockRenderer.mount).mockReturnValue(
        err({
          code: "MountFailed",
          message: "Mount error",
        })
      );

      const result = coordinator.mount(mockDescriptor, mockMountPoint, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("MountFailed");
      expect(result.error.message).toContain("Failed to mount component");
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.mount).toHaveBeenCalled();
    });
  });

  describe("unmount", () => {
    it("should unmount component successfully", () => {
      vi.mocked(mockRenderer.unmount).mockReturnValue(ok(undefined));

      const result = coordinator.unmount(mockDescriptor, mockInstance);

      expectResultOk(result);
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.unmount).toHaveBeenCalledWith(mockInstance);
    });

    it("should return error if renderer not found", () => {
      vi.mocked(mockRegistry.get).mockReturnValue(
        err({
          code: "RendererNotFound",
          message: "Renderer not found",
        })
      );

      const result = coordinator.unmount(mockDescriptor, mockInstance);

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
      expect(result.error.message).toContain('Renderer for type "svelte" not found');
      expect(mockRenderer.unmount).not.toHaveBeenCalled();
    });

    it("should return error if unmount fails", () => {
      vi.mocked(mockRenderer.unmount).mockReturnValue(
        err({
          code: "UnmountFailed",
          message: "Unmount error",
        })
      );

      const result = coordinator.unmount(mockDescriptor, mockInstance);

      expectResultErr(result);
      expect(result.error.code).toBe("UnmountFailed");
      expect(result.error.message).toContain("Failed to unmount component");
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.unmount).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should update component successfully", () => {
      vi.mocked(mockRenderer.update).mockReturnValue(ok(undefined));

      const result = coordinator.update(mockDescriptor, mockInstance, mockViewModel);

      expectResultOk(result);
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.update).toHaveBeenCalledWith(mockInstance, mockViewModel);
    });

    it("should return error if renderer not found", () => {
      vi.mocked(mockRegistry.get).mockReturnValue(
        err({
          code: "RendererNotFound",
          message: "Renderer not found",
        })
      );

      const result = coordinator.update(mockDescriptor, mockInstance, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
      expect(result.error.message).toContain('Renderer for type "svelte" not found');
      expect(mockRenderer.update).not.toHaveBeenCalled();
    });

    it("should return error if update fails", () => {
      vi.mocked(mockRenderer.update).mockReturnValue(
        err({
          code: "UpdateFailed",
          message: "Update error",
        })
      );

      const result = coordinator.update(mockDescriptor, mockInstance, mockViewModel);

      expectResultErr(result);
      expect(result.error.code).toBe("UpdateFailed");
      expect(result.error.message).toContain("Failed to update component");
      expect(mockRegistry.get).toHaveBeenCalledWith("svelte");
      expect(mockRenderer.update).toHaveBeenCalled();
    });
  });
});
