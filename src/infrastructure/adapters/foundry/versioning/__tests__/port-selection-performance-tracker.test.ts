/**
 * Tests for PortSelectionPerformanceTracker
 */

import { describe, it, expect, beforeEach } from "vitest";
import { PortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker";

describe("PortSelectionPerformanceTracker", () => {
  let tracker: PortSelectionPerformanceTracker;

  beforeEach(() => {
    tracker = new PortSelectionPerformanceTracker();
  });

  describe("startTracking", () => {
    it("should start performance tracking", () => {
      tracker.startTracking();
      const duration = tracker.endTracking();

      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe("endTracking", () => {
    it("should return duration in milliseconds after tracking", async () => {
      tracker.startTracking();
      // Wait a bit to ensure measurable duration
      await new Promise((resolve) => setTimeout(resolve, 10));
      const duration = tracker.endTracking();

      expect(duration).toBeGreaterThanOrEqual(5); // At least 5ms
    });

    it("should return 0 if tracking was not started", () => {
      const duration = tracker.endTracking();

      expect(duration).toBe(0);
    });

    it("should reset tracking after endTracking", () => {
      tracker.startTracking();
      tracker.endTracking();

      // Second call should return 0 because tracking was reset
      const duration = tracker.endTracking();

      expect(duration).toBe(0);
    });

    it("should allow multiple tracking cycles", async () => {
      // First cycle
      tracker.startTracking();
      await new Promise((resolve) => setTimeout(resolve, 5));
      const duration1 = tracker.endTracking();

      expect(duration1).toBeGreaterThanOrEqual(0);

      // Second cycle
      tracker.startTracking();
      await new Promise((resolve) => setTimeout(resolve, 5));
      const duration2 = tracker.endTracking();

      expect(duration2).toBeGreaterThanOrEqual(0);
      expect(duration1).not.toBe(duration2); // Should be different durations
    });
  });
});
