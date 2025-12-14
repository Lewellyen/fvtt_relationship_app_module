import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FoundryV13HooksPort,
  createFoundryV13HooksPort,
} from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13HooksPort";
import type { IFoundryHooksAPI } from "@/infrastructure/adapters/foundry/api/foundry-api.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryV13HooksPort", () => {
  let port: FoundryV13HooksPort;
  let mockAPI: IFoundryHooksAPI;

  beforeEach(() => {
    mockAPI = {
      on: vi.fn().mockReturnValue(1),
      once: vi.fn().mockReturnValue(2),
      off: vi.fn(),
    };
    port = new FoundryV13HooksPort(mockAPI);
  });

  describe("on", () => {
    it("should register hook successfully", () => {
      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultOk(result);
      expect(mockAPI.on).toHaveBeenCalledWith("init", callback);
    });

    it("should handle missing Hooks object", () => {
      const portWithoutAPI = new FoundryV13HooksPort(null as unknown as IFoundryHooksAPI);

      const callback = vi.fn();
      const result = portWithoutAPI.on("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register hook");
    });

    it("should wrap exceptions in Result", () => {
      mockAPI.on = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register hook");
    });
  });

  describe("off", () => {
    it("should unregister hook successfully", () => {
      const callback = vi.fn();
      const result = port.off("init", callback);

      expectResultOk(result);
      expect(mockAPI.off).toHaveBeenCalledWith("init", callback);
    });

    it("should handle missing Hooks object", () => {
      const portWithoutAPI = new FoundryV13HooksPort(null as unknown as IFoundryHooksAPI);

      const callback = vi.fn();
      const result = portWithoutAPI.off("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unregister hook");
    });

    it("should wrap exceptions in Result", () => {
      mockAPI.off = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });

      const callback = vi.fn();
      const result = port.off("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unregister hook");
    });
  });

  describe("once()", () => {
    it("should register one-time hook and return ID", () => {
      const mockHookId = 42;
      mockAPI.once = vi.fn().mockReturnValue(mockHookId);

      const callback = vi.fn();
      const result = port.once("testHook", callback);

      expectResultOk(result);
      expect(result.value).toBe(mockHookId);
      expect(mockAPI.once).toHaveBeenCalledWith("testHook", callback);
    });

    it("should return error when Hooks API is not available", () => {
      const portWithoutAPI = new FoundryV13HooksPort(null as unknown as IFoundryHooksAPI);

      const callback = vi.fn();
      const result = portWithoutAPI.once("testHook", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register one-time hook");
    });

    it("should handle exceptions during registration", () => {
      mockAPI.once = vi.fn(() => {
        throw new Error("Hook error");
      });

      const callback = vi.fn();
      const result = port.once("testHook", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register one-time hook");
    });
  });

  describe("on() returns hook ID", () => {
    it("should return hook ID on successful registration", () => {
      const mockHookId = 123;
      mockAPI.on = vi.fn().mockReturnValue(mockHookId);

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultOk(result);
      expect(result.value).toBe(mockHookId);
    });
  });

  describe("off() with hook ID", () => {
    it("should unregister hook by ID", () => {
      const result = port.off("testHook", 42);

      expectResultOk(result);
      expect(mockAPI.off).toHaveBeenCalledWith("testHook", 42);
    });

    it("should still work with callback function", () => {
      const callback = vi.fn();
      const result = port.off("testHook", callback);

      expectResultOk(result);
      expect(mockAPI.off).toHaveBeenCalledWith("testHook", callback);
    });
  });

  describe("disposed state guards", () => {
    it("should prevent registering hooks after disposal", () => {
      port.dispose();

      const result = port.on("ready", vi.fn());

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
      expect(result.error.message).toContain("Cannot register hook on disposed port");
    });

    it("should prevent registering one-time hooks after disposal", () => {
      port.dispose();

      const result = port.once("ready", vi.fn());

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
      expect(result.error.message).toContain("Cannot register one-time hook on disposed port");
    });

    it("should prevent unregistering hooks after disposal", () => {
      port.dispose();

      const result = port.off("ready", 123);

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
      expect(result.error.message).toContain("Cannot unregister hook on disposed port");
    });

    it("should be idempotent (can call dispose multiple times)", () => {
      port.dispose();
      port.dispose(); // Should not throw
      port.dispose(); // Still should not throw

      // Port should still be disposed
      const result = port.on("ready", vi.fn());
      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should work normally before disposal", () => {
      const result1 = port.on("ready", vi.fn());
      const result2 = port.once("init", vi.fn());
      const result3 = port.off("ready", 1);

      expectResultOk(result1);
      expectResultOk(result2);
      expectResultOk(result3);
    });
  });

  describe("createFoundryV13HooksPort factory", () => {
    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should throw when Hooks is undefined", () => {
      // @ts-expect-error - intentionally undefined for test
      global.Hooks = undefined;

      expect(() => createFoundryV13HooksPort()).toThrow("Foundry Hooks API is not available");
    });

    it("should create port successfully when Hooks is available", () => {
      const mockOn = vi.fn().mockReturnValue(1);
      const mockOnce = vi.fn().mockReturnValue(2);
      const mockOff = vi.fn();

      // @ts-expect-error - intentionally typed for test
      global.Hooks = {
        on: mockOn,
        once: mockOnce,
        off: mockOff,
      };

      const port = createFoundryV13HooksPort();
      expect(port).toBeInstanceOf(FoundryV13HooksPort);

      // Test that the port uses the real Hooks API
      const result = port.on("testHook", vi.fn());
      expectResultOk(result);
      expect(mockOn).toHaveBeenCalled();
    });

    it("should handle once through factory-created port", () => {
      const mockOnce = vi.fn().mockReturnValue(42);
      // @ts-expect-error - intentionally typed for test
      global.Hooks = {
        on: vi.fn().mockReturnValue(1),
        once: mockOnce,
        off: vi.fn(),
      };

      const port = createFoundryV13HooksPort();
      const result = port.once("testHook", vi.fn());

      expectResultOk(result);
      expect(result.value).toBe(42);
      expect(mockOnce).toHaveBeenCalled();
    });

    it("should handle off through factory-created port", () => {
      const mockOff = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.Hooks = {
        on: vi.fn().mockReturnValue(1),
        once: vi.fn().mockReturnValue(2),
        off: mockOff,
      };

      const port = createFoundryV13HooksPort();
      const result = port.off("testHook", 123);

      expectResultOk(result);
      expect(mockOff).toHaveBeenCalledWith("testHook", 123);
    });

    it("should handle off with callback through factory-created port", () => {
      const mockOff = vi.fn();
      const callback = vi.fn();
      // @ts-expect-error - intentionally typed for test
      global.Hooks = {
        on: vi.fn().mockReturnValue(1),
        once: vi.fn().mockReturnValue(2),
        off: mockOff,
      };

      const port = createFoundryV13HooksPort();
      const result = port.off("testHook", callback);

      expectResultOk(result);
      expect(mockOff).toHaveBeenCalledWith("testHook", callback);
    });
  });
});
