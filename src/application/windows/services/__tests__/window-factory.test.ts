import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowFactory } from "../window-factory";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IFoundryWindowAdapter } from "@/domain/windows/ports/foundry-window-adapter.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";
import {
  windowRegistryToken,
  stateStoreToken,
  statePortFactoryToken,
  actionDispatcherToken,
  rendererRegistryToken,
  bindingEngineToken,
  viewModelBuilderToken,
  eventBusToken,
  remoteSyncGateToken,
  persistAdapterToken,
} from "../../tokens/window.tokens";

describe("WindowFactory", () => {
  let factory: WindowFactory;
  let mockRegistry: IWindowRegistry;
  let mockFoundryWindowAdapter: IFoundryWindowAdapter;
  let mockContainer: PlatformContainerPort;
  let mockDefinition: WindowDefinition;

  beforeEach(() => {
    mockRegistry = {
      getDefinition: vi.fn(),
      registerInstance: vi.fn(),
      registerDefinition: vi.fn(),
      getInstance: vi.fn(),
      unregisterInstance: vi.fn(),
      listInstances: vi.fn(),
      listInstancesByDefinition: vi.fn(),
    } as unknown as IWindowRegistry;

    mockFoundryWindowAdapter = {
      buildApplicationWrapper: vi.fn(),
      renderWindow: vi.fn(),
      closeWindow: vi.fn(),
    } as unknown as IFoundryWindowAdapter;

    mockDefinition = {
      definitionId: "test-window",
      title: "Test Window",
      component: {
        type: "svelte",
        component: vi.fn(),
        props: {},
      },
    };

    // Mock container with all required dependencies
    const resolveService = (token: symbol) => {
      if (token === windowRegistryToken) return mockRegistry;
      if (token === stateStoreToken)
        return {
          set: vi.fn().mockReturnValue(ok(undefined)),
          get: vi.fn(),
          getAll: vi.fn().mockReturnValue(ok({})),
          clear: vi.fn(),
        };
      if (token === statePortFactoryToken)
        return {
          create: vi.fn().mockReturnValue({
            get: vi.fn(),
            patch: vi.fn().mockReturnValue(ok(undefined)),
            subscribe: vi.fn(),
          }),
        };
      if (token === actionDispatcherToken)
        return {
          dispatch: vi.fn().mockResolvedValue(ok(undefined)),
        };
      if (token === rendererRegistryToken)
        return {
          get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
        };
      if (token === bindingEngineToken)
        return {
          initialize: vi.fn().mockReturnValue(ok(undefined)),
          sync: vi.fn().mockResolvedValue(ok(undefined)),
          getNormalizedBindings: vi.fn().mockReturnValue([]),
        };
      if (token === viewModelBuilderToken)
        return {
          build: vi.fn().mockReturnValue({
            state: { get: vi.fn(), patch: vi.fn(), subscribe: vi.fn() },
            computed: {},
            actions: {},
          }),
        };
      if (token === eventBusToken)
        return {
          emit: vi.fn(),
          on: vi.fn(() => () => {}),
          off: vi.fn(),
          once: vi.fn(),
        };
      if (token === remoteSyncGateToken)
        return {
          makePersistMeta: vi.fn().mockReturnValue({}),
          isFromWindow: vi.fn().mockReturnValue(false),
          getClientId: vi.fn().mockReturnValue("client-1"),
        };
      if (token === persistAdapterToken) return undefined;
      return undefined;
    };

    mockContainer = {
      resolve: vi.fn((token) => resolveService(token)),
      resolveWithError: vi.fn((token) => {
        const service = resolveService(token);
        if (service === undefined) {
          return err({
            code: "TokenNotRegistered",
            message: `Token not registered: ${String(token)}`,
            details: {},
          });
        }
        return ok(service);
      }),
    } as unknown as PlatformContainerPort;

    factory = new WindowFactory(mockRegistry, mockFoundryWindowAdapter, mockContainer);

    // Mock foundry global for ApplicationWrapper
    (globalThis as { foundry?: unknown }).foundry = {
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
  });

  describe("createWindow", () => {
    it("should create window successfully", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = { id: "instance-1", title: "Test Window" };
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      expect(result.value.instanceId).toMatch(/^test-window:/);
      expect(result.value.definitionId).toBe("test-window");
    });

    it("should return error if definition not found", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        err({
          code: "DefinitionNotFound",
          message: "Definition not found",
        })
      );

      const result = await factory.createWindow("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("DefinitionNotFound");
    });

    it("should apply overrides to definition", async () => {
      const _definitionWithOverrides = {
        ...mockDefinition,
        title: "Overridden Title",
      };

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window", undefined, {
        title: "Overridden Title",
      });

      expectResultOk(result);
      expect(mockFoundryWindowAdapter.buildApplicationWrapper).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Overridden Title" }),
        expect.any(Object),
        expect.any(String)
      );
    });

    it("should use instanceKey if provided", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window", "my-key");

      expectResultOk(result);
      expect(result.value.instanceId).toBe("test-window:my-key");
    });

    it("should generate instanceId if instanceKey not provided", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      expect(result.value.instanceId).toMatch(/^test-window:\d+-[\d.]+$/);
    });

    it("should return error if buildApplicationWrapper fails", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        err({
          code: "BuildApplicationFailed",
          message: "Build failed",
        })
      );

      const result = await factory.createWindow("test-window");

      expectResultErr(result);
      expect(result.error.code).toBe("BuildApplicationFailed");
    });

    it("should return error if registerInstance fails", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(
        err({
          code: "InstanceAlreadyExists",
          message: "Instance already exists",
        })
      );

      const result = await factory.createWindow("test-window");

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceAlreadyExists");
    });

    it("should create window handle with show method", async () => {
      const mockApp = {
        render: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            constructor() {
              return mockApp;
            }
            async render() {
              return mockApp.render();
            }
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      const showResult = await result.value.show();
      expectResultOk(showResult);
      expect(mockApp.render).toHaveBeenCalled();
    });

    it("should create window handle with hide method", async () => {
      const mockApp = {
        render: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            constructor() {
              return mockApp;
            }
            async render() {
              return mockApp.render();
            }
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      const hideResult = await result.value.hide();
      expectResultOk(hideResult);
      expect(mockApp.render).toHaveBeenCalledWith({ force: false });
    });

    it("should create window handle with close method", async () => {
      const mockApp = {
        close: vi.fn().mockResolvedValue(undefined),
      };

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockRegistry.unregisterInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            constructor() {
              return mockApp;
            }
            async close() {
              return mockApp.close();
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      const closeResult = await result.value.close();
      expectResultOk(closeResult);
      expect(mockApp.close).toHaveBeenCalled();
      expect(mockRegistry.unregisterInstance).toHaveBeenCalled();
    });

    it("should create window handle with update method", async () => {
      const mockPatch = vi.fn().mockReturnValue(ok(undefined));
      const mockStatePort = {
        get: vi.fn(),
        patch: mockPatch,
        subscribe: vi.fn(),
      };
      const mockStatePortFactory = {
        create: vi.fn().mockReturnValue(mockStatePort),
      };

      // Helper function for resolve logic
      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken) return mockStatePortFactory;
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        if (token === viewModelBuilderToken)
          return {
            build: vi.fn().mockReturnValue({
              state: mockStatePort,
              computed: {},
              actions: {},
            }),
          };
        if (token === eventBusToken)
          return {
            emit: vi.fn(),
            on: vi.fn(() => () => {}),
            off: vi.fn(),
            once: vi.fn(),
          };
        if (token === remoteSyncGateToken)
          return {
            makePersistMeta: vi.fn().mockReturnValue({}),
            isFromWindow: vi.fn().mockReturnValue(false),
            getClientId: vi.fn().mockReturnValue("client-1"),
          };
        if (token === persistAdapterToken) return undefined;
        return undefined;
      };

      // Create new container with updated mocks
      const testContainer = {
        resolve: vi.fn((token) => resolveService(token)),
        resolveWithError: vi.fn((token) => {
          const service = resolveService(token);
          if (service === undefined) {
            return err({
              code: "TokenNotRegistered",
              message: `Token not registered: ${String(token)}`,
              details: {},
            });
          }
          return ok(service);
        }),
      } as unknown as PlatformContainerPort;

      // Create new factory with test container
      const testFactory = new WindowFactory(mockRegistry, mockFoundryWindowAdapter, testContainer);

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await testFactory.createWindow("test-window");

      expectResultOk(result);
      expect(typeof result.value.update).toBe("function");

      // Actually call update to cover line 103
      const updateResult = await result.value.update({ count: 1 });
      expectResultOk(updateResult);
      expect(mockPatch).toHaveBeenCalledWith({ count: 1 });
    });

    it("should create window handle with persist method", async () => {
      const mockPersistAdapter = {
        save: vi.fn().mockResolvedValue(ok(undefined)),
        load: vi.fn().mockResolvedValue(ok({})),
      };
      const mockStatePort = {
        get: vi.fn().mockReturnValue({ count: 0 }),
        patch: vi.fn().mockReturnValue(ok(undefined)),
        subscribe: vi.fn(),
      };
      const mockStatePortFactory = {
        create: vi.fn().mockReturnValue(mockStatePort),
      };

      // Helper function for resolve logic
      const resolveService2 = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken) return mockStatePortFactory;
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        if (token === viewModelBuilderToken)
          return {
            build: vi.fn().mockReturnValue({
              state: mockStatePort,
              computed: {},
              actions: {},
            }),
          };
        if (token === eventBusToken)
          return {
            emit: vi.fn(),
            on: vi.fn(() => () => {}),
            off: vi.fn(),
            once: vi.fn(),
          };
        if (token === remoteSyncGateToken)
          return {
            makePersistMeta: vi.fn().mockReturnValue({}),
            isFromWindow: vi.fn().mockReturnValue(false),
            getClientId: vi.fn().mockReturnValue("client-1"),
          };
        if (token === persistAdapterToken) return mockPersistAdapter;
        return undefined;
      };

      // Create new container with updated mocks
      const testContainer = {
        resolve: vi.fn((token) => resolveService2(token)),
        resolveWithError: vi.fn((token) => {
          const service = resolveService2(token);
          if (service === undefined) {
            return err({
              code: "TokenNotRegistered",
              message: `Token not registered: ${String(token)}`,
              details: {},
            });
          }
          return ok(service);
        }),
      } as unknown as PlatformContainerPort;

      // Create new factory with test container
      const testFactory = new WindowFactory(mockRegistry, mockFoundryWindowAdapter, testContainer);

      const definitionWithPersist = {
        ...mockDefinition,
        persist: {
          type: "flag" as const,
          documentId: "Actor.123",
          namespace: "test",
          key: "state",
        },
      };

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(definitionWithPersist));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await testFactory.createWindow("test-window");

      expectResultOk(result);
      expect(typeof result.value.persist).toBe("function");

      // Actually call persist to cover line 106
      const persistResult = await result.value.persist();
      expectResultOk(persistResult);
    });

    it("should create window handle with restore method", async () => {
      const _mockRestore = vi.fn().mockReturnValue(ok(undefined));
      vi.mocked(mockContainer.resolve).mockImplementation((token) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi
              .fn()
              .mockReturnValue(ok({ get: vi.fn(), patch: vi.fn(), subscribe: vi.fn() })),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        if (token === viewModelBuilderToken)
          return {
            build: vi.fn().mockReturnValue({
              state: { get: vi.fn(), patch: vi.fn(), subscribe: vi.fn() },
              computed: {},
              actions: {},
            }),
          };
        if (token === eventBusToken)
          return {
            emit: vi.fn(),
            on: vi.fn(() => () => {}),
            off: vi.fn(),
            once: vi.fn(),
          };
        if (token === remoteSyncGateToken)
          return {
            makePersistMeta: vi.fn().mockReturnValue({}),
            isFromWindow: vi.fn().mockReturnValue(false),
            getClientId: vi.fn().mockReturnValue("client-1"),
          };
        if (token === persistAdapterToken) return undefined;
        return undefined;
      });

      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));
      vi.mocked(mockRegistry.registerInstance).mockReturnValue(ok(undefined));
      vi.mocked(mockFoundryWindowAdapter.buildApplicationWrapper).mockReturnValue(
        ok(
          class {
            static DEFAULT_OPTIONS = {};
            async render() {}
            async close() {
              return this;
            }
          } as unknown as import("@/domain/windows/types/application-v2.interface").ApplicationClass
        )
      );

      const result = await factory.createWindow("test-window");

      expectResultOk(result);
      expect(typeof result.value.restore).toBe("function");

      // Actually call restore to cover line 109
      const restoreResult = await result.value.restore();
      expectResultOk(restoreResult);
    });
  });

  describe("createController error handling", () => {
    it("should throw error when WindowRegistry cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === windowRegistryToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "WindowRegistry not found",
            details: {},
          });
        }
        // Return ok for other services to reach the error path
        return ok({});
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve WindowRegistry: WindowRegistry not found"
      );
    });

    it("should throw error when StateStore cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === windowRegistryToken) {
          return ok(mockRegistry);
        }
        if (token === stateStoreToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "StateStore not found",
            details: {},
          });
        }
        return ok({});
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve StateStore: StateStore not found"
      );
    });

    it("should throw error when StatePortFactory cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        if (token === windowRegistryToken) {
          return ok(mockRegistry);
        }
        if (token === stateStoreToken) {
          return ok({
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          });
        }
        if (token === statePortFactoryToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "StatePortFactory not found",
            details: {},
          });
        }
        return ok({});
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve StatePortFactory: StatePortFactory not found"
      );
    });

    it("should throw error when ActionDispatcher cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === actionDispatcherToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "ActionDispatcher not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve ActionDispatcher: ActionDispatcher not found"
      );
    });

    it("should throw error when RendererRegistry cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === rendererRegistryToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "RendererRegistry not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve RendererRegistry: RendererRegistry not found"
      );
    });

    it("should throw error when BindingEngine cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === bindingEngineToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "BindingEngine not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve BindingEngine: BindingEngine not found"
      );
    });

    it("should throw error when ViewModelBuilder cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === viewModelBuilderToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "ViewModelBuilder not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve ViewModelBuilder: ViewModelBuilder not found"
      );
    });

    it("should throw error when EventBus cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        if (token === viewModelBuilderToken)
          return {
            build: vi.fn().mockReturnValue({
              state: { get: vi.fn(), patch: vi.fn(), subscribe: vi.fn() },
              computed: {},
              actions: {},
            }),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === eventBusToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "EventBus not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve EventBus: EventBus not found"
      );
    });

    it("should throw error when RemoteSyncGate cannot be resolved", async () => {
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const resolveService = (token: symbol) => {
        if (token === windowRegistryToken) return mockRegistry;
        if (token === stateStoreToken)
          return {
            set: vi.fn().mockReturnValue(ok(undefined)),
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue(ok({})),
            clear: vi.fn(),
          };
        if (token === statePortFactoryToken)
          return {
            create: vi.fn().mockReturnValue({
              get: vi.fn(),
              patch: vi.fn().mockReturnValue(ok(undefined)),
              subscribe: vi.fn(),
            }),
          };
        if (token === actionDispatcherToken)
          return {
            dispatch: vi.fn().mockResolvedValue(ok(undefined)),
          };
        if (token === rendererRegistryToken)
          return {
            get: vi.fn().mockReturnValue(ok({ mount: vi.fn(), unmount: vi.fn(), update: vi.fn() })),
          };
        if (token === bindingEngineToken)
          return {
            initialize: vi.fn().mockReturnValue(ok(undefined)),
            sync: vi.fn().mockResolvedValue(ok(undefined)),
            getNormalizedBindings: vi.fn().mockReturnValue([]),
          };
        if (token === viewModelBuilderToken)
          return {
            build: vi.fn().mockReturnValue({
              state: { get: vi.fn(), patch: vi.fn(), subscribe: vi.fn() },
              computed: {},
              actions: {},
            }),
          };
        if (token === eventBusToken)
          return {
            emit: vi.fn(),
            on: vi.fn(() => () => {}),
            off: vi.fn(),
            once: vi.fn(),
          };
        return undefined;
      };

      vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
        const service = resolveService(token);
        if (service !== undefined) {
          return ok(service);
        }
        if (token === remoteSyncGateToken) {
          return err({
            code: "SERVICE_NOT_FOUND",
            message: "RemoteSyncGate not found",
            details: {},
          });
        }
        return err({
          code: "SERVICE_NOT_FOUND",
          message: `Token not registered: ${String(token)}`,
          details: {},
        });
      });

      await expect(factory.createWindow("test-window")).rejects.toThrow(
        "Failed to resolve RemoteSyncGate: RemoteSyncGate not found"
      );
    });
  });
});
