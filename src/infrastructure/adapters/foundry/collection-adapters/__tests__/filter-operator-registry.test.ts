import { describe, it, expect, beforeEach } from "vitest";
import { FilterOperatorRegistry } from "../filter-operator-registry";
import type { FilterOperator } from "../filter-operator.interface";

// Test implementation for testing the registry
class TestOperator implements FilterOperator {
  constructor(public readonly name: string) {}

  matches(_fieldValue: unknown, _filterValue: unknown): boolean {
    return true;
  }
}

describe("FilterOperatorRegistry", () => {
  let registry: FilterOperatorRegistry;

  beforeEach(() => {
    registry = new FilterOperatorRegistry();
  });

  describe("register", () => {
    it("should register an operator", () => {
      const operator = new TestOperator("test");
      registry.register(operator);

      expect(registry.has("test")).toBe(true);
      expect(registry.get("test")).toBe(operator);
    });

    it("should throw error when registering duplicate operator", () => {
      const operator1 = new TestOperator("test");
      const operator2 = new TestOperator("test");

      registry.register(operator1);

      expect(() => registry.register(operator2)).toThrow(
        'Filter operator "test" is already registered'
      );
    });
  });

  describe("unregister", () => {
    it("should unregister an operator", () => {
      const operator = new TestOperator("test");
      registry.register(operator);

      const result = registry.unregister("test");

      expect(result).toBe(true);
      expect(registry.has("test")).toBe(false);
      expect(registry.get("test")).toBeUndefined();
    });

    it("should return false when unregistering non-existent operator", () => {
      const result = registry.unregister("nonexistent");

      expect(result).toBe(false);
    });
  });

  describe("get", () => {
    it("should return registered operator", () => {
      const operator = new TestOperator("test");
      registry.register(operator);

      const retrieved = registry.get("test");

      expect(retrieved).toBe(operator);
    });

    it("should return undefined for non-existent operator", () => {
      const retrieved = registry.get("nonexistent");

      expect(retrieved).toBeUndefined();
    });
  });

  describe("has", () => {
    it("should return true for registered operator", () => {
      const operator = new TestOperator("test");
      registry.register(operator);

      expect(registry.has("test")).toBe(true);
    });

    it("should return false for non-existent operator", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });
  });

  describe("getOperatorNames", () => {
    it("should return empty array for empty registry", () => {
      const names = registry.getOperatorNames();

      expect(names).toEqual([]);
    });

    it("should return all registered operator names", () => {
      registry.register(new TestOperator("operator1"));
      registry.register(new TestOperator("operator2"));
      registry.register(new TestOperator("operator3"));

      const names = registry.getOperatorNames();

      expect(names).toHaveLength(3);
      expect(names).toContain("operator1");
      expect(names).toContain("operator2");
      expect(names).toContain("operator3");
    });

    it("should not return unregistered operator names", () => {
      registry.register(new TestOperator("operator1"));
      registry.register(new TestOperator("operator2"));
      registry.unregister("operator2");

      const names = registry.getOperatorNames();

      expect(names).toHaveLength(1);
      expect(names).toContain("operator1");
      expect(names).not.toContain("operator2");
    });
  });
});
