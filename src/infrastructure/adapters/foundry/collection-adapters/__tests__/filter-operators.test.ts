import { describe, it, expect } from "vitest";
import { EqualsOperator } from "../operators/equals-operator";
import { NotEqualsOperator } from "../operators/not-equals-operator";
import { ContainsOperator } from "../operators/contains-operator";
import { StartsWithOperator } from "../operators/starts-with-operator";
import { EndsWithOperator } from "../operators/ends-with-operator";
import { InOperator } from "../operators/in-operator";
import { NotInOperator } from "../operators/not-in-operator";
import { GreaterThanOperator } from "../operators/greater-than-operator";
import { LessThanOperator } from "../operators/less-than-operator";
import { GreaterThanOrEqualOperator } from "../operators/greater-than-or-equal-operator";
import { LessThanOrEqualOperator } from "../operators/less-than-or-equal-operator";

describe("Filter Operators", () => {
  describe("EqualsOperator", () => {
    const operator = new EqualsOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("equals");
    });

    it("should match equal values", () => {
      expect(operator.matches("test", "test")).toBe(true);
      expect(operator.matches(42, 42)).toBe(true);
      expect(operator.matches(true, true)).toBe(true);
    });

    it("should not match unequal values", () => {
      expect(operator.matches("test", "other")).toBe(false);
      expect(operator.matches(42, 43)).toBe(false);
      expect(operator.matches(true, false)).toBe(false);
    });
  });

  describe("NotEqualsOperator", () => {
    const operator = new NotEqualsOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("notEquals");
    });

    it("should not match equal values", () => {
      expect(operator.matches("test", "test")).toBe(false);
      expect(operator.matches(42, 42)).toBe(false);
    });

    it("should match unequal values", () => {
      expect(operator.matches("test", "other")).toBe(true);
      expect(operator.matches(42, 43)).toBe(true);
    });
  });

  describe("ContainsOperator", () => {
    const operator = new ContainsOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("contains");
    });

    it("should match if field contains filter value (case-insensitive)", () => {
      expect(operator.matches("Hello World", "world")).toBe(true);
      expect(operator.matches("Hello World", "WORLD")).toBe(true);
      expect(operator.matches("Hello World", "hello")).toBe(true);
      expect(operator.matches("Hello World", "Hello")).toBe(true);
    });

    it("should not match if field does not contain filter value", () => {
      expect(operator.matches("Hello World", "xyz")).toBe(false);
      expect(operator.matches("test", "other")).toBe(false);
    });
  });

  describe("StartsWithOperator", () => {
    const operator = new StartsWithOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("startsWith");
    });

    it("should match if field starts with filter value (case-insensitive)", () => {
      expect(operator.matches("Hello World", "hello")).toBe(true);
      expect(operator.matches("Hello World", "HELLO")).toBe(true);
      expect(operator.matches("test", "T")).toBe(true);
    });

    it("should not match if field does not start with filter value", () => {
      expect(operator.matches("Hello World", "World")).toBe(false);
      expect(operator.matches("test", "est")).toBe(false);
    });
  });

  describe("EndsWithOperator", () => {
    const operator = new EndsWithOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("endsWith");
    });

    it("should match if field ends with filter value (case-insensitive)", () => {
      expect(operator.matches("Hello World", "world")).toBe(true);
      expect(operator.matches("Hello World", "WORLD")).toBe(true);
      expect(operator.matches("test", "T")).toBe(true);
    });

    it("should not match if field does not end with filter value", () => {
      expect(operator.matches("Hello World", "Hello")).toBe(false);
      expect(operator.matches("test", "tes")).toBe(false);
    });
  });

  describe("InOperator", () => {
    const operator = new InOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("in");
    });

    it("should match if field value is in array", () => {
      expect(operator.matches("test", ["test", "other"])).toBe(true);
      expect(operator.matches(42, [1, 42, 3])).toBe(true);
      expect(operator.matches("test", ["test"])).toBe(true);
    });

    it("should not match if field value is not in array", () => {
      expect(operator.matches("xyz", ["test", "other"])).toBe(false);
      expect(operator.matches(99, [1, 42, 3])).toBe(false);
    });

    it("should return false if filter value is not an array", () => {
      expect(operator.matches("test", "not-an-array")).toBe(false);
      expect(operator.matches("test", 42)).toBe(false);
      expect(operator.matches("test", null)).toBe(false);
      expect(operator.matches("test", undefined)).toBe(false);
    });
  });

  describe("NotInOperator", () => {
    const operator = new NotInOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("notIn");
    });

    it("should not match if field value is in array", () => {
      expect(operator.matches("test", ["test", "other"])).toBe(false);
      expect(operator.matches(42, [1, 42, 3])).toBe(false);
    });

    it("should match if field value is not in array", () => {
      expect(operator.matches("xyz", ["test", "other"])).toBe(true);
      expect(operator.matches(99, [1, 42, 3])).toBe(true);
    });

    it("should return false if filter value is not an array", () => {
      expect(operator.matches("test", "not-an-array")).toBe(false);
      expect(operator.matches("test", 42)).toBe(false);
    });
  });

  describe("GreaterThanOperator", () => {
    const operator = new GreaterThanOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("greaterThan");
    });

    it("should match if field value is greater than filter value", () => {
      expect(operator.matches(5, 3)).toBe(true);
      expect(operator.matches(10, 5)).toBe(true);
      expect(operator.matches("10", "5")).toBe(true); // String comparison after Number()
    });

    it("should not match if field value is not greater than filter value", () => {
      expect(operator.matches(3, 5)).toBe(false);
      expect(operator.matches(5, 5)).toBe(false);
      expect(operator.matches(5, 10)).toBe(false);
    });
  });

  describe("LessThanOperator", () => {
    const operator = new LessThanOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("lessThan");
    });

    it("should match if field value is less than filter value", () => {
      expect(operator.matches(3, 5)).toBe(true);
      expect(operator.matches(5, 10)).toBe(true);
    });

    it("should not match if field value is not less than filter value", () => {
      expect(operator.matches(5, 3)).toBe(false);
      expect(operator.matches(5, 5)).toBe(false);
      expect(operator.matches(10, 5)).toBe(false);
    });
  });

  describe("GreaterThanOrEqualOperator", () => {
    const operator = new GreaterThanOrEqualOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("greaterThanOrEqual");
    });

    it("should match if field value is greater than or equal to filter value", () => {
      expect(operator.matches(5, 3)).toBe(true);
      expect(operator.matches(5, 5)).toBe(true);
      expect(operator.matches(10, 5)).toBe(true);
    });

    it("should not match if field value is less than filter value", () => {
      expect(operator.matches(3, 5)).toBe(false);
      expect(operator.matches(5, 10)).toBe(false);
    });
  });

  describe("LessThanOrEqualOperator", () => {
    const operator = new LessThanOrEqualOperator();

    it("should have correct name", () => {
      expect(operator.name).toBe("lessThanOrEqual");
    });

    it("should match if field value is less than or equal to filter value", () => {
      expect(operator.matches(3, 5)).toBe(true);
      expect(operator.matches(5, 5)).toBe(true);
      expect(operator.matches(5, 10)).toBe(true);
    });

    it("should not match if field value is greater than filter value", () => {
      expect(operator.matches(5, 3)).toBe(false);
      expect(operator.matches(10, 5)).toBe(false);
    });
  });
});
