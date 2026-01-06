/**
 * Tests for type-guard utilities.
 */

import { describe, it, expect } from "vitest";
import {
  hasMethod,
  hasProperty,
  hasOwnProperty,
  isObjectWithMethods,
  isInitializable,
} from "./type-guards";
import { ok } from "@/domain/utils/result";
import type { Initializable } from "@/domain/ports/initializable.interface";

describe("type-guards", () => {
  describe("hasMethod", () => {
    it("should return true for object with method", () => {
      const obj = { dispose: () => {} };
      expect(hasMethod(obj, "dispose")).toBe(true);
    });

    it("should return false for object without method", () => {
      const obj = { name: "test" };
      expect(hasMethod(obj, "dispose")).toBe(false);
    });

    it("should return false for object with property but not method", () => {
      const obj = { dispose: "not a function" };
      expect(hasMethod(obj, "dispose")).toBe(false);
    });

    it("should return false for null", () => {
      expect(hasMethod(null, "dispose")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(hasMethod(undefined, "dispose")).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(hasMethod("string", "dispose")).toBe(false);
      expect(hasMethod(42, "dispose")).toBe(false);
      expect(hasMethod(true, "dispose")).toBe(false);
    });

    it("should return true for object with multiple methods", () => {
      const obj = {
        method1: () => {},
        method2: () => {},
      };
      expect(hasMethod(obj, "method1")).toBe(true);
      expect(hasMethod(obj, "method2")).toBe(true);
    });

    it("should return false for array (object but methodName not in array)", () => {
      const arr = [1, 2, 3];
      expect(hasMethod(arr, "dispose")).toBe(false);
    });

    it("should return false for array with index but not method", () => {
      const arr = ["dispose"];
      expect(hasMethod(arr, "dispose")).toBe(false);
    });

    it("should return false when methodName is not in object", () => {
      const obj = { name: "test", value: 42 };
      expect(hasMethod(obj, "dispose")).toBe(false);
    });
  });

  describe("hasProperty", () => {
    it("should return true for object with property", () => {
      const obj = { name: "test" };
      expect(hasProperty(obj, "name")).toBe(true);
    });

    it("should return false for object without property", () => {
      const obj = { name: "test" };
      expect(hasProperty(obj, "other")).toBe(false);
    });

    it("should return true for property with undefined value", () => {
      const obj = { name: undefined };
      expect(hasProperty(obj, "name")).toBe(true);
    });

    it("should return false for null", () => {
      expect(hasProperty(null, "name")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(hasProperty(undefined, "name")).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(hasProperty("string", "name")).toBe(false);
      expect(hasProperty(42, "name")).toBe(false);
      expect(hasProperty(true, "name")).toBe(false);
    });
  });

  describe("hasOwnProperty", () => {
    it("should return true for object with own property", () => {
      const obj = { name: "test" };
      expect(hasOwnProperty(obj, "name")).toBe(true);
    });

    it("should return false for object without property", () => {
      const obj = { name: "test" };
      expect(hasOwnProperty(obj, "other")).toBe(false);
    });

    it("should return true for property with undefined value", () => {
      const obj = { name: undefined };
      expect(hasOwnProperty(obj, "name")).toBe(true);
    });

    it("should return false for inherited property", () => {
      const obj = Object.create({ inherited: "value" });
      expect(hasOwnProperty(obj, "inherited")).toBe(false);
    });

    it("should return false for null", () => {
      expect(hasOwnProperty(null, "name")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(hasOwnProperty(undefined, "name")).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(hasOwnProperty("string", "name")).toBe(false);
      expect(hasOwnProperty(42, "name")).toBe(false);
      expect(hasOwnProperty(true, "name")).toBe(false);
    });

    it("should return true for array index properties", () => {
      const arr = [1, 2, 3];
      expect(hasOwnProperty(arr, "0")).toBe(true);
      expect(hasOwnProperty(arr, "length")).toBe(true);
    });
  });

  describe("isObjectWithMethods", () => {
    it("should return true for object with all required methods", () => {
      const obj = {
        register: () => {},
        get: () => {},
        set: () => {},
      };
      expect(isObjectWithMethods(obj, ["register", "get", "set"])).toBe(true);
    });

    it("should return false for object missing one method", () => {
      const obj = {
        register: () => {},
        get: () => {},
      };
      expect(isObjectWithMethods(obj, ["register", "get", "set"])).toBe(false);
    });

    it("should return false for object with property instead of method", () => {
      const obj = {
        register: () => {},
        get: () => {},
        set: "not a function",
      };
      expect(isObjectWithMethods(obj, ["register", "get", "set"])).toBe(false);
    });

    it("should return false for null", () => {
      expect(isObjectWithMethods(null, ["register", "get", "set"])).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isObjectWithMethods(undefined, ["register", "get", "set"])).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isObjectWithMethods("string", ["register", "get", "set"])).toBe(false);
      expect(isObjectWithMethods(42, ["register", "get", "set"])).toBe(false);
      expect(isObjectWithMethods(true, ["register", "get", "set"])).toBe(false);
    });

    it("should return true for empty method array", () => {
      const obj = { name: "test" };
      expect(isObjectWithMethods(obj, [])).toBe(true);
    });
  });

  describe("isInitializable", () => {
    it("should return true for object with initialize method", () => {
      const obj: Initializable = {
        initialize: () => ok(undefined),
      };
      expect(isInitializable(obj)).toBe(true);
    });

    it("should return true for PersistentMetricsCollector-like object", () => {
      const obj = {
        initialize: () => ok(undefined),
        otherMethod: () => {},
      };
      expect(isInitializable(obj)).toBe(true);
    });

    it("should return false for object without initialize method", () => {
      const obj = {
        otherMethod: () => {},
      };
      expect(isInitializable(obj)).toBe(false);
    });

    it("should return false for object with initialize property but not method", () => {
      const obj = {
        initialize: "not a function",
      };
      expect(isInitializable(obj)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isInitializable(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isInitializable(undefined)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isInitializable("string")).toBe(false);
      expect(isInitializable(42)).toBe(false);
      expect(isInitializable(true)).toBe(false);
    });

    it("should allow type-safe access after guard", () => {
      const obj: unknown = {
        initialize: () => ok(undefined),
      };

      if (isInitializable(obj)) {
        const result = obj.initialize();
        expect(result.ok).toBe(true);
      } else {
        expect.fail("Type guard should have passed");
      }
    });
  });
});
