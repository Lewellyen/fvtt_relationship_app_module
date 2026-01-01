import { describe, it, expect } from "vitest";
import { toStringKeyArray, getFirstArrayElement, getFirstElementIfArray } from "../type-casts";

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

  describe("getFirstElementIfArray", () => {
    it("should return first element when array is valid and typeGuard passes", () => {
      // Arrange
      const array = [42, 43, 44];
      const typeGuard = (value: unknown): value is number => typeof value === "number";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toBe(42);
    });

    it("should return null when value is not an array", () => {
      // Arrange
      const value = "not an array";
      const typeGuard = (val: unknown): val is number => typeof val === "number";

      // Act
      const result = getFirstElementIfArray(value, typeGuard);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when array is empty", () => {
      // Arrange
      const array: unknown[] = [];
      const typeGuard = (value: unknown): value is number => typeof value === "number";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toBeNull();
    });

    it("should return null when typeGuard returns false for first element (coverage for else branch)", () => {
      // Arrange
      const array = ["string", 42, 43];
      const typeGuard = (value: unknown): value is number => typeof value === "number";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toBeNull();
    });

    it("should return first element when typeGuard passes for first element", () => {
      // Arrange
      const array = [42, "string", 43];
      const typeGuard = (value: unknown): value is number => typeof value === "number";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toBe(42);
    });

    it("should work with custom type guard for objects", () => {
      // Arrange
      type TestObj = { id: number; name: string };
      const array = [
        { id: 1, name: "first" },
        { id: 2, name: "second" },
      ];
      const typeGuard = (value: unknown): value is TestObj =>
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "name" in value &&
        typeof (value as TestObj).id === "number" &&
        typeof (value as TestObj).name === "string";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toEqual({ id: 1, name: "first" });
    });

    it("should return null when custom type guard fails for first element", () => {
      // Arrange
      type TestObj = { id: number; name: string };
      const array = [
        { id: "wrong", name: "first" }, // id is string, not number
        { id: 2, name: "second" },
      ];
      const typeGuard = (value: unknown): value is TestObj =>
        typeof value === "object" &&
        value !== null &&
        "id" in value &&
        "name" in value &&
        typeof (value as TestObj).id === "number" &&
        typeof (value as TestObj).name === "string";

      // Act
      const result = getFirstElementIfArray(array, typeGuard);

      // Assert
      expect(result).toBeNull();
    });
  });
});
