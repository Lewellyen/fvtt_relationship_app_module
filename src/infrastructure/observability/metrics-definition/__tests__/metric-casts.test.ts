import { describe, it, expect } from "vitest";
import { isValidMetricDefinition, castToMetricDefinition, castMetricValue } from "../metric-casts";
import type { MetricDefinition } from "../metric-definition.interface";

describe("metric-casts", () => {
  describe("isValidMetricDefinition", () => {
    it("should return true for valid MetricDefinition", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      expect(isValidMetricDefinition(definition)).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidMetricDefinition(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidMetricDefinition(undefined)).toBe(false);
    });

    it("should return false for primitive types", () => {
      expect(isValidMetricDefinition(42)).toBe(false);
      expect(isValidMetricDefinition("string")).toBe(false);
      expect(isValidMetricDefinition(true)).toBe(false);
    });

    it("should return false for object without key", () => {
      const invalid = {
        initialValue: 0,
        reducer: () => 0,
        serializer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object with non-string key", () => {
      const invalid = {
        key: 42,
        initialValue: 0,
        reducer: () => 0,
        serializer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object without initialValue", () => {
      const invalid = {
        key: "test",
        reducer: () => 0,
        serializer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object without reducer", () => {
      const invalid = {
        key: "test",
        initialValue: 0,
        serializer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object with non-function reducer", () => {
      const invalid = {
        key: "test",
        initialValue: 0,
        reducer: "not a function",
        serializer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object without serializer", () => {
      const invalid = {
        key: "test",
        initialValue: 0,
        reducer: () => 0,
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });

    it("should return false for object with non-function serializer", () => {
      const invalid = {
        key: "test",
        initialValue: 0,
        reducer: () => 0,
        serializer: "not a function",
      };

      expect(isValidMetricDefinition(invalid)).toBe(false);
    });
  });

  describe("castToMetricDefinition", () => {
    it("should return MetricDefinition for valid definition", () => {
      const definition: MetricDefinition<number> = {
        key: "test",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const result = castToMetricDefinition(definition);

      expect(result).toBe(definition);
      expect(result.key).toBe("test");
    });

    it("should throw error for invalid definition", () => {
      const invalid = {
        key: "test",
        // missing required properties
      } as unknown as MetricDefinition<number>;

      expect(() => {
        castToMetricDefinition(invalid);
      }).toThrow('Invalid metric definition structure for key "test"');
    });

    it("should throw error for null", () => {
      expect(() => {
        castToMetricDefinition(null as unknown as MetricDefinition<number>);
      }).toThrow();
    });

    it("should throw error for primitive", () => {
      expect(() => {
        castToMetricDefinition(42 as unknown as MetricDefinition<number>);
      }).toThrow();
    });
  });

  describe("castMetricValue", () => {
    it("should return value for valid value", () => {
      const value = 42;
      const result = castMetricValue<number>(value, "test");

      expect(result).toBe(42);
    });

    it("should return value for string", () => {
      const value = "test";
      const result = castMetricValue<string>(value, "test");

      expect(result).toBe("test");
    });

    it("should return value for object", () => {
      const value = { count: 5 };
      const result = castMetricValue<{ count: number }>(value, "test");

      expect(result).toEqual({ count: 5 });
    });

    it("should return value for null", () => {
      const value = null;
      const result = castMetricValue<null>(value, "test");

      expect(result).toBeNull();
    });

    it("should throw error for undefined", () => {
      expect(() => {
        castMetricValue<number>(undefined, "testKey");
      }).toThrow(
        'Metric value for key "testKey" is undefined. This indicates a registry initialization issue.'
      );
    });
  });
});
