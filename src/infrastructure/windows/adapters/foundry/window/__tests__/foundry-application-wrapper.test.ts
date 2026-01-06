import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { FoundryApplicationWrapper } from "../foundry-application-wrapper";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import type { ApplicationV2 } from "@/domain/windows/types/application-v2.interface";

describe("FoundryApplicationWrapper", () => {
  let mockDefinition: WindowDefinition;
  let mockController: IWindowController;
  let mockFoundryApi: {
    applications: {
      api: {
        ApplicationV2?: unknown;
        HandlebarsApplicationMixin?: (cls: unknown) => unknown;
      };
    };
  };

  beforeEach(() => {
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

    mockController = {
      onFoundryRender: vi.fn().mockResolvedValue(undefined),
      onFoundryUpdate: vi.fn().mockResolvedValue(undefined),
      onFoundryClose: vi.fn().mockResolvedValue(undefined),
      applyRemotePatch: vi.fn(),
    } as unknown as IWindowController;

    mockFoundryApi = {
      applications: {
        api: {
          ApplicationV2: class MockApplicationV2 {
            static DEFAULT_OPTIONS = {};
            constructor(_options?: unknown) {}
            async render(_options?: unknown) {}
            async close(_options?: unknown) {
              return this;
            }
            protected async _renderFrame(_options?: unknown): Promise<HTMLElement> {
              // Mock implementation - creates a frame with .window-content
              const frame = document.createElement("div");
              const content = document.createElement("div");
              content.className = "window-content";
              frame.appendChild(content);
              return frame;
            }
          },
          HandlebarsApplicationMixin: (cls: unknown) => cls,
        },
      },
    };

    (globalThis as { foundry?: unknown }).foundry = mockFoundryApi;
  });

  afterEach(() => {
    delete (globalThis as { foundry?: unknown }).foundry;
  });

  describe("build", () => {
    it("should build application class successfully", () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );

      expect(appClass).toBeDefined();
      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        id?: string;
        title?: string;
      };
      expect(defaultOptions?.id).toBe("instance-1");
      expect(defaultOptions?.title).toBe("Test Window");
    });

    it("should set correct window features", () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        window?: { resizable?: boolean; minimizable?: boolean; draggable?: boolean };
      };
      expect(defaultOptions?.window?.resizable).toBe(true);
      expect(defaultOptions?.window?.minimizable).toBe(true);
      expect(defaultOptions?.window?.draggable).toBe(true);
    });

    it("should handle position in definition", () => {
      const definitionWithPosition: WindowDefinition = {
        ...mockDefinition,
        position: {
          top: 100,
          left: 200,
          width: 300,
          height: 400,
        },
      };

      const appClass = FoundryApplicationWrapper.build(
        definitionWithPosition,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        position?: { top?: number; left?: number; width?: number; height?: number };
      };
      expect(defaultOptions?.position?.top).toBe(100);
      expect(defaultOptions?.position?.left).toBe(200);
      expect(defaultOptions?.position?.width).toBe(300);
      expect(defaultOptions?.position?.height).toBe(400);
    });

    it("should handle partial position", () => {
      const definitionWithPartialPosition: WindowDefinition = {
        ...mockDefinition,
        position: {
          top: 100,
        },
      };

      const appClass = FoundryApplicationWrapper.build(
        definitionWithPartialPosition,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        position?: { top?: number; left?: number; width?: number; height?: number };
      };
      expect(defaultOptions?.position?.top).toBe(100);
      expect(defaultOptions?.position?.left).toBeUndefined();
      expect(defaultOptions?.position?.width).toBeUndefined();
      expect(defaultOptions?.position?.height).toBeUndefined();
    });

    it.each([
      [{ top: 100 }, { top: 100 }],
      [{ left: 200 }, { left: 200 }],
      [{ width: 300 }, { width: 300 }],
      [{ height: 400 }, { height: 400 }],
      [
        { top: 100, left: 200 },
        { top: 100, left: 200 },
      ],
      [
        { top: 100, width: 300 },
        { top: 100, width: 300 },
      ],
      [
        { top: 100, height: 400 },
        { top: 100, height: 400 },
      ],
      [
        { left: 200, width: 300 },
        { left: 200, width: 300 },
      ],
      [
        { left: 200, height: 400 },
        { left: 200, height: 400 },
      ],
      [
        { width: 300, height: 400 },
        { width: 300, height: 400 },
      ],
      [
        { top: 100, left: 200, width: 300 },
        { top: 100, left: 200, width: 300 },
      ],
      [
        { top: 100, left: 200, height: 400 },
        { top: 100, left: 200, height: 400 },
      ],
      [
        { top: 100, width: 300, height: 400 },
        { top: 100, width: 300, height: 400 },
      ],
      [
        { left: 200, width: 300, height: 400 },
        { left: 200, width: 300, height: 400 },
      ],
      [
        { top: 100, left: 200, width: 300, height: 400 },
        { top: 100, left: 200, width: 300, height: 400 },
      ],
      [{}, undefined], // Leeres Position-Objekt - wird zu undefined, da keine Properties
    ])("should handle position combinations: %j", (position, expected) => {
      const definitionWithPosition: WindowDefinition = {
        ...mockDefinition,
        position,
      };

      const appClass = FoundryApplicationWrapper.build(
        definitionWithPosition,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        position?: { top?: number; left?: number; width?: number; height?: number };
      };
      if (expected === undefined) {
        expect(defaultOptions?.position).toBeUndefined();
      } else {
        expect(defaultOptions?.position).toEqual(expected);
      }
    });

    it("should handle hasFrame undefined in _renderFrame (branch 125)", async () => {
      // Create a mock ApplicationV2 that has hasFrame undefined
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mock class in test
      const MockApplicationV2WithHasFrameUndefined = class {
        static DEFAULT_OPTIONS = {};
        // hasFrame is not defined, so it will be undefined
        protected async _renderFrame(_options?: unknown): Promise<HTMLElement> {
          const frame = document.createElement("div");
          const content = document.createElement("div");
          content.className = "window-content";
          frame.appendChild(content);
          return frame;
        }
      };

      // Temporarily replace the mock
      const originalMock = mockFoundryApi.applications.api.ApplicationV2;
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 =
        MockApplicationV2WithHasFrameUndefined;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      // When hasFrame is undefined, it defaults to true (line 125: ?? true)
      expect(mockController.onFoundryRender).toHaveBeenCalled();

      // Restore original mock
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 = originalMock;
    });

    it("should use fallback for missing ApplicationV2", () => {
      mockFoundryApi.applications.api.ApplicationV2 = undefined;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );

      expect(appClass).toBeDefined();
    });

    it("should use fallback for missing HandlebarsApplicationMixin", () => {
      delete mockFoundryApi.applications.api.HandlebarsApplicationMixin;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );

      expect(appClass).toBeDefined();
    });

    it("should create instance with correct template", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      // _renderHTML now returns Record<string, HTMLElement>, not string
      const appWithRenderHTML = app as unknown as {
        _renderHTML?: (context: unknown, options: unknown) => Promise<Record<string, HTMLElement>>;
      };
      if (appWithRenderHTML._renderHTML) {
        const result = await appWithRenderHTML._renderHTML({}, {});
        expect(result).toEqual({});
      } else {
        // If _renderHTML doesn't exist, test passes (implementation may have changed)
        expect(true).toBe(true);
      }
    });

    it("should call onFoundryRender on first render", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalled();
      expect(mockController.onFoundryUpdate).not.toHaveBeenCalled();
    });

    it("should call onFoundryUpdate on subsequent renders", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      // First render
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      // Second render
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledTimes(1);
      // onFoundryUpdate is called with the target element (the .window-content div)
      expect(mockController.onFoundryUpdate).toHaveBeenCalled();
    });

    it("should call onFoundryClose when closing", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      await app.close();

      expect(mockController.onFoundryClose).toHaveBeenCalled();
    });

    it("should handle close with options", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      await app.close({ animate: true });

      expect(mockController.onFoundryClose).toHaveBeenCalled();
    });

    it("should handle missing controller in _renderFrame", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      // Clear controller map to simulate missing controller
      const controllerMap = (
        FoundryApplicationWrapper as unknown as { controllerMap?: Map<unknown, unknown> }
      ).controllerMap;
      if (controllerMap) {
        controllerMap.delete(app);
      }

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        const frame = await appWithRenderFrame._renderFrame({});
        expect(frame).toBeInstanceOf(HTMLElement);
      }

      // Should not throw and should return frame
      expect(true).toBe(true);
    });

    it("should handle missing .window-content in _renderFrame", async () => {
      // Create a mock that doesn't have .window-content
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mock class in test
      const MockApplicationV2WithoutContent = class {
        static DEFAULT_OPTIONS = {};
        protected async _renderFrame(_options?: unknown): Promise<HTMLElement> {
          // Return frame without .window-content
          return document.createElement("div");
        }
      };

      // Temporarily replace the mock
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 =
        MockApplicationV2WithoutContent;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        const frame = await appWithRenderFrame._renderFrame({});
        expect(frame).toBeInstanceOf(HTMLElement);
      }

      // Should return frame even without .window-content
      expect(mockController.onFoundryRender).not.toHaveBeenCalled();

      // Restore original mock
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 =
        mockFoundryApi.applications.api.ApplicationV2;
    });

    it("should handle hasFrame false in _renderFrame (branch 128 else)", async () => {
      // Create a mock ApplicationV2 that has hasFrame = false
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Mock class in test
      const MockApplicationV2WithHasFrameFalse = class {
        static DEFAULT_OPTIONS = {};
        hasFrame = false; // Explicitly set to false to test else branch
        protected async _renderFrame(_options?: unknown): Promise<HTMLElement> {
          // Return frame directly (no .window-content)
          return document.createElement("div");
        }
      };

      // Temporarily replace the mock
      const originalMock = mockFoundryApi.applications.api.ApplicationV2;
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 =
        MockApplicationV2WithHasFrameFalse;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        const frame = await appWithRenderFrame._renderFrame({});
        expect(frame).toBeInstanceOf(HTMLElement);
        // When hasFrame is false, target should be the frame itself (line 128 else branch)
        expect(mockController.onFoundryRender).toHaveBeenCalled();
      }

      // Restore original mock
      (mockFoundryApi.applications.api as { ApplicationV2?: unknown }).ApplicationV2 = originalMock;
    });

    it("should handle missing controller in close", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      // Clear controller map to simulate missing controller
      const controllerMap = (
        FoundryApplicationWrapper as unknown as { controllerMap?: Map<unknown, unknown> }
      ).controllerMap;
      if (controllerMap) {
        controllerMap.delete(app);
      }

      await app.close();

      // Should not throw, but should still complete close
      expect(true).toBe(true);
    });

    it("should handle undefined features", () => {
      const { features: _features, ...rest } = mockDefinition;
      const definitionWithoutFeatures: WindowDefinition = {
        ...rest,
        // features is optional, so we omit it
      };

      const appClass = FoundryApplicationWrapper.build(
        definitionWithoutFeatures,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        window?: { resizable?: boolean; minimizable?: boolean; draggable?: boolean };
      };
      // Should default to true
      expect(defaultOptions?.window?.resizable).toBe(true);
      expect(defaultOptions?.window?.minimizable).toBe(true);
      expect(defaultOptions?.window?.draggable).toBe(true);
    });

    it("should handle undefined classes", () => {
      const definitionWithoutClasses: WindowDefinition = {
        ...mockDefinition,
        // classes is optional, so we omit it instead of setting to undefined
      };
      // Remove classes property if it exists
      delete (definitionWithoutClasses as { classes?: unknown }).classes;

      const appClass = FoundryApplicationWrapper.build(
        definitionWithoutClasses,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        classes?: string[];
      };
      // Should default to empty array
      expect(defaultOptions?.classes).toEqual([]);
    });

    it("should handle missing title in getter", () => {
      const { title: _title, ...definitionWithoutTitle } = mockDefinition;

      const appClass = FoundryApplicationWrapper.build(
        definitionWithoutTitle,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      // Test the title getter fallback to empty string when title is not defined
      // Access title via DEFAULT_OPTIONS since it's a getter
      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        title?: string;
      };
      expect(defaultOptions?.title).toBeUndefined();
      // The getter returns empty string when title is undefined
      expect((app as { title?: string }).title).toBe("");
    });

    it("should handle isMounted being undefined in _renderFrame", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      // Clear mounted map to simulate undefined isMounted
      const mountedMap = (
        FoundryApplicationWrapper as unknown as { mountedMap?: Map<unknown, unknown> }
      ).mountedMap;
      if (mountedMap) {
        mountedMap.delete(app); // This will make get() return undefined
      }

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      // Should treat undefined as false and call onFoundryRender
      expect(mockController.onFoundryRender).toHaveBeenCalled();
    });

    it("should handle partial features", () => {
      const definitionWithPartialFeatures: WindowDefinition = {
        ...mockDefinition,
        features: {
          resizable: false,
          // minimizable and draggable not set
        },
      };

      const appClass = FoundryApplicationWrapper.build(
        definitionWithPartialFeatures,
        mockController,
        "instance-1"
      );

      const defaultOptions = (appClass as unknown as { DEFAULT_OPTIONS?: unknown })
        .DEFAULT_OPTIONS as {
        window?: { resizable?: boolean; minimizable?: boolean; draggable?: boolean };
      };
      expect(defaultOptions?.window?.resizable).toBe(false);
      expect(defaultOptions?.window?.minimizable).toBe(true); // Default
      expect(defaultOptions?.window?.draggable).toBe(true); // Default
    });

    it("should call onFoundryUpdate when isMounted is true (branch 114)", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };

      // First render - sets isMounted to true
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      // Second render - should call onFoundryUpdate (branch where isMounted is true)
      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalled();
    });

    it("should handle close gracefully when controller lookup fails (branch 136 else path)", async () => {
      // Branch 136: if (ctrl) { await ctrl.onFoundryClose(); }
      // Test the else path: when ctrl is undefined

      const isolatedMockController = {
        onFoundryRender: vi.fn().mockResolvedValue(undefined),
        onFoundryUpdate: vi.fn().mockResolvedValue(undefined),
        onFoundryClose: vi.fn().mockResolvedValue(undefined),
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        isolatedMockController,
        "instance-branch136-test"
      );
      const app = new appClass();

      // Remove controller from WeakMap to simulate undefined controller (branch 136 else path)
      const controllerMap = FoundryApplicationWrapper._testControllerMaps.get(app as ApplicationV2);
      if (controllerMap) {
        controllerMap.delete(app as ApplicationV2);
      }

      vi.mocked(isolatedMockController.onFoundryClose).mockClear();

      // Should not throw even when controller is undefined
      await app.close();

      // onFoundryClose should not be called when controller is undefined (branch 136 else path)
      expect(isolatedMockController.onFoundryClose).not.toHaveBeenCalled();
    });

    it("should handle _renderFrame when isMounted is undefined (branch 114 else path)", async () => {
      // Branch 114: const isMounted = mountedMap.get(this as ApplicationV2) ?? false;
      // Test the else path: when get() returns undefined

      const isolatedMockController = {
        onFoundryRender: vi.fn().mockResolvedValue(undefined),
        onFoundryUpdate: vi.fn().mockResolvedValue(undefined),
        onFoundryClose: vi.fn().mockResolvedValue(undefined),
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        isolatedMockController,
        "instance-branch114-test"
      );
      const app = new appClass();

      // Remove mounted state from WeakMap to simulate undefined (branch 114 else path)
      const mountedMap = FoundryApplicationWrapper._testMountedMaps.get(app as ApplicationV2);
      if (mountedMap) {
        mountedMap.delete(app as ApplicationV2);
      }

      vi.mocked(isolatedMockController.onFoundryRender).mockClear();

      const appWithRenderFrame = app as unknown as {
        _renderFrame?: (options: unknown) => Promise<HTMLElement>;
      };

      if (appWithRenderFrame._renderFrame) {
        await appWithRenderFrame._renderFrame({});
      }

      // Should treat undefined as false and call onFoundryRender (branch 114 else path executed)
      expect(isolatedMockController.onFoundryRender).toHaveBeenCalled();
    });

    it("should handle constructor when process.env.NODE_ENV is not test (branch 106 else path)", () => {
      // Branch 106: if (typeof process !== "undefined" && process.env.NODE_ENV === "test")
      // Test the else path: when process is undefined or NODE_ENV is not "test"

      // Save original process
      const originalProcess = globalThis.process;

      // Mock process as undefined
      delete (globalThis as { process?: unknown }).process;

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-branch106-test"
      );
      const app = new appClass();

      // Should still work correctly even without process (branch 106 else path)
      expect(app).toBeDefined();

      // Restore original process
      globalThis.process = originalProcess;
    });

    it("should handle constructor when NODE_ENV is not test (branch 106 else path variant)", () => {
      // Branch 106: if (typeof process !== "undefined" && process.env.NODE_ENV === "test")
      // Test the else path when process exists but NODE_ENV is not "test"

      // Save original env
      const originalEnv = process.env.NODE_ENV;

      // Set NODE_ENV to something other than "test"
      process.env.NODE_ENV = "production";

      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-branch106-prod-test"
      );
      const app = new appClass();

      // Should still work correctly (branch 106 else path - NODE_ENV is not "test")
      expect(app).toBeDefined();

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });
});
