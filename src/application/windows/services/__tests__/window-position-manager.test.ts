import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WindowPositionManager } from "../window-position-manager";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("WindowPositionManager", () => {
  let manager: WindowPositionManager;

  beforeEach(() => {
    manager = new WindowPositionManager();
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("loadPosition", () => {
    it("should return undefined if position not found", () => {
      const result = manager.loadPosition("instance-1");

      expectResultOk(result);
      expect(result.value).toBeUndefined();
    });

    it("should load saved position", () => {
      const position = { top: 100, left: 200, width: 300, height: 400 };
      localStorage.setItem("windowPosition:instance-1", JSON.stringify(position));

      const result = manager.loadPosition("instance-1");

      expectResultOk(result);
      expect(result.value).toEqual(position);
    });

    it("should return error if stored data is invalid JSON", () => {
      localStorage.setItem("windowPosition:instance-1", "invalid-json{{");

      const result = manager.loadPosition("instance-1");

      expectResultErr(result);
      expect(result.error.code).toBe("PositionLoadFailed");
    });

    it("should handle partial position", () => {
      const position = { top: 100 };
      localStorage.setItem("windowPosition:instance-1", JSON.stringify(position));

      const result = manager.loadPosition("instance-1");

      expectResultOk(result);
      expect(result.value).toEqual({ top: 100 });
    });
  });

  describe("savePosition", () => {
    it("should save position successfully", () => {
      const position = { top: 100, left: 200, width: 300, height: 400 };

      const result = manager.savePosition("instance-1", position);

      expectResultOk(result);

      const loaded = manager.loadPosition("instance-1");
      expectResultOk(loaded);
      expect(loaded.value).toEqual(position);
    });

    it("should overwrite existing position", () => {
      const position1 = { top: 100, left: 200 };
      const position2 = { top: 200, left: 300 };

      manager.savePosition("instance-1", position1);
      const result = manager.savePosition("instance-1", position2);

      expectResultOk(result);

      const loaded = manager.loadPosition("instance-1");
      expectResultOk(loaded);
      expect(loaded.value).toEqual(position2);
    });

    it("should save partial position", () => {
      const position = { top: 100 };

      const result = manager.savePosition("instance-1", position);

      expectResultOk(result);

      const loaded = manager.loadPosition("instance-1");
      expectResultOk(loaded);
      expect(loaded.value).toEqual({ top: 100 });
    });

    it("should handle multiple saves for different instances", () => {
      const position1 = { top: 100, left: 200 };
      const position2 = { top: 200, left: 300 };

      manager.savePosition("instance-1", position1);
      manager.savePosition("instance-2", position2);

      const result1 = manager.loadPosition("instance-1");
      const result2 = manager.loadPosition("instance-2");

      expectResultOk(result1);
      expectResultOk(result2);
      expect(result1.value).toEqual(position1);
      expect(result2.value).toEqual(position2);
    });

    it("should return error if localStorage.setItem fails", () => {
      // Create a new manager instance to avoid side effects
      const testManager = new WindowPositionManager();

      // Mock localStorage.setItem to throw an error using Object.defineProperty
      const originalSetItem = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(localStorage),
        "setItem"
      ) as PropertyDescriptor;
      Object.defineProperty(localStorage, "setItem", {
        value: () => {
          throw new Error("Storage quota exceeded");
        },
        writable: true,
        configurable: true,
      });

      const position = { top: 100, left: 200 };
      const result = testManager.savePosition("instance-1", position);

      expectResultErr(result);
      expect(result.error.code).toBe("PositionSaveFailed");
      expect(result.error.message).toContain("Failed to save position");

      // Restore original
      if (originalSetItem) {
        Object.defineProperty(localStorage, "setItem", originalSetItem);
      }
    });
  });

  describe("getEffectivePosition", () => {
    it("should return undefined if no saved and no initial position", () => {
      const result = manager.getEffectivePosition("instance-1");

      expectResultOk(result);
      expect(result.value).toBeUndefined();
    });

    it("should return initial position if no saved position", () => {
      const initialPosition = { top: 100, left: 200 };

      const result = manager.getEffectivePosition("instance-1", initialPosition);

      expectResultOk(result);
      expect(result.value).toEqual(initialPosition);
    });

    it("should return saved position if no initial position", () => {
      const savedPosition = { top: 150, left: 250 };
      localStorage.setItem("windowPosition:instance-1", JSON.stringify(savedPosition));

      const result = manager.getEffectivePosition("instance-1");

      expectResultOk(result);
      expect(result.value).toEqual(savedPosition);
    });

    it("should combine saved and initial position (saved overrides initial)", () => {
      const initialPosition = { top: 100, left: 200, width: 300, height: 400 };
      const savedPosition = { top: 150, left: 250 };
      localStorage.setItem("windowPosition:instance-1", JSON.stringify(savedPosition));

      const result = manager.getEffectivePosition("instance-1", initialPosition);

      expectResultOk(result);
      expect(result.value).toEqual({
        top: 150, // from saved
        left: 250, // from saved
        width: 300, // from initial
        height: 400, // from initial
      });
    });

    it("should handle complex position merging", () => {
      const initialPosition = {
        top: 100,
        left: 200,
        width: 300,
        height: 400,
      };
      const savedPosition = {
        top: 150,
        left: 250,
      };
      localStorage.setItem("windowPosition:instance-1", JSON.stringify(savedPosition));

      const result = manager.getEffectivePosition("instance-1", initialPosition);

      expectResultOk(result);
      expect(result.value).toEqual({
        top: 150,
        left: 250,
        width: 300,
        height: 400,
      });
    });

    it("should return error if loadPosition fails in getEffectivePosition", () => {
      // Create a new manager instance to avoid side effects
      const testManager = new WindowPositionManager();

      // Mock localStorage.getItem to throw an error using Object.defineProperty
      const originalGetItem = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(localStorage),
        "getItem"
      ) as PropertyDescriptor;
      Object.defineProperty(localStorage, "getItem", {
        value: () => {
          throw new Error("Storage error");
        },
        writable: true,
        configurable: true,
      });

      const result = testManager.getEffectivePosition("instance-1", { top: 100, left: 200 });

      expectResultErr(result);
      expect(result.error.code).toBe("PositionLoadFailed");

      // Restore original
      if (originalGetItem) {
        Object.defineProperty(localStorage, "getItem", originalGetItem);
      }
    });
  });
});
