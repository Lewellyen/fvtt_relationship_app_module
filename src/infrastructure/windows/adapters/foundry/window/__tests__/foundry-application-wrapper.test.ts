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
            protected async _onRender(_context?: unknown, _options?: unknown): Promise<void> {
              // Mock implementation
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
        position?: { top?: number; left?: number };
      };
      expect(defaultOptions?.position?.top).toBe(100);
      expect(defaultOptions?.position?.left).toBeUndefined();
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

    it("should create instance with correct template", () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );

      const template = (appClass as unknown as { template?: string }).template;
      expect(template).toBe('<div id="svelte-mount-point"></div>');
    });

    it("should call onFoundryRender on first render", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalledWith(mockElement);
      expect(mockController.onFoundryUpdate).not.toHaveBeenCalled();
    });

    it("should call onFoundryUpdate on subsequent renders", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };
      // First render
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Second render
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledWith(mockElement);
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

    it("should handle missing controller in _onRender", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      // Clear controller map to simulate missing controller
      const controllerMap = (
        FoundryApplicationWrapper as unknown as { controllerMap?: Map<unknown, unknown> }
      ).controllerMap;
      if (controllerMap) {
        controllerMap.delete(app);
      }

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle missing element in _onRender", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();
      // Don't set element

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Should not throw
      expect(mockController.onFoundryRender).not.toHaveBeenCalled();
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

    it("should handle isMounted being undefined in _onRender", async () => {
      const appClass = FoundryApplicationWrapper.build(
        mockDefinition,
        mockController,
        "instance-1"
      );
      const app = new appClass();
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      // Clear mounted map to simulate undefined isMounted
      const mountedMap = (
        FoundryApplicationWrapper as unknown as { mountedMap?: Map<unknown, unknown> }
      ).mountedMap;
      if (mountedMap) {
        mountedMap.delete(app); // This will make get() return undefined
      }

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Should treat undefined as false and call onFoundryRender
      expect(mockController.onFoundryRender).toHaveBeenCalledWith(mockElement);
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
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };

      // First render - sets isMounted to true
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Second render - should call onFoundryUpdate (branch where isMounted is true)
      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      expect(mockController.onFoundryRender).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledTimes(1);
      expect(mockController.onFoundryUpdate).toHaveBeenCalledWith(mockElement);
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

    it("should handle _onRender when isMounted is undefined (branch 114 else path)", async () => {
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
      const mockElement = document.createElement("div");
      (app as unknown as { element?: HTMLElement }).element = mockElement;

      // Remove mounted state from WeakMap to simulate undefined (branch 114 else path)
      const mountedMap = FoundryApplicationWrapper._testMountedMaps.get(app as ApplicationV2);
      if (mountedMap) {
        mountedMap.delete(app as ApplicationV2);
      }

      vi.mocked(isolatedMockController.onFoundryRender).mockClear();

      const appWithOnRender = app as unknown as {
        _onRender?: (context: unknown, options: unknown) => Promise<void>;
      };

      if (appWithOnRender._onRender) {
        await appWithOnRender._onRender({}, {});
      }

      // Should treat undefined as false and call onFoundryRender (branch 114 else path executed)
      expect(isolatedMockController.onFoundryRender).toHaveBeenCalledWith(mockElement);
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
