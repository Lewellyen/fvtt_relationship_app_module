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
      expect(result.error).toContain("Hooks API");
    });

    it("should wrap exceptions in Result", () => {
      const mockOn = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });
      vi.stubGlobal("Hooks", { on: mockOn });

      const callback = vi.fn();
      const result = port.on("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("Hook error");
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
      expect(result.error).toContain("Hooks API");
    });

    it("should wrap exceptions in Result", () => {
      const mockOff = vi.fn().mockImplementation(() => {
        throw new Error("Hook error");
      });
      vi.stubGlobal("Hooks", { off: mockOff });

      const callback = vi.fn();
      const result = port.off("init", callback);

      expectResultErr(result);
      expect(result.error).toContain("Hook error");
    });
  });
});

