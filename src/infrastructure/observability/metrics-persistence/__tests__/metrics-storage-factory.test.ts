import { describe, it, expect } from "vitest";
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-collector";
import {
  createInMemoryMetricsStorage,
  createMetricsStorage,
} from "@/infrastructure/observability/metrics-persistence/metrics-storage-factory";
import { LocalStorageMetricsStorage } from "@/infrastructure/observability/metrics-persistence/local-storage-metrics-storage";

const sampleState: MetricsPersistenceState = {
  metrics: {
    containerResolutions: 1,
    resolutionErrors: 0,
    cacheHits: 5,
    cacheMisses: 2,
    portSelections: Object.fromEntries([[13, 3]]) as Record<number, number>,
    portSelectionFailures: Object.fromEntries([[13, 0]]) as Record<number, number>,
  },
  resolutionTimes: [3, 4, 5],
  resolutionTimesIndex: 2,
  resolutionTimesCount: 3,
};

describe("metrics-storage-factory", () => {
  describe("createMetricsStorage", () => {
    it("should return a LocalStorageMetricsStorage instance for provided key", () => {
      const storage = createMetricsStorage("test.metrics-factory");

      expect(storage).toBeInstanceOf(LocalStorageMetricsStorage);
      storage.clear?.();
    });
  });

  describe("createInMemoryMetricsStorage", () => {
    it("should persist and clear state in memory only", () => {
      const storage = createInMemoryMetricsStorage();

      expect(storage.load()).toBeNull();

      storage.save(sampleState);
      expect(storage.load()).toEqual(sampleState);

      storage.clear?.();
      expect(storage.load()).toBeNull();
    });

    it("should isolate state between different instances", () => {
      const first = createInMemoryMetricsStorage();
      const second = createInMemoryMetricsStorage();

      first.save(sampleState);

      expect(second.load()).toBeNull();
      first.clear?.();
      second.clear?.();
    });
  });
});
