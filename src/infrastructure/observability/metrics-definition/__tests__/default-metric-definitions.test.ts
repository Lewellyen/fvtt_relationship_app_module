import { describe, it, expect } from "vitest";
import {
  containerResolutionsDefinition,
  resolutionErrorsDefinition,
  cacheHitsDefinition,
  cacheMissesDefinition,
  portSelectionsDefinition,
  portSelectionFailuresDefinition,
  resolutionTimesDefinition,
  createDefaultMetricDefinitionRegistry,
} from "../default-metric-definitions";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";

describe("Default Metric Definitions", () => {
  describe("containerResolutionsDefinition", () => {
    it("should increment on any event", () => {
      const result = containerResolutionsDefinition.reducer(5, {});
      expect(result).toBe(6);
    });

    it("should serialize correctly", () => {
      const serialized = containerResolutionsDefinition.serializer(42);
      expect(serialized).toBe(42);
    });
  });

  describe("resolutionErrorsDefinition", () => {
    it("should increment on failed resolution", () => {
      const event = {
        token: createInjectionToken<Logger>("Test"),
        durationMs: 10,
        success: false,
      };
      const result = resolutionErrorsDefinition.reducer(5, event);
      expect(result).toBe(6);
    });

    it("should not increment on successful resolution", () => {
      const event = {
        token: createInjectionToken<Logger>("Test"),
        durationMs: 10,
        success: true,
      };
      const result = resolutionErrorsDefinition.reducer(5, event);
      expect(result).toBe(5);
    });

    it("should return current value for invalid event", () => {
      const result = resolutionErrorsDefinition.reducer(5, null);
      expect(result).toBe(5);
    });

    it("should serialize correctly", () => {
      const serialized = resolutionErrorsDefinition.serializer(42);
      expect(serialized).toBe(42);
    });
  });

  describe("cacheHitsDefinition", () => {
    it("should increment on cache hit", () => {
      const result = cacheHitsDefinition.reducer(5, { hit: true });
      expect(result).toBe(6);
    });

    it("should not increment on cache miss", () => {
      const result = cacheHitsDefinition.reducer(5, { hit: false });
      expect(result).toBe(5);
    });

    it("should return current value for invalid event", () => {
      const result = cacheHitsDefinition.reducer(5, null);
      expect(result).toBe(5);
    });

    it("should serialize correctly", () => {
      const serialized = cacheHitsDefinition.serializer(42);
      expect(serialized).toBe(42);
    });
  });

  describe("cacheMissesDefinition", () => {
    it("should increment on cache miss", () => {
      const result = cacheMissesDefinition.reducer(5, { hit: false });
      expect(result).toBe(6);
    });

    it("should not increment on cache hit", () => {
      const result = cacheMissesDefinition.reducer(5, { hit: true });
      expect(result).toBe(5);
    });

    it("should return current value for invalid event", () => {
      const result = cacheMissesDefinition.reducer(5, null);
      expect(result).toBe(5);
    });

    it("should serialize correctly", () => {
      const serialized = cacheMissesDefinition.serializer(42);
      expect(serialized).toBe(42);
    });
  });

  describe("portSelectionsDefinition", () => {
    it("should increment count for version", () => {
      const current = new Map<number, number>();
      const result = portSelectionsDefinition.reducer(current, { version: 13 });
      expect(result.get(13)).toBe(1);
    });

    it("should increment existing count", () => {
      const current = new Map<number, number>([[13, 5]]);
      const result = portSelectionsDefinition.reducer(current, { version: 13 });
      expect(result.get(13)).toBe(6);
    });

    it("should return current map for invalid event", () => {
      const current = new Map<number, number>([[13, 5]]);
      const result = portSelectionsDefinition.reducer(current, null);
      expect(result).toBe(current);
    });

    it("should serialize correctly", () => {
      const map = new Map<number, number>([
        [13, 5],
        [12, 3],
      ]);
      const serialized = portSelectionsDefinition.serializer(map);
      expect(serialized).toEqual({ 13: 5, 12: 3 });
    });
  });

  describe("portSelectionFailuresDefinition", () => {
    it("should increment count for version", () => {
      const current = new Map<number, number>();
      const result = portSelectionFailuresDefinition.reducer(current, { version: 11 });
      expect(result.get(11)).toBe(1);
    });

    it("should increment existing count", () => {
      const current = new Map<number, number>([[11, 2]]);
      const result = portSelectionFailuresDefinition.reducer(current, { version: 11 });
      expect(result.get(11)).toBe(3);
    });

    it("should return current map for invalid event", () => {
      const current = new Map<number, number>([[11, 2]]);
      const result = portSelectionFailuresDefinition.reducer(current, null);
      expect(result).toBe(current);
    });

    it("should serialize correctly", () => {
      const map = new Map<number, number>([
        [11, 2],
        [10, 1],
      ]);
      const serialized = portSelectionFailuresDefinition.serializer(map);
      expect(serialized).toEqual({ 11: 2, 10: 1 });
    });
  });

  describe("resolutionTimesDefinition", () => {
    it("should update buffer with duration", () => {
      const current = {
        buffer: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
        index: 0,
        count: 0,
      };
      const event = {
        token: createInjectionToken<Logger>("Test"),
        durationMs: 42.5,
        success: true,
      };

      const result = resolutionTimesDefinition.reducer(current, event);

      expect(result.buffer[0]).toBe(42.5);
      expect(result.index).toBe(1);
      expect(result.count).toBe(1);
    });

    it("should handle circular buffer wrap", () => {
      const current = {
        buffer: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
        index: METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE - 1,
        count: METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE - 1,
      };
      const event = {
        token: createInjectionToken<Logger>("Test"),
        durationMs: 10.0,
        success: true,
      };

      const result = resolutionTimesDefinition.reducer(current, event);

      expect(result.index).toBe(0);
      expect(result.count).toBe(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    });

    it("should return current state for invalid event", () => {
      const current = {
        buffer: new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
        index: 5,
        count: 5,
      };
      const result = resolutionTimesDefinition.reducer(current, null);
      expect(result).toBe(current);
    });

    it("should serialize correctly", () => {
      const state = {
        buffer: new Float64Array([1.0, 2.0, 3.0]),
        index: 2,
        count: 3,
      };
      const serialized = resolutionTimesDefinition.serializer(state);
      expect(serialized).toEqual({
        buffer: [1.0, 2.0, 3.0],
        index: 2,
        count: 3,
      });
    });
  });

  describe("createDefaultMetricDefinitionRegistry", () => {
    it("should create registry with all default definitions", () => {
      const registry = createDefaultMetricDefinitionRegistry();

      expect(registry.size()).toBe(7);
      expect(registry.has("containerResolutions")).toBe(true);
      expect(registry.has("resolutionErrors")).toBe(true);
      expect(registry.has("cacheHits")).toBe(true);
      expect(registry.has("cacheMisses")).toBe(true);
      expect(registry.has("portSelections")).toBe(true);
      expect(registry.has("portSelectionFailures")).toBe(true);
      expect(registry.has("resolutionTimes")).toBe(true);
    });
  });
});
