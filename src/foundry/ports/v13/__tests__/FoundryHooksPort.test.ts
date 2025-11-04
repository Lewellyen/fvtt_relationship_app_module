import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryHooksPortV13 } from "../FoundryHooksPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryHooksPortV13", () => {
  let port: FoundryHooksPortV13;

  beforeEach(() => {
    port = new FoundryHooksPortV13();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("on", () => {
    it("should register hook successfully", () => {
      const mockOn = vi.fn().mockReturnValue(1);
      vi.stubGlobal("Hooks", { on: mockOn });

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultOk(result);
      expect(mockOn).toHaveBeenCalledWith("init", callback);
    });

    it("should handle missing Hooks object", () => {
      vi.stubGlobal("Hooks", undefined);

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register hook");
    });

    it("should wrap exceptions in Result", () => {
      const mockOn = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });
      vi.stubGlobal("Hooks", { on: mockOn });

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register hook");
    });
  });

  describe("off", () => {
    it("should unregister hook successfully", () => {
      const mockOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockOff });

      const callback = vi.fn();
      const result = port.off("init", callback);

      expectResultOk(result);
      expect(mockOff).toHaveBeenCalledWith("init", callback);
    });

    it("should handle missing Hooks object", () => {
      vi.stubGlobal("Hooks", undefined);

      const callback = vi.fn();
      const result = port.off("init", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unregister hook");
    });

    it("should wrap exceptions in Result", () => {
      const mockOff = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });
      vi.stubGlobal("Hooks", { off: mockOff });

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
      const mockOnce = vi.fn().mockReturnValue(mockHookId);
      vi.stubGlobal("Hooks", { once: mockOnce });

      const port = new FoundryHooksPortV13();
      const callback = vi.fn();
      const result = port.once("testHook", callback);

      expectResultOk(result);
      expect(result.value).toBe(mockHookId);
      expect(mockOnce).toHaveBeenCalledWith("testHook", callback);
    });

    it("should return error when Hooks API is not available", () => {
      vi.stubGlobal("Hooks", undefined);

      const port = new FoundryHooksPortV13();
      const callback = vi.fn();
      const result = port.once("testHook", callback);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register one-time hook");
    });

    it("should handle exceptions during registration", () => {
      const mockOnce = vi.fn(() => {
        throw new Error("Hook error");
      });
      vi.stubGlobal("Hooks", { once: mockOnce });

      const port = new FoundryHooksPortV13();
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
      const mockOn = vi.fn().mockReturnValue(mockHookId);
      vi.stubGlobal("Hooks", { on: mockOn });

      const port = new FoundryHooksPortV13();
      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultOk(result);
      expect(result.value).toBe(mockHookId);
    });
  });

  describe("off() with hook ID", () => {
    it("should unregister hook by ID", () => {
      const mockOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockOff });

      const port = new FoundryHooksPortV13();
      const result = port.off("testHook", 42);

      expectResultOk(result);
      expect(mockOff).toHaveBeenCalledWith("testHook", 42);
    });

    it("should still work with callback function", () => {
      const mockOff = vi.fn();
      vi.stubGlobal("Hooks", { off: mockOff });

      const port = new FoundryHooksPortV13();
      const callback = vi.fn();
      const result = port.off("testHook", callback);

      expectResultOk(result);
      expect(mockOff).toHaveBeenCalledWith("testHook", callback);
    });
  });
});
