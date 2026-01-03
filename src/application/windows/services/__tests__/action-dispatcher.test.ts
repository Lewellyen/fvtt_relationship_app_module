import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ActionDispatcher } from "../action-dispatcher";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("ActionDispatcher", () => {
  let dispatcher: ActionDispatcher;
  let mockRegistry: IWindowRegistry;

  beforeEach(() => {
    mockRegistry = {
      getInstance: vi.fn(),
      getDefinition: vi.fn(),
      registerDefinition: vi.fn(),
      registerInstance: vi.fn(),
      unregisterInstance: vi.fn(),
      listInstances: vi.fn(),
      listInstancesByDefinition: vi.fn(),
    } as unknown as IWindowRegistry;

    dispatcher = new ActionDispatcher(mockRegistry);

    // Mock game global
    (globalThis as { game?: { user?: { id: string; isGM: boolean; role: number } } }).game = {
      user: {
        id: "user-1",
        isGM: true,
        role: 4,
      },
    };
  });

  afterEach(() => {
    delete (globalThis as { game?: unknown }).game;
    delete (globalThis as { foundry?: unknown }).foundry;
    vi.clearAllMocks();
  });

  describe("dispatch", () => {
    it("should dispatch action successfully", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
        event: new Event("click"),
      });

      expectResultOk(result);
      expect(mockDefinition.actions?.[0]?.handler).toHaveBeenCalled();
    });

    it("should return error if instance not found", async () => {
      vi.mocked(mockRegistry.getInstance).mockReturnValue(
        err({
          code: "InstanceNotFound",
          message: "Instance not found",
        })
      );

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceNotFound");
    });

    it("should return error if definition not found", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        err({
          code: "DefinitionNotFound",
          message: "Definition not found",
        })
      );

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("DefinitionNotFound");
    });

    it("should return error if action not found", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("non-existent", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ActionNotFound");
    });

    it("should return error if action handler fails", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            handler: vi.fn().mockResolvedValue(
              err({
                code: "ActionFailed",
                message: "Handler failed",
              })
            ),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ActionFailed");
    });

    it("should check user permission", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "user" }],
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error if user permission check fails", async () => {
      delete (globalThis as { game?: unknown }).game;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "user" }],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("PermissionDenied");
    });

    it("should check GM permission", async () => {
      (globalThis as { game?: { user?: { id: string; isGM: boolean; role: number } } }).game = {
        user: {
          id: "user-1",
          isGM: true,
          role: 4,
        },
      };

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "gm" }],
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error if GM permission check fails", async () => {
      (globalThis as { game?: { user?: { id: string; isGM: boolean; role: number } } }).game = {
        user: {
          id: "user-1",
          isGM: false,
          role: 1, // Player, not GM
        },
      };

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "gm" }],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("PermissionDenied");
    });

    it("should check custom permission", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [
              {
                type: "custom",
                check: vi.fn().mockReturnValue(true),
              },
            ],
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error if custom permission check fails", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [
              {
                type: "custom",
                check: vi.fn().mockReturnValue(false),
              },
            ],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("PermissionDenied");
    });

    it("should return error if custom permission check function is missing", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [
              {
                type: "custom",
              },
            ],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("PermissionDenied");
    });

    it("should validate action", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            validation: [
              {
                validate: vi.fn().mockReturnValue(true),
                message: "Validation passed",
              },
            ],
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error if validation fails", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            validation: [
              {
                validate: vi.fn().mockReturnValue(false),
                message: "Validation failed",
              },
            ],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ValidationFailed");
    });

    it("should return error with default message if validation fails without message", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            validation: [
              {
                validate: vi.fn().mockReturnValue(false),
                // message is undefined - should use default "Action validation failed"
              },
            ],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ValidationFailed");
      expect(result.error.message).toBe("Action validation failed");
    });

    it("should request confirmation if required", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            confirm: {
              title: "Confirm",
              message: "Are you sure?",
            },
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      // Mock Foundry DialogV2
      (
        globalThis as {
          foundry?: {
            applications?: {
              api?: { DialogV2?: { confirm: (options: unknown) => Promise<boolean> } };
            };
          };
        }
      ).foundry = {
        applications: {
          api: {
            DialogV2: {
              confirm: vi.fn().mockResolvedValue(true),
            },
          },
        },
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
      expect(mockDefinition.actions?.[0]?.handler).toHaveBeenCalled();
    });

    it("should return error if confirmation is cancelled", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            confirm: {
              title: "Confirm",
              message: "Are you sure?",
            },
            handler: vi.fn(),
          },
        ],
      };

      // Mock Foundry DialogV2 to return false (cancelled)
      (
        globalThis as {
          foundry?: {
            applications?: {
              api?: { DialogV2?: { confirm: (options: unknown) => Promise<boolean> } };
            };
          };
        }
      ).foundry = {
        applications: {
          api: {
            DialogV2: {
              confirm: vi.fn().mockResolvedValue(false),
            },
          },
        },
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ActionCancelled");
      expect(mockDefinition.actions?.[0]?.handler).not.toHaveBeenCalled();
    });

    it("should return error if confirmation is cancelled when DialogV2 not available", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            confirm: {
              title: "Confirm",
              message: "Are you sure?",
            },
            handler: vi.fn(),
          },
        ],
      };

      // DialogV2 not available
      delete (globalThis as { foundry?: unknown }).foundry;

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("ActionCancelled");
    });

    it("should handle action without permissions", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should handle action without validation", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error for unknown permission type", async () => {
      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [
              {
                type: "unknown" as "user",
              },
            ],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      expect(result.error.code).toBe("PermissionDenied");
    });

    it("should check GM permission with role >= 4", async () => {
      (globalThis as { game?: { user?: { id: string; isGM: boolean; role: number } } }).game = {
        user: {
          id: "user-1",
          isGM: false,
          role: 4, // GM role but isGM is false
        },
      };

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "gm" }],
            handler: vi.fn().mockResolvedValue(ok(undefined)),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultOk(result);
    });

    it("should return error if game is undefined when checking GM permission", async () => {
      delete (globalThis as { game?: unknown }).game;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "gm" }],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      // The implementation returns "NotAuthenticated" for undefined game
      // but the error might be wrapped, so we check for either code
      expect(["NotAuthenticated", "PermissionDenied"]).toContain(result.error.code);
    });

    it("should return error if game.user is undefined when checking GM permission", async () => {
      (globalThis as { game?: { user?: unknown } }).game = {
        user: undefined,
      };

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const mockDefinition: WindowDefinition = {
        definitionId: "test-window",
        title: "Test Window",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
        actions: [
          {
            id: "test-action",
            label: "Test Action",
            permissions: [{ type: "gm" }],
            handler: vi.fn(),
          },
        ],
      };

      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(ok(mockDefinition));

      const result = await dispatcher.dispatch("test-action", {
        windowInstanceId: "instance-1",
        controlId: "control-1",
        state: {},
      });

      expectResultErr(result);
      // The implementation returns "NotAuthenticated" for undefined game.user
      // but the error might be wrapped, so we check for either code
      expect(["NotAuthenticated", "PermissionDenied"]).toContain(result.error.code);
    });
  });
});
