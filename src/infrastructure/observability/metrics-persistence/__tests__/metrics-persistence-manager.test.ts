import { describe, it, expect, beforeEach } from "vitest";
import { MetricsPersistenceManager } from "../metrics-persistence-manager";
import type { IRawMetrics } from "../../interfaces/raw-metrics.interface";
import type { MetricsPersistenceState } from "../../metrics-types";

describe("MetricsPersistenceManager", () => {
  let manager: MetricsPersistenceManager;

  beforeEach(() => {
    manager = new MetricsPersistenceManager();
  });

  describe("serialize", () => {
    it("should serialize raw metrics to persistence state", () => {
      const rawMetrics: IRawMetrics = {
        containerResolutions: 10,
        resolutionErrors: 2,
        cacheHits: 8,
        cacheMisses: 2,
        portSelections: new Map([
          [13, 5],
          [12, 3],
        ]),
        portSelectionFailures: new Map([[11, 1]]),
        resolutionTimes: new Float64Array([2.0, 4.0, 6.0]),
        resolutionTimesIndex: 1,
        resolutionTimesCount: 3,
      };

      const state = manager.serialize(rawMetrics);

      expect(state.metrics.containerResolutions).toBe(10);
      expect(state.metrics.resolutionErrors).toBe(2);
      expect(state.metrics.cacheHits).toBe(8);
      expect(state.metrics.cacheMisses).toBe(2);
      expect(state.metrics.portSelections[13]).toBe(5);
      expect(state.metrics.portSelections[12]).toBe(3);
      expect(state.metrics.portSelectionFailures[11]).toBe(1);
      expect(state.resolutionTimes).toEqual([2.0, 4.0, 6.0]);
      expect(state.resolutionTimesIndex).toBe(1);
      expect(state.resolutionTimesCount).toBe(3);
    });

    it("should handle empty metrics", () => {
      const rawMetrics: IRawMetrics = {
        containerResolutions: 0,
        resolutionErrors: 0,
        cacheHits: 0,
        cacheMisses: 0,
        portSelections: new Map(),
        portSelectionFailures: new Map(),
        resolutionTimes: new Float64Array(100),
        resolutionTimesIndex: 0,
        resolutionTimesCount: 0,
      };

      const state = manager.serialize(rawMetrics);

      expect(state.metrics.containerResolutions).toBe(0);
      // Serialization converts entire array, but count is 0
      expect(state.resolutionTimesCount).toBe(0);
    });
  });

  describe("deserialize", () => {
    it("should deserialize persistence state to raw metrics", () => {
      const state: MetricsPersistenceState = {
        metrics: {
          containerResolutions: 10,
          resolutionErrors: 2,
          cacheHits: 8,
          cacheMisses: 2,
          portSelections: { 13: 5, 12: 3 },
          portSelectionFailures: { 11: 1 },
        },
        resolutionTimes: [2.0, 4.0, 6.0],
        resolutionTimesIndex: 1,
        resolutionTimesCount: 3,
      };

      const rawMetrics = manager.deserialize(state);

      expect(rawMetrics.containerResolutions).toBe(10);
      expect(rawMetrics.resolutionErrors).toBe(2);
      expect(rawMetrics.cacheHits).toBe(8);
      expect(rawMetrics.cacheMisses).toBe(2);
      expect(rawMetrics.portSelections.get(13)).toBe(5);
      expect(rawMetrics.portSelections.get(12)).toBe(3);
      expect(rawMetrics.portSelectionFailures.get(11)).toBe(1);
      expect(Array.from(rawMetrics.resolutionTimes.slice(0, 3))).toEqual([2.0, 4.0, 6.0]);
      expect(rawMetrics.resolutionTimesIndex).toBe(1);
      expect(rawMetrics.resolutionTimesCount).toBe(3);
    });

    it("should return empty metrics for null state", () => {
      const rawMetrics = manager.deserialize(null);

      expect(rawMetrics.containerResolutions).toBe(0);
      expect(rawMetrics.resolutionErrors).toBe(0);
      expect(rawMetrics.cacheHits).toBe(0);
      expect(rawMetrics.cacheMisses).toBe(0);
      expect(rawMetrics.portSelections.size).toBe(0);
      expect(rawMetrics.portSelectionFailures.size).toBe(0);
      expect(rawMetrics.resolutionTimesCount).toBe(0);
    });

    it("should return empty metrics for undefined state", () => {
      const rawMetrics = manager.deserialize(undefined);

      expect(rawMetrics.containerResolutions).toBe(0);
      expect(rawMetrics.resolutionTimesCount).toBe(0);
    });

    it("should sanitize invalid values", () => {
      const state: MetricsPersistenceState = {
        metrics: {
          containerResolutions: -10,
          resolutionErrors: -5,
          cacheHits: -2,
          cacheMisses: -3,
          portSelections: { 999: "bar" as unknown as number },
          portSelectionFailures: { 13: "NaN" as unknown as number },
        },
        resolutionTimes: [Number.NaN, 4.0],
        resolutionTimesIndex: Number.POSITIVE_INFINITY,
        resolutionTimesCount: Number.NaN,
      };

      const rawMetrics = manager.deserialize(state);

      expect(rawMetrics.containerResolutions).toBe(0); // Sanitized
      expect(rawMetrics.resolutionErrors).toBe(0); // Sanitized
      expect(rawMetrics.portSelections.get(999)).toBe(0); // Sanitized
      expect(rawMetrics.portSelectionFailures.get(13)).toBe(0); // Sanitized
      expect(rawMetrics.resolutionTimes[0]).toBe(0); // NaN sanitized
      expect(rawMetrics.resolutionTimes[1]).toBe(4.0); // Valid value preserved
    });

    it("should handle missing metrics object", () => {
      const state = {
        metrics: undefined as unknown as MetricsPersistenceState["metrics"],
        resolutionTimes: [] as number[],
        resolutionTimesIndex: 0,
        resolutionTimesCount: 0,
      };

      const rawMetrics = manager.deserialize(state as MetricsPersistenceState);

      expect(rawMetrics.containerResolutions).toBe(0);
      expect(rawMetrics.portSelections.size).toBe(0);
    });

    it("should handle non-array resolutionTimes", () => {
      const state = {
        metrics: {
          containerResolutions: 1,
          resolutionErrors: 0,
          cacheHits: 0,
          cacheMisses: 0,
          portSelections: {},
          portSelectionFailures: {},
        },
        resolutionTimes: undefined as unknown as number[],
        resolutionTimesIndex: 5,
        resolutionTimesCount: 3,
      };

      const rawMetrics = manager.deserialize(state as MetricsPersistenceState);

      expect(rawMetrics.containerResolutions).toBe(1);
      // When resolutionTimes is not an array, count should be reset to 0
      expect(rawMetrics.resolutionTimesCount).toBe(0);
      expect(rawMetrics.resolutionTimesIndex).toBe(0);
    });
  });
});
