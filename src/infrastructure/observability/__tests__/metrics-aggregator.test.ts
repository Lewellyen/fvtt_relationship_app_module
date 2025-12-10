import { describe, it, expect, beforeEach } from "vitest";
import { MetricsAggregator } from "../metrics-aggregator";
import type { IRawMetrics } from "../interfaces/raw-metrics.interface";

describe("MetricsAggregator", () => {
  let aggregator: MetricsAggregator;

  beforeEach(() => {
    aggregator = new MetricsAggregator();
  });

  describe("aggregate", () => {
    it("should aggregate raw metrics into snapshot", () => {
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
        resolutionTimesIndex: 0,
        resolutionTimesCount: 3,
      };

      const snapshot = aggregator.aggregate(rawMetrics);

      expect(snapshot.containerResolutions).toBe(10);
      expect(snapshot.resolutionErrors).toBe(2);
      expect(snapshot.avgResolutionTimeMs).toBe(4.0); // (2+4+6)/3
      expect(snapshot.portSelections[13]).toBe(5);
      expect(snapshot.portSelections[12]).toBe(3);
      expect(snapshot.portSelectionFailures[11]).toBe(1);
      expect(snapshot.cacheHitRate).toBe(80); // 8/10 * 100
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

      const snapshot = aggregator.aggregate(rawMetrics);

      expect(snapshot.containerResolutions).toBe(0);
      expect(snapshot.resolutionErrors).toBe(0);
      expect(snapshot.avgResolutionTimeMs).toBe(0);
      expect(snapshot.cacheHitRate).toBe(0);
      expect(Object.keys(snapshot.portSelections)).toHaveLength(0);
      expect(Object.keys(snapshot.portSelectionFailures)).toHaveLength(0);
    });
  });

  describe("calculateAverage", () => {
    it("should calculate average correctly", () => {
      const times = new Float64Array([2.0, 4.0, 6.0, 8.0]);
      const avg = aggregator.calculateAverage(times, 4);
      expect(avg).toBe(5.0); // (2+4+6+8)/4
    });

    it("should return 0 for empty array", () => {
      const times = new Float64Array(100);
      const avg = aggregator.calculateAverage(times, 0);
      expect(avg).toBe(0);
    });

    it("should handle single value", () => {
      const times = new Float64Array([5.5]);
      const avg = aggregator.calculateAverage(times, 1);
      expect(avg).toBe(5.5);
    });

    it("should only use first count elements", () => {
      const times = new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0]);
      const avg = aggregator.calculateAverage(times, 3);
      expect(avg).toBe(2.0); // (1+2+3)/3
    });
  });

  describe("calculateCacheHitRate", () => {
    it("should calculate hit rate correctly", () => {
      const rate = aggregator.calculateCacheHitRate(8, 2);
      expect(rate).toBe(80); // 8/10 * 100
    });

    it("should return 0 when no cache accesses", () => {
      const rate = aggregator.calculateCacheHitRate(0, 0);
      expect(rate).toBe(0);
    });

    it("should return 100 when all hits", () => {
      const rate = aggregator.calculateCacheHitRate(10, 0);
      expect(rate).toBe(100);
    });

    it("should return 0 when all misses", () => {
      const rate = aggregator.calculateCacheHitRate(0, 10);
      expect(rate).toBe(0);
    });

    it("should handle fractional percentages", () => {
      const rate = aggregator.calculateCacheHitRate(1, 2);
      expect(rate).toBeCloseTo(33.33, 1); // 1/3 * 100
    });
  });
});
