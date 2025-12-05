import { describe, it, expect } from "vitest";
import { toStringKeyArray, getFirstArrayElement } from "../type-casts";

describe("type-casts utility functions", () => {
  describe("toStringKeyArray", () => {
    it("should convert readonly key array to string array", () => {
      // Arrange
      type TestObject = {
        foo: string;
        bar: number;
        baz: boolean;
      };
      const keys: readonly (keyof TestObject)[] = ["foo", "bar", "baz"] as const;

      // Act
      const result = toStringKeyArray(keys);

      // Assert
      expect(result).toEqual(["foo", "bar", "baz"]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle empty array", () => {
      // Arrange
      type EmptyObject = Record<string, never>;
      const keys: readonly (keyof EmptyObject)[] = [];

      // Act
      const result = toStringKeyArray(keys);

      // Assert
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should preserve readonly modifier", () => {
      // Arrange
      type TestObject = { a: string; b: number };
      const keys: readonly (keyof TestObject)[] = ["a", "b"] as const;

      // Act
      const result = toStringKeyArray(keys);

      // Assert - result is readonly string[]
      expect(result).toEqual(["a", "b"]);
      // TypeScript will enforce readonly at compile time
    });
  });

  describe("getFirstArrayElement", () => {
    it("should return the first element of a non-empty array", () => {
      // Arrange
      const array = [1, 2, 3, 4, 5];

      // Act
      const result = getFirstArrayElement(array);

      // Assert
      expect(result).toBe(1);
    });

    it("should return the first element for string array", () => {
      // Arrange
      const array = ["first", "second", "third"];

      // Act
      const result = getFirstArrayElement(array);

      // Assert
      expect(result).toBe("first");
    });

    it("should return the first element for object array", () => {
      // Arrange
      const array = [
        { id: 1, name: "first" },
        { id: 2, name: "second" },
      ];

      // Act
      const result = getFirstArrayElement(array);

      // Assert
      expect(result).toEqual({ id: 1, name: "first" });
    });

    it("should return undefined for empty array (caller responsibility to check)", () => {
      // Arrange
      const array: number[] = [];

      // Act
      const result = getFirstArrayElement(array);

      // Assert
      // Note: Function assumes caller has verified array.length > 0
      // This test documents the behavior when that contract is violated
      expect(result).toBeUndefined();
    });

    it("should return single element for single-element array", () => {
      // Arrange
      const array = [42];

      // Act
      const result = getFirstArrayElement(array);

      // Assert
      expect(result).toBe(42);
    });
  });
});
