import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowHooksService } from "../window-hooks-service";
import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { ISharedDocumentCache } from "@/application/windows/ports/shared-document-cache-port.interface";
import { WindowHooksBridge } from "@/infrastructure/windows/adapters/foundry/hooks/window-hooks";

describe("WindowHooksService", () => {
  let service: WindowHooksService;
  let mockRegistry: IWindowRegistry;
  let mockRemoteSyncGate: IRemoteSyncGate;
  let mockSharedDocumentCache: ISharedDocumentCache;

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

    mockRemoteSyncGate = {
      makePersistMeta: vi.fn(),
      isFromWindow: vi.fn(),
      getClientId: vi.fn(),
    } as unknown as IRemoteSyncGate;

    mockSharedDocumentCache = {
      patchActor: vi.fn(),
      patchItem: vi.fn(),
      getActor: vi.fn(),
      getItem: vi.fn(),
      getItemsByActorId: vi.fn(),
    } as unknown as ISharedDocumentCache;

    service = new WindowHooksService(mockRegistry, mockRemoteSyncGate, mockSharedDocumentCache);

    // Mock Hooks global
    (globalThis as { Hooks?: { on: (name: string, callback: unknown) => number } }).Hooks = {
      on: vi.fn().mockReturnValue(1),
    };
  });

  describe("register", () => {
    it("should register WindowHooksBridge on first call", () => {
      service.register();

      // Bridge should be created
      // @ts-expect-error - accessing private member for test
      expect(service.bridge).toBeInstanceOf(WindowHooksBridge);
    });

    it("should not register again if already registered", () => {
      // First registration
      service.register();
      // @ts-expect-error - accessing private member for test
      const firstBridge = service.bridge;

      // Second registration - should return early (line 43)
      service.register();

      // Bridge should be the same instance (not recreated)
      // @ts-expect-error - accessing private member for test
      expect(service.bridge).toBe(firstBridge);
    });
  });

  describe("unregister", () => {
    it("should set bridge to null", () => {
      // First register
      service.register();
      // @ts-expect-error - accessing private member for test
      expect(service.bridge).not.toBeNull();

      // Unregister
      service.unregister();

      // Bridge should be null (line 60)
      // @ts-expect-error - accessing private member for test
      expect(service.bridge).toBeNull();
    });

    it("should handle unregister when bridge is already null", () => {
      // Unregister without registering first
      expect(() => {
        service.unregister();
      }).not.toThrow();

      // Bridge should be null
      // @ts-expect-error - accessing private member for test
      expect(service.bridge).toBeNull();
    });
  });
});
