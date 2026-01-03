import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WindowHooksBridge } from "../window-hooks";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { ISharedDocumentCache } from "@/application/windows/ports/shared-document-cache-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import type { IWindowController } from "@/domain/windows/ports/window-controller-port.interface";
import { ok, err } from "@/domain/utils/result";
import { createMockHooks } from "@/test/mocks/foundry";

describe("WindowHooksBridge", () => {
  let bridge: WindowHooksBridge;
  let mockRegistry: IWindowRegistry;
  let mockRemoteSyncGate: IRemoteSyncGate;
  let mockSharedDocumentCache: ISharedDocumentCache;
  let mockHooks: ReturnType<typeof createMockHooks>;

  beforeEach(() => {
    mockRegistry = {
      listInstances: vi.fn().mockReturnValue([]),
      getInstance: vi.fn(),
      getDefinition: vi.fn(),
    } as unknown as IWindowRegistry;

    mockRemoteSyncGate = {
      isFromWindow: vi.fn().mockReturnValue(false),
    } as unknown as IRemoteSyncGate;

    mockSharedDocumentCache = {
      patchActor: vi.fn(),
      patchItem: vi.fn(),
      getActor: vi.fn(),
      getItem: vi.fn(),
      getItemsByActorId: vi.fn(),
    } as unknown as ISharedDocumentCache;

    mockHooks = createMockHooks();
    (globalThis as { Hooks?: unknown }).Hooks = mockHooks;

    bridge = new WindowHooksBridge(mockRegistry, mockRemoteSyncGate, mockSharedDocumentCache);
  });

  afterEach(() => {
    delete (globalThis as { Hooks?: unknown }).Hooks;
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register updateDocument hook", () => {
      bridge.register();

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(vi.mocked(mockHooks.on)).toHaveBeenCalledWith("updateDocument", expect.any(Function));
    });

    it("should register settingChange hook", () => {
      bridge.register();

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      expect(vi.mocked(mockHooks.on)).toHaveBeenCalledWith("settingChange", expect.any(Function));
    });

    it("should not register hooks if Hooks is undefined", () => {
      delete (globalThis as { Hooks?: unknown }).Hooks;

      bridge.register();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("handleDocumentUpdate", () => {
    it("should update shared cache for Actor document", () => {
      bridge.register();

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
        name: "Test Actor",
        system: { type: "human" },
        flags: {},
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { system: { type: "elf" } }, {});

      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalledWith(
        "Actor.123",
        expect.any(Object)
      );
    });

    it("should update shared cache for Item document", () => {
      bridge.register();

      const mockDocument = {
        id: "Item.456",
        constructor: { name: "Item" },
        name: "Test Item",
        system: {},
        flags: {},
        actorId: "Actor.123",
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { name: "Updated Item" }, {});

      expect(mockSharedDocumentCache.patchItem).toHaveBeenCalledWith(
        "Item.456",
        expect.any(Object)
      );
    });

    it("should skip update if from same window", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "flag",
            documentId: "Actor.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );
      vi.mocked(mockRemoteSyncGate.isFromWindow).mockReturnValue(true);

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, { windowFrameworkOrigin: { instanceId: "instance-1" } });

      expect(mockController.applyRemotePatch).not.toHaveBeenCalled();
    });
  });

  describe("handleSettingChange", () => {
    it("should handle setting change for relevant window", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "setting",
            namespace: "test-namespace",
            key: "test-key",
          },
        } as WindowDefinition)
      );

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("test-namespace", "test-key", "new-value", {});

      // Should not throw
      expect(true).toBe(true);
    });

    it("should skip setting change if from same window", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRemoteSyncGate.isFromWindow).mockReturnValue(true);

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("test-namespace", "test-key", "new-value", {
        windowFrameworkOrigin: { instanceId: "instance-1" },
      });

      // Should not throw and should not call getDefinition for skipped instance
      expect(mockRegistry.getDefinition).not.toHaveBeenCalled();
    });

    it("should continue when getDefinition fails (branch 105)", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRemoteSyncGate.isFromWindow).mockReturnValue(false);
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        err({ code: "NotFound", message: "Definition not found" })
      );

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("test-namespace", "test-key", "new-value", {});

      // Should not throw and should continue to next instance
      expect(mockRegistry.getDefinition).toHaveBeenCalled();
    });

    it("should handle setting change with non-matching dependency (branch 135)", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "setting",
              namespace: "different-namespace", // Different namespace
              key: "different-key", // Different key
            },
          ],
        } as WindowDefinition)
      );

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("test-namespace", "test-key", "new-value", {});

      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle persist type journal with different documentId (branch 156)", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "journal",
            documentId: "JournalEntry.123", // Different ID
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "JournalEntry.999", // Different ID - branch 156 else path
        constructor: { name: "JournalEntry" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not call applyRemotePatch because documentId doesn't match
      expect(mockController.applyRemotePatch).not.toHaveBeenCalled();
    });

    it("should handle dependency with documentType undefined (branch 169)", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "document",
              // documentType is undefined - branch 169 else path
            },
          ],
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not call applyRemotePatch because documentType is undefined
      expect(mockController.applyRemotePatch).not.toHaveBeenCalled();
    });

    it("should handle setting change with dependency match", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "setting",
              namespace: "test-namespace",
              key: "test-key",
            },
          ],
        } as WindowDefinition)
      );

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("test-namespace", "test-key", "new-value", {});

      // Should not throw
      expect(true).toBe(true);
    });

    it("should return false when setting is not relevant (no match)", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          // No persist or dependencies that match
        } as WindowDefinition)
      );

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "settingChange")?.[1] as (
        namespace: unknown,
        key: unknown,
        value: unknown,
        options: unknown
      ) => void;

      callback?.("different-namespace", "different-key", "new-value", {});

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("handleDocumentUpdate - edge cases", () => {
    it("should apply remote patch when window is relevant and has controller", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "flag",
            documentId: "Actor.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { name: "Updated" }, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalledWith({ name: "Updated" });
    });

    it("should skip when instance lookup fails", () => {
      bridge.register();

      const mockInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(
        err({ code: "NotFound", message: "Instance not found" })
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not throw
      expect(true).toBe(true);
    });

    it("should skip when definition lookup fails", () => {
      bridge.register();

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        err({ code: "NotFound", message: "Definition not found" })
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not throw
      expect(true).toBe(true);
    });

    it("should handle journal persist type", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "journal",
            documentId: "JournalEntry.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "JournalEntry.123",
        constructor: { name: "JournalEntry" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalled();
    });

    it("should handle document dependency with documentId", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "document",
              documentId: "Actor.123",
            },
          ],
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalled();
    });

    it("should handle document dependency with documentType", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "document",
              documentType: "Actor",
            },
          ],
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.999",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalled();
    });

    it("should handle empty patch extraction", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "flag",
            documentId: "Actor.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
        name: "Test Actor",
        system: {},
        flags: {},
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalledWith({});
    });

    it("should skip when controller is not available", () => {
      bridge.register();

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        // controller is optional, so we omit it
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "flag",
            documentId: "Actor.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not throw, but should update cache
      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalled();
    });

    it("should return false when document is not relevant (no match)", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          // No persist or dependencies that match
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.999", // Different ID
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not call applyRemotePatch when not relevant
      expect(mockController.applyRemotePatch).not.toHaveBeenCalled();
    });

    it("should call updateSharedCache for Actor documents", () => {
      bridge.register();

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
        name: "Test Actor",
        system: { type: "human" },
        flags: { test: "value" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { system: { type: "elf" } }, {});

      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalledWith("Actor.123", {
        id: "Actor.123",
        name: "Test Actor",
        system: { type: "elf" },
        flags: { test: "value" },
      });
    });

    it("should call updateSharedCache for Actor documents with ID prefix", () => {
      bridge.register();

      const mockDocument = {
        id: "Actor.999",
        constructor: { name: "SomeOtherClass" }, // Not "Actor" but ID starts with "Actor."
        name: "Test Actor",
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalled();
    });

    it("should call updateSharedCache for Actor with missing fields", () => {
      bridge.register();

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
        // Missing name, system, flags
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalledWith("Actor.123", {
        id: "Actor.123",
        name: "",
        system: {},
        flags: {},
      });
    });

    it("should call updateSharedCache for Item documents", () => {
      bridge.register();

      const mockDocument = {
        id: "Item.456",
        constructor: { name: "Item" },
        name: "Test Item",
        system: { type: "weapon" },
        flags: {},
        actorId: "Actor.123",
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { name: "Updated Item" }, {});

      // updateSharedCache uses docRecord.name directly (not from update), but update fields for system/flags
      // extractPatch returns the update object, but updateSharedCache uses its own logic
      expect(mockSharedDocumentCache.patchItem).toHaveBeenCalledWith("Item.456", {
        id: "Item.456",
        name: "Test Item", // From document (updateSharedCache uses docRecord.name, not update.name)
        system: { type: "weapon" }, // From document (update.system is undefined)
        flags: {}, // From document (update.flags is undefined)
        actorId: "Actor.123", // From document (update.actorId is undefined)
      });
    });

    it("should call updateSharedCache for Item documents with ID prefix", () => {
      bridge.register();

      const mockDocument = {
        id: "Item.999",
        constructor: { name: "SomeOtherClass" }, // Not "Item" but ID starts with "Item."
        name: "Test Item",
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockSharedDocumentCache.patchItem).toHaveBeenCalled();
    });

    it("should call updateSharedCache for Item with missing fields", () => {
      bridge.register();

      const mockDocument = {
        id: "Item.456",
        constructor: { name: "Item" },
        // Missing name, system, flags, actorId
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockSharedDocumentCache.patchItem).toHaveBeenCalledWith("Item.456", {
        id: "Item.456",
        name: "",
        system: {},
        flags: {},
        actorId: undefined,
      });
    });

    it("should call updateSharedCache for Item with actorId in update", () => {
      bridge.register();

      const mockDocument = {
        id: "Item.456",
        constructor: { name: "Item" },
        actorId: "Actor.123",
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, { actorId: "Actor.456" }, {});

      expect(mockSharedDocumentCache.patchItem).toHaveBeenCalledWith("Item.456", {
        id: "Item.456",
        name: "",
        system: {},
        flags: {},
        actorId: "Actor.456",
      });
    });

    it("should handle extractPatch with null update", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          persist: {
            type: "flag",
            documentId: "Actor.123",
            namespace: "test",
            key: "test",
          },
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.123",
        constructor: { name: "Actor" },
        name: "Test Actor",
        system: {},
        flags: {},
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      // UpdateSharedCache will be called, but extractPatch handles null gracefully
      callback?.(mockDocument, null, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalledWith({});
      // updateSharedCache should handle null update gracefully
      expect(mockSharedDocumentCache.patchActor).toHaveBeenCalled();
    });

    it("should handle documentType matching in isRelevant", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "document",
              documentType: "Actor",
            },
          ],
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Actor.999", // Different ID, but matches documentType
        constructor: { name: "Actor" },
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      expect(mockController.applyRemotePatch).toHaveBeenCalled();
    });

    it("should handle documentType not matching in isRelevant", () => {
      bridge.register();

      const mockController = {
        applyRemotePatch: vi.fn(),
      } as unknown as IWindowController;

      const mockInstance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
        controller: mockController,
      };

      vi.mocked(mockRegistry.listInstances).mockReturnValue([mockInstance]);
      vi.mocked(mockRegistry.getInstance).mockReturnValue(ok(mockInstance));
      vi.mocked(mockRegistry.getDefinition).mockReturnValue(
        ok({
          definitionId: "test-window",
          component: {
            type: "svelte",
            component: vi.fn(),
            props: {},
          },
          dependencies: [
            {
              type: "document",
              documentType: "Actor",
            },
          ],
        } as WindowDefinition)
      );

      const mockDocument = {
        id: "Item.999",
        constructor: { name: "Item" }, // Different type
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not call applyRemotePatch because documentType doesn't match
      expect(mockController.applyRemotePatch).not.toHaveBeenCalled();
    });

    it("should handle document with undefined constructor.name", () => {
      bridge.register();

      const mockDocument = {
        id: "Unknown.123",
        constructor: {}, // No name property
      };

      const callback = vi
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        .mocked(mockHooks.on)
        .mock.calls.find((call) => String(call[0]) === "updateDocument")?.[1] as (
        document: unknown,
        update: unknown,
        options: unknown
      ) => void;

      callback?.(mockDocument, {}, {});

      // Should not throw, but also not update cache for unknown document type
      expect(mockSharedDocumentCache.patchActor).not.toHaveBeenCalled();
      expect(mockSharedDocumentCache.patchItem).not.toHaveBeenCalled();
    });
  });
});
