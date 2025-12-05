import { describe, it, expect } from "vitest";
import { getFirstArrayElement, getFirstArrayElementSafe, isNonEmptyArray } from "../array-utils";

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

    it("should throw error when array is empty (caller violated precondition)", () => {
      const array: number[] = [];
      // Note: Caller MUST verify array.length > 0 before calling
      // This test documents the behavior when that contract is violated
      expect(() => getFirstArrayElement(array)).toThrow(
        "Array must have length > 0 (caller violated precondition)"
      );
    });

    it("should work with object arrays", () => {
      const array = [{ id: 1 }, { id: 2 }];
      const result = getFirstArrayElement(array);
      expect(result).toEqual({ id: 1 });
    });

    it("should be used with length guard in typical usage", () => {
      const errors: Error[] = [new Error("test")];
      if (errors.length > 0) {
        const firstError = getFirstArrayElement(errors);
        expect(firstError).toBeInstanceOf(Error);
        expect(firstError.message).toBe("test");
      }
    });
  });

  describe("getFirstArrayElementSafe", () => {
    it("should return first element from non-empty array", () => {
      const array = [1, 2, 3];
      const result = getFirstArrayElementSafe(array);
      expect(result).toBe(1);
    });

    it("should return null when array is empty", () => {
      const array: number[] = [];
      const result = getFirstArrayElementSafe(array);
      expect(result).toBeNull();
    });

    it("should return first element from array with single element", () => {
      const array = ["single"];
      const result = getFirstArrayElementSafe(array);
      expect(result).toBe("single");
    });

    it("should work with object arrays", () => {
      const array = [{ id: 1 }, { id: 2 }];
      const result = getFirstArrayElementSafe(array);
      expect(result).toEqual({ id: 1 });
    });

    it("should handle empty array gracefully without guard", () => {
      const errors: Error[] = [];
      const firstError = getFirstArrayElementSafe(errors);
      if (firstError !== null) {
        expect(firstError).toBeInstanceOf(Error);
      } else {
        expect(firstError).toBeNull();
      }
    });

    it("should allow null-check pattern", () => {
      const array = [42];
      const result = getFirstArrayElementSafe(array);
      if (result !== null) {
        // TypeScript knows result is number here
        expect(typeof result).toBe("number");
        expect(result).toBe(42);
      }
    });
  });
});
