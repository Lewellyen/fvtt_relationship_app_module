import { describe, it, expect } from "vitest";
import { getFirstArrayElement, isNonEmptyArray } from "../array-utils";

describe("array-utils", () => {
  describe("isNonEmptyArray", () => {
    it("should return true for non-empty array", () => {
      const array = [1, 2, 3];
      expect(isNonEmptyArray(array)).toBe(true);
    });

    it("should return false for empty array", () => {
      const array: number[] = [];
      expect(isNonEmptyArray(array)).toBe(false);
    });

    it("should narrow type correctly", () => {
      const array: number[] = [1, 2, 3];
      if (isNonEmptyArray(array)) {
        // Type is narrowed to [number, ...number[]]
        const first: number = array[0];
        expect(first).toBe(1);
      }
    });
  });

  describe("getFirstArrayElement", () => {
    it("should return first element from non-empty array", () => {
      const array = [1, 2, 3];
      const result = getFirstArrayElement(array);
      expect(result).toBe(1);
    });

    it("should return first element from array with single element", () => {
      const array = ["single"];
      const result = getFirstArrayElement(array);
      expect(result).toBe("single");
    });

    it("should throw error when array is empty", () => {
      const array: number[] = [];
      expect(() => getFirstArrayElement(array)).toThrow(
        "Cannot get first element from empty array"
      );
    });

    it("should work with object arrays", () => {
      const array = [{ id: 1 }, { id: 2 }];
      const result = getFirstArrayElement(array);
      expect(result).toEqual({ id: 1 });
    });
  });
});
