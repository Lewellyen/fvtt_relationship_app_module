/**
 * Tests for domain type-guard utilities.
 */

import { describe, it, expect } from "vitest";
import { hasOwnProperty, isRecord } from "../type-guards";

describe("domain/utils/type-guards", () => {
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

  describe("isRecord", () => {
    it("should return true for plain object", () => {
      const obj = { name: "test" };
      expect(isRecord(obj)).toBe(true);
    });

    it("should return false for array", () => {
      const arr = [1, 2, 3];
      expect(isRecord(arr)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isRecord(null)).toBe(false);
    });

    it("should return false for primitive values", () => {
      expect(isRecord("string")).toBe(false);
      expect(isRecord(42)).toBe(false);
      expect(isRecord(true)).toBe(false);
    });
  });
});
