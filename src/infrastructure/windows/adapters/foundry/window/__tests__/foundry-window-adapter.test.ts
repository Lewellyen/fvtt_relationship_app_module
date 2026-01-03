import { describe, it, expect, beforeEach, vi } from "vitest";
import { FoundryWindowAdapter } from "../foundry-window-adapter";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import type { ApplicationV2 } from "@/domain/windows/types/application-v2.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryWindowAdapter", () => {
  let adapter: FoundryWindowAdapter;
  let mockController: IWindowController;
  let mockDefinition: WindowDefinition;

  beforeEach(() => {
    adapter = new FoundryWindowAdapter();
    mockController = {
      onFoundryRender: vi.fn(),
      onFoundryUpdate: vi.fn(),
      onFoundryClose: vi.fn(),
      applyRemotePatch: vi.fn(),
    } as unknown as IWindowController;

    mockDefinition = {
      definitionId: "test-window",
      title: "Test Window",
      classes: ["test-class"],
      component: {
        type: "svelte",
        component: vi.fn(),
        props: {},
      },
      features: {
        resizable: true,
        minimizable: true,
        draggable: true,
      },
    };
  });

  describe("buildApplicationWrapper", () => {
    it("should build application wrapper successfully", () => {
      // Mock foundry global
      (globalThis as { foundry?: unknown }).foundry = {
        applications: {
          api: {
            ApplicationV2: class {},
            HandlebarsApplicationMixin: (cls: unknown) => cls,
          },
        },
      };

      const result = adapter.buildApplicationWrapper(mockDefinition, mockController, "instance-1");

      expectResultOk(result);
      expect(result.value).toBeDefined();

      delete (globalThis as { foundry?: unknown }).foundry;
    });

    it("should return error if build fails", async () => {
      // Mock foundry to cause build failure
      (globalThis as { foundry?: unknown }).foundry = {
        applications: {
          api: {
            ApplicationV2: undefined,
            HandlebarsApplicationMixin: undefined,
          },
        },
      };

      // Mock FoundryApplicationWrapper.build to throw
      const { FoundryApplicationWrapper: foundryApplicationWrapper } =
        await import("../foundry-application-wrapper");
      vi.spyOn(foundryApplicationWrapper, "build").mockImplementation(() => {
        throw new Error("Build failed");
      });

      const result = adapter.buildApplicationWrapper(mockDefinition, mockController, "instance-1");

      expectResultErr(result);
      expect(result.error.code).toBe("BuildApplicationFailed");
      expect(result.error.message).toContain("Failed to build application wrapper");

      // Restore
      vi.restoreAllMocks();
      delete (globalThis as { foundry?: unknown }).foundry;
    });
  });

  describe("renderWindow", () => {
    it("should render window successfully", async () => {
      // Mock foundry global
      (globalThis as { foundry?: unknown }).foundry = {
        applications: {
          api: {
            ApplicationV2: class {},
            HandlebarsApplicationMixin: (cls: unknown) => cls,
          },
        },
      };

      const buildResult = adapter.buildApplicationWrapper(
        mockDefinition,
        mockController,
        "instance-1"
      );
      expectResultOk(buildResult);

      const _appClass = buildResult.value;
      const mockApp = {
        render: vi.fn().mockResolvedValue(undefined),
      };
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        foundryApp: mockApp as unknown as ApplicationV2,
      };

      const result = await adapter.renderWindow(instance);

      expectResultOk(result);
      expect(mockApp.render).toHaveBeenCalledWith({ force: false });

      delete (globalThis as { foundry?: unknown }).foundry;
    });

    it("should render window with force flag", async () => {
      // Mock foundry global
      (globalThis as { foundry?: unknown }).foundry = {
        applications: {
          api: {
            ApplicationV2: class {},
            HandlebarsApplicationMixin: (cls: unknown) => cls,
          },
        },
      };

      const buildResult = adapter.buildApplicationWrapper(
        mockDefinition,
        mockController,
        "instance-1"
      );
      expectResultOk(buildResult);

      const mockApp = {
        render: vi.fn().mockResolvedValue(undefined),
      };
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        foundryApp: mockApp as unknown as ApplicationV2,
      };

      const result = await adapter.renderWindow(instance, true);

      expectResultOk(result);
      expect(mockApp.render).toHaveBeenCalledWith({ force: true });

      delete (globalThis as { foundry?: unknown }).foundry;
    });

    it("should return error if foundryApp is not set", async () => {
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      const result = await adapter.renderWindow(instance);

      expectResultErr(result);
      expect(result.error.code).toBe("NoFoundryApp");
    });

    it("should return error if render fails", async () => {
      const mockApp = {
        render: vi.fn().mockRejectedValue(new Error("Render failed")),
      };
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        foundryApp: mockApp as unknown as ApplicationV2,
      };

      const result = await adapter.renderWindow(instance);

      expectResultErr(result);
      expect(result.error.code).toBe("RenderFailed");
      expect(result.error.message).toContain("Failed to render window");
    });
  });

  describe("closeWindow", () => {
    it("should close window successfully", async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        foundryApp: mockApp as unknown as ApplicationV2,
      };

      const result = await adapter.closeWindow(instance);

      expectResultOk(result);
      expect(mockApp.close).toHaveBeenCalled();
    });

    it("should return error if foundryApp is not set", async () => {
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      const result = await adapter.closeWindow(instance);

      expectResultErr(result);
      expect(result.error.code).toBe("NoFoundryApp");
    });

    it("should return error if close fails", async () => {
      const mockApp = {
        close: vi.fn().mockRejectedValue(new Error("Close failed")),
      };
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        foundryApp: mockApp as unknown as ApplicationV2,
      };

      const result = await adapter.closeWindow(instance);

      expectResultErr(result);
      expect(result.error.code).toBe("CloseFailed");
      expect(result.error.message).toContain("Failed to close window");
    });
  });
});
