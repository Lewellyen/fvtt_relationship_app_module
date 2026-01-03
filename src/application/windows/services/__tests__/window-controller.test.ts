import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowController } from "../window-controller";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IStateStore } from "@/domain/windows/ports/state-store-port.interface";
import type { IStatePortFactory } from "@/application/windows/ports/state-port-factory-port.interface";
import type { IActionDispatcher } from "@/domain/windows/ports/action-dispatcher-port.interface";
import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { IBindingEngine } from "@/domain/windows/ports/binding-engine-port.interface";
import type { IViewModelBuilder } from "@/domain/windows/ports/view-model-builder-port.interface";
import type { IEventBus } from "@/domain/windows/ports/event-bus-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { IWindowState } from "@/domain/windows/types/view-model.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("WindowController", () => {
  let controller: WindowController;
  let mockRegistry: IWindowRegistry;
  let mockStateStore: IStateStore;
  let mockStatePortFactory: IStatePortFactory;
  let mockActionDispatcher: IActionDispatcher;
  let mockRendererRegistry: IRendererRegistry;
  let mockBindingEngine: IBindingEngine;
  let mockViewModelBuilder: IViewModelBuilder;
  let mockEventBus: IEventBus;
  let mockRemoteSyncGate: IRemoteSyncGate;
  let mockPersistAdapter: IPersistAdapter;
  let mockStatePort: IWindowState<Record<string, unknown>>;
  let mockDefinition: WindowDefinition;

  beforeEach(() => {
    mockStatePort = {
      get: vi.fn().mockReturnValue({ count: 0 }),
      patch: vi.fn().mockReturnValue(ok(undefined)),
      subscribe: vi.fn(),
    };

    mockRegistry = {
      getDefinition: vi.fn(),
      registerInstance: vi.fn(),
      registerDefinition: vi.fn(),
      getInstance: vi.fn(),
      unregisterInstance: vi.fn(),
      listInstances: vi.fn(),
      listInstancesByDefinition: vi.fn(),
    } as unknown as IWindowRegistry;

    mockStateStore = {
      set: vi.fn().mockReturnValue(ok(undefined)),
      get: vi.fn().mockReturnValue(ok(undefined)),
      getAll: vi.fn().mockReturnValue(ok({})),
      clear: vi.fn(),
    } as unknown as IStateStore;

    mockStatePortFactory = {
      create: vi.fn().mockReturnValue(mockStatePort),
    } as unknown as IStatePortFactory;

    mockActionDispatcher = {
      dispatch: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as IActionDispatcher;

    mockRendererRegistry = {
      get: vi.fn().mockReturnValue(
        ok({
          mount: vi.fn().mockReturnValue(ok({})),
          unmount: vi.fn(),
          update: vi.fn(),
        })
      ),
    } as unknown as IRendererRegistry;

    mockBindingEngine = {
      initialize: vi.fn().mockReturnValue(ok(undefined)),
      sync: vi.fn().mockResolvedValue(ok(undefined)),
      getNormalizedBindings: vi.fn().mockReturnValue([]),
    } as unknown as IBindingEngine;

    mockViewModelBuilder = {
      build: vi.fn().mockImplementation((_definition, _state, actions) => ({
        state: mockStatePort,
        computed: {},
        actions: actions || {},
      })),
    } as unknown as IViewModelBuilder;

    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(() => () => {}),
      off: vi.fn(),
      once: vi.fn(),
    } as unknown as IEventBus;

    mockRemoteSyncGate = {
      makePersistMeta: vi.fn().mockReturnValue({}),
      isFromWindow: vi.fn().mockReturnValue(false),
      getClientId: vi.fn().mockReturnValue("client-1"),
    } as unknown as IRemoteSyncGate;

    mockPersistAdapter = {
      save: vi.fn().mockResolvedValue(ok(undefined)),
      load: vi.fn().mockResolvedValue(ok({})),
    } as unknown as IPersistAdapter;

    mockDefinition = {
      definitionId: "test-window",
      title: "Test Window",
      component: {
        type: "svelte",
        component: vi.fn(),
        props: {},
      },
    };

    controller = new WindowController(
      "instance-1",
      "test-window",
      mockDefinition,
      mockRegistry,
      mockStateStore,
      mockStatePortFactory,
      mockActionDispatcher,
      mockRendererRegistry,
      mockBindingEngine,
      mockViewModelBuilder,
      mockEventBus,
      mockRemoteSyncGate,
      mockPersistAdapter
    );
  });

  describe("constructor", () => {
    it("should create controller with correct properties", () => {
      expect(controller.instanceId).toBe("instance-1");
      expect(controller.definitionId).toBe("test-window");
      expect(controller.definition).toBe(mockDefinition);
    });

    it("should create statePort on initialization", () => {
      expect(mockStatePortFactory.create).toHaveBeenCalled();
    });
  });

  describe("state getter", () => {
    it("should return state from stateStore", () => {
      vi.mocked(mockStateStore.getAll).mockReturnValue(ok({ count: 42 }));

      const state = controller.state;

      expect(state).toEqual({ count: 42 });
    });

    it("should return empty object if getAll fails", () => {
      vi.mocked(mockStateStore.getAll).mockReturnValue(
        err({
          code: "StateStoreError",
          message: "Failed to get state",
        })
      );

      const state = controller.state;

      expect(state).toEqual({});
    });
  });

  describe("onFoundryRender", () => {
    it("should render successfully", async () => {
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);

      const result = await controller.onFoundryRender(element);

      expectResultOk(result);
      expect(mockBindingEngine.initialize).toHaveBeenCalled();
      expect(mockViewModelBuilder.build).toHaveBeenCalled();
      expect(mockRendererRegistry.get).toHaveBeenCalled();
      expect(mockEventBus.emit).toHaveBeenCalledWith("window:rendered", {
        instanceId: "instance-1",
      });
    });

    it("should return ok if already mounted", async () => {
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);

      // First render
      await controller.onFoundryRender(element);

      // Second render - should return ok immediately
      const result = await controller.onFoundryRender(element);

      expectResultOk(result);
      // Should not call initialize again
      expect(mockBindingEngine.initialize).toHaveBeenCalledTimes(1);
    });

    it("should return error if binding initialization fails", async () => {
      vi.mocked(mockBindingEngine.initialize).mockReturnValue(
        err({
          code: "BindingError",
          message: "Failed to initialize bindings",
        })
      );

      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);

      const result = await controller.onFoundryRender(element);

      expectResultErr(result);
      expect(result.error.code).toBe("BindingError");
    });

    it("should return error if renderer not found", async () => {
      vi.mocked(mockRendererRegistry.get).mockReturnValue(
        err({
          code: "RendererNotFound",
          message: "Renderer not found",
        })
      );

      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);

      const result = await controller.onFoundryRender(element);

      expectResultErr(result);
      expect(result.error.code).toBe("RendererNotFound");
    });

    it("should return error if mount point not found", async () => {
      const element = document.createElement("div");
      // No mount point

      const result = await controller.onFoundryRender(element);

      expectResultErr(result);
      expect(result.error.code).toBe("MountPointNotFound");
    });

    it("should return error if mount fails", async () => {
      vi.mocked(mockRendererRegistry.get).mockReturnValue(
        ok({
          mount: vi.fn().mockReturnValue(
            err({
              code: "MountFailed",
              message: "Failed to mount",
            })
          ),
          unmount: vi.fn(),
          update: vi.fn(),
        })
      );

      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);

      const result = await controller.onFoundryRender(element);

      expectResultErr(result);
      expect(result.error.code).toBe("MountFailed");
    });
  });

  describe("onFoundryUpdate", () => {
    it("should return ok", async () => {
      const element = document.createElement("div");

      const result = await controller.onFoundryUpdate(element);

      expectResultOk(result);
    });
  });

  describe("onFoundryClose", () => {
    it("should close successfully", async () => {
      // First render to set up component
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      const result = await controller.onFoundryClose();

      expectResultOk(result);
      expect(mockEventBus.emit).toHaveBeenCalledWith("window:closed", {
        instanceId: "instance-1",
      });
    });

    it("should unmount component if mounted", async () => {
      const mockUnmount = vi.fn();
      vi.mocked(mockRendererRegistry.get).mockReturnValue(
        ok({
          mount: vi.fn().mockReturnValue(ok({})),
          unmount: mockUnmount,
          update: vi.fn(),
        })
      );

      // First render to set up component
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      const result = await controller.onFoundryClose();

      expectResultOk(result);
      expect(mockUnmount).toHaveBeenCalled();
    });

    it("should persist if persist config exists", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.onFoundryClose();

      expectResultOk(result);
      expect(mockPersistAdapter.save).toHaveBeenCalled();
    });

    it("should not persist if persist config does not exist", async () => {
      const result = await controller.onFoundryClose();

      expectResultOk(result);
      expect(mockPersistAdapter.save).not.toHaveBeenCalled();
    });

    it("should handle close when component is not mounted", async () => {
      // Don't render first
      const result = await controller.onFoundryClose();

      expectResultOk(result);
    });

    it("should handle close when renderer cannot be retrieved", async () => {
      // First render to set up component
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      // Mock rendererRegistry.get to fail
      vi.mocked(mockRendererRegistry.get).mockReturnValue(
        err({
          code: "RendererNotFound",
          message: "Renderer not found",
        })
      );

      const result = await controller.onFoundryClose();

      // Should still return ok (graceful degradation)
      expectResultOk(result);
      // componentInstance should still be cleared
      expect(controller.getViewModel()).toBeDefined();
    });

    it("should handle close when componentInstance becomes null between checks", async () => {
      // First render to set up component
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      // Access private componentInstance property using type assertion
      const controllerAny = controller as any;
      const originalComponentInstance = controllerAny.componentInstance;

      // Mock rendererRegistry.get to succeed, but set componentInstance to null
      // between the outer check (line 130) and inner check (line 133)
      // This simulates the defensive check in line 133
      vi.mocked(mockRendererRegistry.get).mockImplementation(() => {
        // Set componentInstance to null AFTER the outer check (line 130) passes
        // but BEFORE the inner check (line 133) - this triggers the else branch
        controllerAny.componentInstance = null;
        return ok({
          mount: vi.fn().mockReturnValue(ok({})),
          unmount: vi.fn(),
          update: vi.fn(),
        });
      });

      // Ensure componentInstance is set before calling onFoundryClose
      controllerAny.componentInstance = originalComponentInstance;

      const result = await controller.onFoundryClose();

      // Should still return ok (graceful degradation)
      expectResultOk(result);
      // componentInstance should be cleared
      expect(controllerAny.componentInstance).toBeNull();
    });
  });

  describe("updateStateLocal", () => {
    it("should update state successfully", async () => {
      const result = await controller.updateStateLocal({ count: 1 });

      expectResultOk(result);
      expect(mockStatePort.patch).toHaveBeenCalledWith({ count: 1 });
      expect(mockEventBus.emit).toHaveBeenCalledWith("state:updated", {
        instanceId: "instance-1",
        key: "count",
        value: 1,
      });
    });

    it("should persist if persist option is true", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.updateStateLocal({ count: 1 }, { persist: true });

      expectResultOk(result);
      expect(mockPersistAdapter.save).toHaveBeenCalled();
    });

    it("should sync bindings if sync option is not none", async () => {
      const result = await controller.updateStateLocal({ count: 1 }, { sync: "immediate" });

      expectResultOk(result);
      expect(mockBindingEngine.sync).toHaveBeenCalledWith("instance-1", "immediate");
    });

    it("should return error if persist fails", async () => {
      vi.mocked(mockPersistAdapter.save).mockResolvedValue(
        err({
          code: "SaveFailed",
          message: "Failed to save",
        })
      );

      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.updateStateLocal({ count: 1 }, { persist: true });

      expectResultErr(result);
      expect(result.error.code).toBe("SaveFailed");
    });

    it("should return error if sync fails", async () => {
      vi.mocked(mockBindingEngine.sync).mockResolvedValue(
        err({
          code: "SyncFailed",
          message: "Failed to sync",
        })
      );

      const result = await controller.updateStateLocal({ count: 1 }, { sync: "immediate" });

      expectResultErr(result);
      expect(result.error.code).toBe("SyncFailed");
    });

    it("should emit events for all updated keys", async () => {
      const result = await controller.updateStateLocal({ count: 1, name: "test" });

      expectResultOk(result);
      expect(mockEventBus.emit).toHaveBeenCalledWith("state:updated", {
        instanceId: "instance-1",
        key: "count",
        value: 1,
      });
      expect(mockEventBus.emit).toHaveBeenCalledWith("state:updated", {
        instanceId: "instance-1",
        key: "name",
        value: "test",
      });
    });
  });

  describe("applyRemotePatch", () => {
    it("should apply patch successfully", async () => {
      const result = await controller.applyRemotePatch({ count: 1 });

      expectResultOk(result);
      expect(mockStatePort.patch).toHaveBeenCalledWith({ count: 1 });
      expect(mockEventBus.emit).toHaveBeenCalledWith("state:updated", {
        instanceId: "instance-1",
        key: "count",
        value: 1,
      });
    });

    it("should emit events for all patched keys", async () => {
      const result = await controller.applyRemotePatch({ count: 1, name: "test" });

      expectResultOk(result);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe("dispatchAction", () => {
    it("should dispatch action successfully", async () => {
      const result = await controller.dispatchAction("test-action");

      expectResultOk(result);
      expect(mockActionDispatcher.dispatch).toHaveBeenCalledWith("test-action", {
        windowInstanceId: "instance-1",
        state: {},
      });
    });

    it("should dispatch action with controlId", async () => {
      const result = await controller.dispatchAction("test-action", "control-1");

      expectResultOk(result);
      expect(mockActionDispatcher.dispatch).toHaveBeenCalledWith("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });
    });

    it("should dispatch action with event", async () => {
      const event = new Event("click");
      const result = await controller.dispatchAction("test-action", undefined, event);

      expectResultOk(result);
      expect(mockActionDispatcher.dispatch).toHaveBeenCalledWith("test-action", {
        windowInstanceId: "instance-1",
        state: {},
        event,
      });
    });

    it("should return error if dispatch fails", async () => {
      vi.mocked(mockActionDispatcher.dispatch).mockResolvedValue(
        err({
          code: "ActionFailed",
          message: "Action failed",
        })
      );

      const result = await controller.dispatchAction("test-action");

      expectResultErr(result);
      expect(result.error.code).toBe("ActionFailed");
    });
  });

  describe("persist", () => {
    it("should persist successfully", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.persist();

      expectResultOk(result);
      expect(mockPersistAdapter.save).toHaveBeenCalled();
    });

    it("should return error if no persist config", async () => {
      const result = await controller.persist();

      expectResultErr(result);
      expect(result.error.code).toBe("NoPersistConfig");
    });

    it("should return error if no persist adapter", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithoutAdapter = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        undefined
      );

      const result = await controllerWithoutAdapter.persist();

      expectResultErr(result);
      expect(result.error.code).toBe("NoPersistAdapter");
    });

    it("should use provided meta if available", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const customMeta = { originClientId: "custom-client", originWindowInstanceId: "instance-1" };
      const result = await controllerWithPersist.persist(customMeta);

      expectResultOk(result);
      expect(mockPersistAdapter.save).toHaveBeenCalledWith(
        definitionWithPersist.persist,
        expect.any(Object),
        customMeta
      );
    });

    it("should use remoteSyncGate meta if not provided", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.persist();

      expectResultOk(result);
      expect(mockRemoteSyncGate.makePersistMeta).toHaveBeenCalledWith("instance-1");
    });

    it("should return error if save fails", async () => {
      vi.mocked(mockPersistAdapter.save).mockResolvedValue(
        err({
          code: "SaveFailed",
          message: "Failed to save",
        })
      );

      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.persist();

      expectResultErr(result);
      expect(result.error.code).toBe("SaveFailed");
    });
  });

  describe("restore", () => {
    it("should restore successfully", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
          restoreOnOpen: true,
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      vi.mocked(mockPersistAdapter.load).mockResolvedValue(ok({ count: 42 }));

      const result = await controllerWithPersist.restore();

      expectResultOk(result);
      expect(mockPersistAdapter.load).toHaveBeenCalled();
      expect(mockStatePort.patch).toHaveBeenCalledWith({ count: 42 });
    });

    it("should return ok if restoreOnOpen is false", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
          restoreOnOpen: false,
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.restore();

      expectResultOk(result);
      expect(mockPersistAdapter.load).not.toHaveBeenCalled();
    });

    it("should return ok if no persist config", async () => {
      const result = await controller.restore();

      expectResultOk(result);
    });

    it("should return error if no persist adapter", async () => {
      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
          restoreOnOpen: true,
        },
      };

      const controllerWithoutAdapter = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        undefined
      );

      const result = await controllerWithoutAdapter.restore();

      expectResultErr(result);
      expect(result.error.code).toBe("NoPersistAdapter");
    });

    it("should return error if load fails", async () => {
      vi.mocked(mockPersistAdapter.load).mockResolvedValue(
        err({
          code: "LoadFailed",
          message: "Failed to load",
        })
      );

      const definitionWithPersist: WindowDefinition = {
        ...mockDefinition,
        persist: {
          type: "flag",
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
          restoreOnOpen: true,
        },
      };

      const controllerWithPersist = new WindowController(
        "instance-1",
        "test-window",
        definitionWithPersist,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const result = await controllerWithPersist.restore();

      expectResultErr(result);
      expect(result.error.code).toBe("LoadFailed");
    });
  });

  describe("getViewModel", () => {
    it("should return cached viewModel if available", () => {
      // First render to cache viewModel
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      controller.onFoundryRender(element);

      const viewModel = controller.getViewModel();

      expect(viewModel).toBeDefined();
      expect(mockViewModelBuilder.build).toHaveBeenCalledTimes(1); // Only called once during render
    });

    it("should build new viewModel if not cached", () => {
      const viewModel = controller.getViewModel();

      expect(viewModel).toBeDefined();
      expect(mockViewModelBuilder.build).toHaveBeenCalled();
    });
  });

  describe("createActions", () => {
    it("should create actions from definition", () => {
      const definitionWithActions: WindowDefinition = {
        ...mockDefinition,
        actions: [
          {
            id: "action-1",
            label: "Action 1",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
          {
            id: "action-2",
            label: "Action 2",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      const controllerWithActions = new WindowController(
        "instance-1",
        "test-window",
        definitionWithActions,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const viewModel = controllerWithActions.getViewModel();

      expect(viewModel.actions).toBeDefined();
      expect(typeof viewModel.actions["action-1"]).toBe("function");
      expect(typeof viewModel.actions["action-2"]).toBe("function");
    });

    it("should handle definition without actions", () => {
      const viewModel = controller.getViewModel();

      expect(viewModel.actions).toBeDefined();
      expect(Object.keys(viewModel.actions)).toHaveLength(0);
    });

    it("should call dispatchAction when action is invoked", async () => {
      const definitionWithActions: WindowDefinition = {
        ...mockDefinition,
        actions: [
          {
            id: "action-1",
            label: "Action 1",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      const controllerWithActions = new WindowController(
        "instance-1",
        "test-window",
        definitionWithActions,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      const viewModel = controllerWithActions.getViewModel();

      expect(viewModel.actions).toBeDefined();
      expect(typeof viewModel.actions["action-1"]).toBe("function");

      // Call the action
      const action = viewModel.actions["action-1"];
      if (action) {
        action();
      }

      // Wait for async dispatch
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockActionDispatcher.dispatch).toHaveBeenCalledWith(
        "action-1",
        expect.objectContaining({
          windowInstanceId: "instance-1",
        })
      );
    });
  });

  describe("registerEventListeners", () => {
    it("should register event listener for control:action", async () => {
      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      expect(mockEventBus.on).toHaveBeenCalledWith("control:action", expect.any(Function));
    });

    it("should dispatch action when control:action event is emitted", async () => {
      let eventHandler: ((payload: unknown) => void) | undefined;
      vi.mocked(mockEventBus.on).mockImplementation((event, handler) => {
        if (event === "control:action") {
          eventHandler = handler as (payload: unknown) => void;
        }
        return () => {};
      });

      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      // Emit event
      if (eventHandler) {
        eventHandler({
          instanceId: "instance-1",
          actionId: "test-action",
          controlId: "control-1",
        });
      }

      expect(mockActionDispatcher.dispatch).toHaveBeenCalledWith("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });
    });

    it("should not dispatch action if instanceId does not match", async () => {
      let eventHandler: ((payload: unknown) => void) | undefined;
      vi.mocked(mockEventBus.on).mockImplementation((event, handler) => {
        if (event === "control:action") {
          eventHandler = handler as (payload: unknown) => void;
        }
        return () => {};
      });

      const element = document.createElement("div");
      const mountPoint = document.createElement("div");
      mountPoint.id = "svelte-mount-point";
      element.appendChild(mountPoint);
      await controller.onFoundryRender(element);

      // Emit event with different instanceId
      if (eventHandler) {
        eventHandler({
          instanceId: "other-instance",
          actionId: "test-action",
          controlId: "control-1",
        });
      }

      // Should not be called because instanceId doesn't match
      expect(mockActionDispatcher.dispatch).not.toHaveBeenCalled();
    });
  });

  describe("createStatePort", () => {
    it("should create statePort with initial state from stateStore", () => {
      vi.mocked(mockStateStore.getAll).mockReturnValue(ok({ count: 42 }));

      const _newController = new WindowController(
        "instance-2",
        "test-window",
        mockDefinition,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      expect(mockStatePortFactory.create).toHaveBeenCalledWith("instance-2", { count: 42 });
    });

    it("should create statePort with empty object if getAll fails", () => {
      vi.mocked(mockStateStore.getAll).mockReturnValue(
        err({
          code: "StateStoreError",
          message: "Failed to get state",
        })
      );

      const _newController = new WindowController(
        "instance-3",
        "test-window",
        mockDefinition,
        mockRegistry,
        mockStateStore,
        mockStatePortFactory,
        mockActionDispatcher,
        mockRendererRegistry,
        mockBindingEngine,
        mockViewModelBuilder,
        mockEventBus,
        mockRemoteSyncGate,
        mockPersistAdapter
      );

      expect(mockStatePortFactory.create).toHaveBeenCalledWith("instance-3", {});
    });
  });
});
