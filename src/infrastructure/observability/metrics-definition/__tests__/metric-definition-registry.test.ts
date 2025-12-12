import { describe, it, expect, beforeEach } from "vitest";
import { MetricDefinitionRegistry } from "../metric-definition-registry";
import type { MetricDefinition } from "../metric-definition.interface";

describe("MetricDefinitionRegistry", () => {
  let registry: MetricDefinitionRegistry;

  beforeEach(() => {
    registry = new MetricDefinitionRegistry();
  });

  describe("register", () => {
    it("should register a metric definition", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition);

      expect(registry.get("test")).toBe(definition);
    });

    it("should throw error when registering duplicate key", () => {
      const definition1: MetricDefinition<number> = {
        key: "duplicate",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const definition2: MetricDefinition<number> = {
        key: "duplicate",
        initialValue: 0,
        reducer: (current: number) => current + 2,
        serializer: (value: number) => value,
      };

      registry.register(definition1);

      expect(() => {
        registry.register(definition2);
      }).toThrow('Metric definition with key "duplicate" already exists');
    });
  });

  describe("get", () => {
    it("should return undefined for non-existent key", () => {
      const result = registry.get("nonexistent");
      expect(result).toBeUndefined();
    });

    it("should return registered definition", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition);
      const result = registry.get("test");

      expect(result).toBe(definition);
    });
  });

  describe("getAll", () => {
    it("should return all registered definitions", () => {
      const definition1: MetricDefinition<number> = {
        key: "test1",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const definition2: MetricDefinition<string> = {
        key: "test2",
        initialValue: "",
        reducer: (current: string) => current + "x",
        serializer: (value: string) => value,
      };

      registry.register(definition1);
      registry.register(definition2);

      const all = registry.getAll();

      expect(all).toHaveLength(2);
      expect(all).toContain(definition1);
      expect(all).toContain(definition2);
    });

    it("should return empty array when no definitions registered", () => {
      const all = registry.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe("has", () => {
    it("should return false for non-existent key", () => {
      expect(registry.has("nonexistent")).toBe(false);
    });

    it("should return true for registered key", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition);

      expect(registry.has("test")).toBe(true);
    });
  });

  describe("remove", () => {
    it("should return false when removing non-existent key", () => {
      const result = registry.remove("nonexistent");
      expect(result).toBe(false);
    });

    it("should return true and remove definition", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition);
      const result = registry.remove("test");

      expect(result).toBe(true);
      expect(registry.get("test")).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should clear all definitions", () => {
      const definition1: MetricDefinition<number> = {
        key: "test1",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const definition2: MetricDefinition<number> = {
        key: "test2",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition1);
      registry.register(definition2);

      registry.clear();

      expect(registry.size()).toBe(0);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe("size", () => {
    it("should return 0 for empty registry", () => {
      expect(registry.size()).toBe(0);
    });

    it("should return correct size after registrations", () => {
      const definition1: MetricDefinition<number> = {
        key: "test1",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const definition2: MetricDefinition<number> = {
        key: "test2",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      registry.register(definition1);
      expect(registry.size()).toBe(1);

      registry.register(definition2);
      expect(registry.size()).toBe(2);
    });
  });
});
