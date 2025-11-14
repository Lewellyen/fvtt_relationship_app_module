import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MetricsCollector,
  DIMetricsCollector,
  type MetricsPersistenceState,
} from "../metrics-collector";
import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { Logger } from "@/interfaces/logger";
import type { EnvironmentConfig } from "@/config/environment";
import { LogLevel } from "@/config/environment";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import {
  PersistentMetricsCollector,
  DIPersistentMetricsCollector,
} from "@/observability/metrics-persistence/persistent-metrics-collector";
import type { MetricsStorage } from "@/observability/metrics-persistence/metrics-storage";

describe("MetricsCollector", () => {
  let collector: MetricsCollector;
  let mockEnv: EnvironmentConfig;

  beforeEach(() => {
    mockEnv = {
      isDevelopment: true,
      isProduction: false,
      logLevel: LogLevel.DEBUG,
      enablePerformanceTracking: true,
      enableDebugMode: true,
      enableMetricsPersistence: false,
      metricsPersistenceKey: "test.metrics",
      performanceSamplingRate: 1.0,
    };
    collector = new MetricsCollector(mockEnv);
  });

  describe("DI Integration", () => {
    it("should create independent instances", () => {
      const instance1 = new MetricsCollector(mockEnv);
      const instance2 = new MetricsCollector(mockEnv);

      expect(instance1).not.toBe(instance2);
    });

    it("should have environmentConfigToken in dependencies", () => {
      // Dependencies is an array of tokens (symbols), not objects
      expect(MetricsCollector.dependencies).toHaveLength(1);
      expect(MetricsCollector.dependencies[0]).toBeDefined();
      expect(String(MetricsCollector.dependencies[0])).toContain("EnvironmentConfig");
    });

    it("DI wrapper should expose same dependencies", () => {
      expect(DIMetricsCollector.dependencies).toHaveLength(1);
      expect(DIMetricsCollector.dependencies[0]).toBeDefined();
      expect(String(DIMetricsCollector.dependencies[0])).toContain("EnvironmentConfig");
    });

    it("persistent wrapper should expose dependencies", () => {
      expect(DIPersistentMetricsCollector.dependencies).toHaveLength(2);
      expect(DIPersistentMetricsCollector.dependencies[0]).toBeDefined();
      expect(DIPersistentMetricsCollector.dependencies[1]).toBeDefined();
    });

    it("persistent wrapper should construct and reuse metrics persistence", () => {
      const storage: MetricsStorage = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
        clear: vi.fn(),
      };

      const persistent = new DIPersistentMetricsCollector(mockEnv, storage);

      expect(persistent).toBeInstanceOf(PersistentMetricsCollector);
      expect(storage.load).toHaveBeenCalledTimes(1);
    });
  });

  describe("recordResolution", () => {
    it("should record successful resolution", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 2.5, true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(1);
      expect(snapshot.resolutionErrors).toBe(0);
      expect(snapshot.avgResolutionTimeMs).toBe(2.5);
    });

    it("should record failed resolution", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 3.0, false);

      const snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(1);
      expect(snapshot.resolutionErrors).toBe(1);
    });

    it("should calculate average resolution time correctly", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 2.0, true);
      collector.recordResolution(token, 4.0, true);
      collector.recordResolution(token, 6.0, true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.avgResolutionTimeMs).toBe(4.0); // (2+4+6)/3 = 4
    });

    it("should use circular buffer for resolution times", () => {
      const token = createInjectionToken<Logger>("TestService");

      // Fill beyond buffer size (100 entries)
      for (let i = 1; i <= 105; i++) {
        collector.recordResolution(token, i, true);
      }

      const snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(105);
      // Should only track last 100 entries: (6+7+...+105) / 100
      const expectedAvg = (105 * 106 - 5 * 6) / (2 * 100); // Sum of 6..105 / 100
      expect(snapshot.avgResolutionTimeMs).toBeCloseTo(expectedAvg, 1);
    });
  });

  describe("recordPortSelection", () => {
    it("should record port selection for version", () => {
      collector.recordPortSelection(13);

      const snapshot = collector.getSnapshot();
      expect(snapshot.portSelections[13]).toBe(1);
    });

    it("should increment count for multiple selections", () => {
      collector.recordPortSelection(13);
      collector.recordPortSelection(13);
      collector.recordPortSelection(12);

      const snapshot = collector.getSnapshot();
      expect(snapshot.portSelections[13]).toBe(2);
      expect(snapshot.portSelections[12]).toBe(1);
    });
  });

  describe("recordPortSelectionFailure", () => {
    it("should record port selection failure for version", () => {
      collector.recordPortSelectionFailure(11);

      const snapshot = collector.getSnapshot();
      expect(snapshot.portSelectionFailures[11]).toBe(1);
    });

    it("should increment failure count", () => {
      collector.recordPortSelectionFailure(11);
      collector.recordPortSelectionFailure(11);

      const snapshot = collector.getSnapshot();
      expect(snapshot.portSelectionFailures[11]).toBe(2);
    });
  });

  describe("recordCacheAccess", () => {
    it("should record cache hit", () => {
      collector.recordCacheAccess(true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheHitRate).toBe(100);
    });

    it("should record cache miss", () => {
      collector.recordCacheAccess(false);

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheHitRate).toBe(0);
    });

    it("should calculate cache hit rate correctly", () => {
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(false);

      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheHitRate).toBeCloseTo(66.66, 1); // 2/3 = 66.66%
    });

    it("should return 0% hit rate when no cache accesses", () => {
      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheHitRate).toBe(0);
    });
  });

  describe("getSnapshot", () => {
    it("should return immutable snapshot", () => {
      const token = createInjectionToken<Logger>("TestService");
      collector.recordResolution(token, 5.0, true);

      const snapshot1 = collector.getSnapshot();
      collector.recordResolution(token, 10.0, true);
      const snapshot2 = collector.getSnapshot();

      // First snapshot should not change
      expect(snapshot1.containerResolutions).toBe(1);
      expect(snapshot2.containerResolutions).toBe(2);
    });

    it("should return 0 avg time when no resolutions", () => {
      const snapshot = collector.getSnapshot();
      expect(snapshot.avgResolutionTimeMs).toBe(0);
    });
  });

  describe("logSummary", () => {
    it("should call console.table with formatted metrics", () => {
      const token = createInjectionToken<Logger>("TestService");
      const consoleTableSpy = vi.spyOn(console, "table").mockImplementation(() => {});

      collector.recordResolution(token, 2.5, true);
      collector.recordResolution(token, 3.5, false);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(false);

      collector.logSummary();

      expect(consoleTableSpy).toHaveBeenCalledOnce();
      /* eslint-disable @typescript-eslint/naming-convention */
      expect(consoleTableSpy).toHaveBeenCalledWith({
        "Total Resolutions": 2,
        Errors: 1,
        "Avg Time (ms)": "3.00",
        "Cache Hit Rate": "50.0%",
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      consoleTableSpy.mockRestore();
    });

    it("should handle empty metrics gracefully", () => {
      const consoleTableSpy = vi.spyOn(console, "table").mockImplementation(() => {});

      collector.logSummary();

      /* eslint-disable @typescript-eslint/naming-convention */
      expect(consoleTableSpy).toHaveBeenCalledWith({
        "Total Resolutions": 0,
        Errors: 0,
        "Avg Time (ms)": "0.00",
        "Cache Hit Rate": "0.0%",
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      consoleTableSpy.mockRestore();
    });
  });

  describe("reset", () => {
    it("should reset all metrics to initial state", () => {
      const token = createInjectionToken<Logger>("TestService");

      // Populate metrics
      collector.recordResolution(token, 5.0, true);
      collector.recordResolution(token, 10.0, false);
      collector.recordPortSelection(13);
      collector.recordPortSelectionFailure(11);
      collector.recordCacheAccess(true);

      // Verify metrics are populated
      let snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(2);
      expect(snapshot.resolutionErrors).toBe(1);

      // Reset
      collector.reset();

      // Verify all metrics are cleared
      snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(0);
      expect(snapshot.resolutionErrors).toBe(0);
      expect(snapshot.avgResolutionTimeMs).toBe(0);
      expect(snapshot.cacheHitRate).toBe(0);
      expect(Object.keys(snapshot.portSelections)).toHaveLength(0);
      expect(Object.keys(snapshot.portSelectionFailures)).toHaveLength(0);
    });

    it("should reset resolution times circular buffer", () => {
      const token = createInjectionToken<Logger>("TestService");

      // Fill buffer
      for (let i = 1; i <= 10; i++) {
        collector.recordResolution(token, i * 10, true);
      }

      let snapshot = collector.getSnapshot();
      expect(snapshot.avgResolutionTimeMs).toBeGreaterThan(0);

      // Reset
      collector.reset();

      // Add new data - should not be affected by old buffer data
      collector.recordResolution(token, 2.0, true);

      snapshot = collector.getSnapshot();
      expect(snapshot.avgResolutionTimeMs).toBe(2.0);
      expect(snapshot.containerResolutions).toBe(1);
    });

    it("should allow fresh recording after reset", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 100.0, true);
      collector.reset();
      collector.recordResolution(token, 5.0, true);

      const snapshot = collector.getSnapshot();
      expect(snapshot.containerResolutions).toBe(1);
      expect(snapshot.avgResolutionTimeMs).toBe(5.0);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle mixed operations correctly", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 2.0, true);
      collector.recordResolution(token, 4.0, false);
      collector.recordPortSelection(13);
      collector.recordPortSelection(13);
      collector.recordPortSelectionFailure(12);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(false);

      const snapshot = collector.getSnapshot();

      expect(snapshot.containerResolutions).toBe(2);
      expect(snapshot.resolutionErrors).toBe(1);
      expect(snapshot.avgResolutionTimeMs).toBe(3.0);
      expect(snapshot.portSelections[13]).toBe(2);
      expect(snapshot.portSelectionFailures[12]).toBe(1);
      expect(snapshot.cacheHitRate).toBeCloseTo(66.66, 1);
    });
  });

  describe("shouldSample", () => {
    it("should always return true in development mode", () => {
      const devEnv = createMockEnvironmentConfig({ isDevelopment: true });
      const collector = new MetricsCollector(devEnv);

      // In development mode (env.isDevelopment is true), shouldSample always returns true
      const result = collector.shouldSample();

      expect(result).toBe(true);
    });

    it("should sample when Math.random() < samplingRate (production)", () => {
      const prodEnv = createMockEnvironmentConfig({
        isDevelopment: false,
        performanceSamplingRate: 0.7,
      });
      const collector = new MetricsCollector(prodEnv);

      // Mock Math.random to return 0.5 (< 0.7 = should sample)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = collector.shouldSample();

      expect(result).toBe(true);
    });

    it("should not sample when Math.random() >= samplingRate (production)", () => {
      const prodEnv = createMockEnvironmentConfig({
        isDevelopment: false,
        performanceSamplingRate: 0.3,
      });
      const collector = new MetricsCollector(prodEnv);

      // Mock Math.random to return 0.5 (>= 0.3 = should NOT sample)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = collector.shouldSample();

      expect(result).toBe(false);
    });

    it("should handle edge case: samplingRate = 0", () => {
      const prodEnv = createMockEnvironmentConfig({
        isDevelopment: false,
        performanceSamplingRate: 0,
      });
      const collector = new MetricsCollector(prodEnv);

      vi.spyOn(Math, "random").mockReturnValue(0);

      const result = collector.shouldSample();

      expect(result).toBe(false); // 0 < 0 = false
    });

    it("should handle edge case: samplingRate = 1", () => {
      const prodEnv = createMockEnvironmentConfig({
        isDevelopment: false,
        performanceSamplingRate: 1,
      });
      const collector = new MetricsCollector(prodEnv);

      vi.spyOn(Math, "random").mockReturnValue(0.999);

      const result = collector.shouldSample();

      expect(result).toBe(true); // 0.999 < 1 = true
    });
  });
});

describe("PersistentMetricsCollector", () => {
  class MockMetricsStorage implements MetricsStorage {
    public state: MetricsPersistenceState | null = null;

    load(): MetricsPersistenceState | null {
      return this.state ? JSON.parse(JSON.stringify(this.state)) : null;
    }

    save(state: MetricsPersistenceState): void {
      this.state = JSON.parse(JSON.stringify(state));
    }

    clear(): void {
      this.state = null;
    }
  }

  it("should restore state from storage on initialization", () => {
    const storage = new MockMetricsStorage();
    storage.state = {
      metrics: {
        containerResolutions: 5,
        resolutionErrors: 2,
        cacheHits: 3,
        cacheMisses: 1,
        portSelections: Object.fromEntries([[13, 4]]) as Record<number, number>,
        portSelectionFailures: Object.fromEntries([[13, 1]]) as Record<number, number>,
      },
      resolutionTimes: [2, 4, 6],
      resolutionTimesIndex: 1,
      resolutionTimesCount: 3,
    };
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });

    const persistentCollector = new PersistentMetricsCollector(env, storage);
    const snapshot = persistentCollector.getSnapshot();

    expect(snapshot.containerResolutions).toBe(5);
    expect(snapshot.resolutionErrors).toBe(2);
    expect(snapshot.portSelections[13]).toBe(4);
  });

  it("should persist state on mutation", () => {
    const storage = new MockMetricsStorage();
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, storage);

    persistentCollector.recordPortSelection(13);

    expect(storage.state?.metrics.portSelections["13"]).toBe(1);
    persistentCollector.recordCacheAccess(true);
    expect(storage.state?.metrics.cacheHits).toBe(1);
  });

  it("should clear persisted state when clearPersistentState is called", () => {
    const storage = new MockMetricsStorage();
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, storage);

    persistentCollector.recordPortSelection(13);
    expect(storage.state).not.toBeNull();

    persistentCollector.clearPersistentState();

    expect(storage.state).toBeNull();
    const snapshot = persistentCollector.getSnapshot();
    expect(snapshot.containerResolutions).toBe(0);
  });

  it("should ignore storage load errors", () => {
    class ThrowingLoadStorage implements MetricsStorage {
      load(): MetricsPersistenceState | null {
        throw new Error("load failed");
      }
      save(): void {
        /* noop */
      }
      clear(): void {
        /* noop */
      }
    }

    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, new ThrowingLoadStorage());

    expect(persistentCollector.getSnapshot().containerResolutions).toBe(0);
  });

  it("should ignore storage save errors", () => {
    class ThrowingSaveStorage extends MockMetricsStorage {
      override save(): void {
        throw new Error("save failed");
      }
    }

    const storage = new ThrowingSaveStorage();
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, storage);

    expect(() => persistentCollector.recordCacheAccess(true)).not.toThrow();
  });

  it("should ignore null persistence state restores", () => {
    const storage = new MockMetricsStorage();
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, storage);

    (
      persistentCollector as unknown as {
        restoreFromPersistenceState(state: MetricsPersistenceState | null): void;
      }
    ).restoreFromPersistenceState(null);

    expect(persistentCollector.getSnapshot().containerResolutions).toBe(0);
  });

  it("should sanitize invalid persistence values", () => {
    const storage = new MockMetricsStorage();
    const env = createMockEnvironmentConfig({ enableMetricsPersistence: true });
    const persistentCollector = new PersistentMetricsCollector(env, storage);

    const invalidState: MetricsPersistenceState = {
      metrics: {
        containerResolutions: -10,
        resolutionErrors: -5,
        cacheHits: -2,
        cacheMisses: -3,
        portSelections: Object.fromEntries([
          [999, "bar" as unknown as number],
        ]) as unknown as Record<number, number>,
        portSelectionFailures: Object.fromEntries([
          [13, "NaN" as unknown as number],
        ]) as unknown as Record<number, number>,
      },
      resolutionTimes: [Number.NaN, 4],
      resolutionTimesIndex: Number.POSITIVE_INFINITY,
      resolutionTimesCount: Number.NaN,
    };

    (
      persistentCollector as unknown as {
        restoreFromPersistenceState(state: MetricsPersistenceState | null): void;
      }
    ).restoreFromPersistenceState(invalidState);

    let snapshot = persistentCollector.getSnapshot();
    expect(snapshot.containerResolutions).toBe(0);
    expect(snapshot.resolutionErrors).toBe(0);
    expect(snapshot.portSelections[999]).toBe(0);
    expect(snapshot.portSelectionFailures[13]).toBe(0);
    expect(snapshot.avgResolutionTimeMs).toBe(0);

    // Exercise branch where resolutionTimes is not an array
    (
      persistentCollector as unknown as {
        restoreFromPersistenceState(state: MetricsPersistenceState | null): void;
      }
    ).restoreFromPersistenceState({
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
    });

    snapshot = persistentCollector.getSnapshot();
    expect(snapshot.containerResolutions).toBe(1);
    expect(snapshot.avgResolutionTimeMs).toBe(0);

    (
      persistentCollector as unknown as {
        restoreFromPersistenceState(state: MetricsPersistenceState | null): void;
      }
    ).restoreFromPersistenceState({
      metrics: undefined as unknown as MetricsPersistenceState["metrics"],
      resolutionTimes: [] as number[],
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    });

    snapshot = persistentCollector.getSnapshot();
    expect(snapshot.containerResolutions).toBe(0);
    expect(snapshot.portSelections[0]).toBeUndefined();
  });
});
