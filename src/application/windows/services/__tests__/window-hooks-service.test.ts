import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowHooksService } from "../window-hooks-service";
import type { IWindowHooksBridge } from "@/application/windows/ports/window-hooks-bridge-port.interface";

describe("WindowHooksService", () => {
  let service: WindowHooksService;
  let mockBridge: IWindowHooksBridge;

  beforeEach(() => {
    mockBridge = {
      register: vi.fn(),
      unregister: vi.fn(),
    };

    service = new WindowHooksService(mockBridge);
  });

  describe("register", () => {
    it("should delegate to bridge.register()", () => {
      service.register();

      expect(mockBridge.register).toHaveBeenCalledOnce();
    });

    it("should call bridge.register() multiple times if called multiple times", () => {
      service.register();
      service.register();
      service.register();

      expect(mockBridge.register).toHaveBeenCalledTimes(3);
    });
  });

  describe("unregister", () => {
    it("should delegate to bridge.unregister()", () => {
      service.unregister();

      expect(mockBridge.unregister).toHaveBeenCalledOnce();
    });

    it("should handle multiple unregister calls", () => {
      service.unregister();
      service.unregister();

      expect(mockBridge.unregister).toHaveBeenCalledTimes(2);
    });
  });
});
