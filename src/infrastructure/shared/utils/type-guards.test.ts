/**
 * Tests for type-guard utilities.
 */

import { describe, it, expect } from "vitest";
import { hasMethod, hasProperty, isObjectWithMethods } from "./type-guards";

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
});
