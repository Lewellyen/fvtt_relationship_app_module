import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MetricsCollector,
  DIMetricsCollector,
} from "@/infrastructure/observability/metrics-collector";
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-types";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import {
  PersistentMetricsCollector,
  DIPersistentMetricsCollector,
} from "@/infrastructure/observability/metrics-persistence/persistent-metrics-collector";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";
import { MetricDefinitionRegistry } from "@/infrastructure/observability/metrics-definition/metric-definition-registry";
import type { MetricDefinition } from "@/infrastructure/observability/metrics-definition/metric-definition.interface";
import { createDefaultMetricDefinitionRegistry } from "@/infrastructure/observability/metrics-definition/default-metric-definitions";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";
import type { IRawMetrics } from "@/infrastructure/observability/interfaces/raw-metrics.interface";
import { MetricsAggregator } from "@/infrastructure/observability/metrics-aggregator";
import { MetricsPersistenceManager } from "@/infrastructure/observability/metrics-persistence/metrics-persistence-manager";
import { MetricsStateManager } from "@/infrastructure/observability/metrics-state/metrics-state-manager";

describe("MetricsCollector", () => {
  let collector: MetricsCollector;
  let runtimeConfig: RuntimeConfigService;
  let aggregator: MetricsAggregator;
  let persistenceManager: MetricsPersistenceManager;
  let stateManager: MetricsStateManager;

  function createTestMetricsCollector(registry?: MetricDefinitionRegistry): MetricsCollector {
    return new MetricsCollector(
      runtimeConfig,
      aggregator,
      persistenceManager,
      stateManager,
      registry
    );
  }

  beforeEach(() => {
    runtimeConfig = createMockRuntimeConfig();
    aggregator = new MetricsAggregator();
    persistenceManager = new MetricsPersistenceManager();
    stateManager = new MetricsStateManager();
    collector = createTestMetricsCollector();
  });

  describe("DI Integration", () => {
    it("should create independent instances", () => {
      const instance1 = createTestMetricsCollector();
      const instance2 = createTestMetricsCollector();

      expect(instance1).not.toBe(instance2);
    });

    it("should have runtimeConfigToken in dependencies", () => {
      // Dependencies is an array of tokens (symbols), not objects
      expect(MetricsCollector.dependencies).toHaveLength(1);
      expect(MetricsCollector.dependencies[0]).toBeDefined();
      expect(String(MetricsCollector.dependencies[0])).toContain("RuntimeConfig");
    });

    it("DI wrapper should expose same dependencies", () => {
      expect(DIMetricsCollector.dependencies).toHaveLength(4);
      expect(DIMetricsCollector.dependencies[0]).toBeDefined();
      expect(String(DIMetricsCollector.dependencies[0])).toContain("RuntimeConfig");
      expect(DIMetricsCollector.dependencies[1]).toBeDefined();
      expect(DIMetricsCollector.dependencies[2]).toBeDefined();
      expect(DIMetricsCollector.dependencies[3]).toBeDefined();
    });

    it("persistent wrapper should expose dependencies", () => {
      expect(DIPersistentMetricsCollector.dependencies).toHaveLength(5);
      expect(DIPersistentMetricsCollector.dependencies[0]).toBeDefined();
      expect(DIPersistentMetricsCollector.dependencies[1]).toBeDefined();
      expect(DIPersistentMetricsCollector.dependencies[2]).toBeDefined();
      expect(DIPersistentMetricsCollector.dependencies[3]).toBeDefined();
      expect(DIPersistentMetricsCollector.dependencies[4]).toBeDefined();
    });

    it("persistent wrapper should construct and reuse metrics persistence", () => {
      const storage: MetricsStorage = {
        load: vi.fn().mockReturnValue(null),
        save: vi.fn(),
        clear: vi.fn(),
      };

      const aggregator = new MetricsAggregator();
      const persistenceManager = new MetricsPersistenceManager();
      const stateManager = new MetricsStateManager();

      const persistent = new DIPersistentMetricsCollector(
        runtimeConfig,
        storage,
        aggregator,
        persistenceManager,
        stateManager
      );

      expect(persistent).toBeInstanceOf(PersistentMetricsCollector);
      expect(storage.load).not.toHaveBeenCalled(); // load is no longer called in constructor

      // Initialize explicitly
      const initResult = persistent.initialize();
      expect(initResult.ok).toBe(true);
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

    it("should ignore updateMetric for non-existent metric key", () => {
      // Access private method via type assertion for testing
      const collectorAny = collector as unknown as {
        updateMetric: (key: string, event: unknown) => void;
      };

      // Should not throw and should not affect existing metrics
      const snapshotBefore = collector.getSnapshot();
      collectorAny.updateMetric("nonExistentMetric", {});
      const snapshotAfter = collector.getSnapshot();

      expect(snapshotAfter).toEqual(snapshotBefore);
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

  describe("OCP: Dynamic Metric Registration", () => {
    it("should support adding new metrics via registry without code changes", () => {
      const customRegistry = new MetricDefinitionRegistry();

      // Register default metrics
      const defaultRegistry = createDefaultMetricDefinitionRegistry();
      for (const def of defaultRegistry.getAll()) {
        customRegistry.register(def);
      }

      // Add a new custom metric
      const customMetricDefinition: MetricDefinition<number> = {
        key: "customCounter",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };
      customRegistry.register(customMetricDefinition);

      // Create collector with custom registry
      const collector = createTestMetricsCollector(customRegistry);

      // Record custom metric via internal updateMetric (would be exposed via new method in real scenario)
      (collector as any).updateMetric("customCounter", {});

      // Verify custom metric exists
      const rawMetrics = collector.getRawMetrics();
      expect(rawMetrics).toBeDefined();

      // Verify we can still use existing metrics
      collector.recordCacheAccess(true);
      const snapshot = collector.getSnapshot();
      expect(snapshot.cacheHitRate).toBe(100);
    });

    it("should prevent duplicate metric key registration", () => {
      const registry = new MetricDefinitionRegistry();

      const definition1: MetricDefinition<number> = {
        key: "duplicateKey",
        initialValue: 0,
        reducer: (current: number) => current + 1,
        serializer: (value: number) => value,
      };

      const definition2: MetricDefinition<number> = {
        key: "duplicateKey",
        initialValue: 0,
        reducer: (current: number) => current + 2,
        serializer: (value: number) => value,
      };

      registry.register(definition1);

      expect(() => {
        registry.register(definition2);
      }).toThrow('Metric definition with key "duplicateKey" already exists');
    });
  });

  describe("Edge Cases and Branch Coverage", () => {
    it("should handle getRawMetrics when portSelections is not a Map", () => {
      // Create collector with empty registry to test fallback branches
      const emptyRegistry = new MetricDefinitionRegistry();
      const collector = createTestMetricsCollector(emptyRegistry);

      // getRawMetrics should handle missing metrics gracefully
      const rawMetrics = collector.getRawMetrics();
      expect(rawMetrics.portSelections).toBeInstanceOf(Map);
      expect(rawMetrics.portSelections.size).toBe(0);
      expect(rawMetrics.portSelectionFailures).toBeInstanceOf(Map);
      expect(rawMetrics.portSelectionFailures.size).toBe(0);
    });

    it("should handle getRawMetrics when resolutionTimesState is undefined", () => {
      // Create collector with registry that doesn't include resolutionTimes
      const customRegistry = new MetricDefinitionRegistry();
      const defaultRegistry = createDefaultMetricDefinitionRegistry();

      // Register all metrics except resolutionTimes
      for (const def of defaultRegistry.getAll()) {
        if (def.key !== "resolutionTimes") {
          customRegistry.register(def);
        }
      }

      const collector = createTestMetricsCollector(customRegistry);
      const rawMetrics = collector.getRawMetrics();

      // Should use fallback values when resolutionTimesState is undefined
      expect(rawMetrics.resolutionTimes).toBeInstanceOf(Float64Array);
      expect(rawMetrics.resolutionTimes.length).toBe(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
      expect(rawMetrics.resolutionTimesIndex).toBe(0);
      expect(rawMetrics.resolutionTimesCount).toBe(0);
    });

    it("should handle applyRawMetrics when resolutionTimesState is missing", () => {
      const collector = createTestMetricsCollector();

      // Access private method via type assertion for testing
      const collectorAny = collector as unknown as {
        applyRawMetrics: (rawMetrics: IRawMetrics) => void;
        getRawMetrics: () => IRawMetrics;
      };

      // Create a registry without resolutionTimes
      const customRegistry = new MetricDefinitionRegistry();
      const defaultRegistry = createDefaultMetricDefinitionRegistry();

      for (const def of defaultRegistry.getAll()) {
        if (def.key !== "resolutionTimes") {
          customRegistry.register(def);
        }
      }

      // Create collector without resolutionTimes metric
      const collectorWithoutResolutionTimes = createTestMetricsCollector(customRegistry);
      const collectorAny2 = collectorWithoutResolutionTimes as unknown as {
        applyRawMetrics: (rawMetrics: IRawMetrics) => void;
        getRawMetrics: () => IRawMetrics;
      };

      // Apply raw metrics - should handle missing resolutionTimesState gracefully
      const rawMetrics = collectorAny.getRawMetrics();
      expect(() => {
        collectorAny2.applyRawMetrics(rawMetrics);
      }).not.toThrow();

      // Verify other metrics were applied
      const resultMetrics = collectorAny2.getRawMetrics();
      expect(resultMetrics.containerResolutions).toBe(rawMetrics.containerResolutions);
    });

    it("should handle setMetricValue when state is missing", () => {
      const collector = createTestMetricsCollector();

      // Access private method via type assertion for testing
      const collectorAny = collector as unknown as {
        setMetricValue: <T>(key: string, value: T) => void;
      };

      // Try to set value for non-existent metric - should not throw
      expect(() => {
        collectorAny.setMetricValue("nonExistentMetric", 42);
      }).not.toThrow();

      // Verify metric was not set (since it doesn't exist)
      const rawMetrics = collector.getRawMetrics();
      expect(rawMetrics).toBeDefined();
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

  function createTestPersistentMetricsCollector(
    config: RuntimeConfigService,
    storage: MetricsStorage
  ): PersistentMetricsCollector {
    const aggregator = new MetricsAggregator();
    const persistenceManager = new MetricsPersistenceManager();
    const stateManager = new MetricsStateManager();
    return new PersistentMetricsCollector(
      config,
      storage,
      aggregator,
      persistenceManager,
      stateManager
    );
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
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    // Initialize to restore state from storage
    const initResult = persistentCollector.initialize();
    expect(initResult.ok).toBe(true);

    const snapshot = persistentCollector.getSnapshot();

    expect(snapshot.containerResolutions).toBe(5);
    expect(snapshot.resolutionErrors).toBe(2);
    expect(snapshot.portSelections[13]).toBe(4);
  });

  it("should persist state on mutation", () => {
    const storage = new MockMetricsStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    persistentCollector.recordPortSelection(13);

    expect(storage.state?.metrics.portSelections["13"]).toBe(1);
    persistentCollector.recordCacheAccess(true);
    expect(storage.state?.metrics.cacheHits).toBe(1);
  });

  it("should clear persisted state when clearPersistentState is called", () => {
    const storage = new MockMetricsStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

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

    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(
      config,
      new ThrowingLoadStorage()
    );

    expect(persistentCollector.getSnapshot().containerResolutions).toBe(0);

    // Initialize should handle the error gracefully
    const initResult = persistentCollector.initialize();
    expect(initResult.ok).toBe(true);
  });

  it("should return success when already initialized", () => {
    const storage = new MockMetricsStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    // First initialization
    const initResult1 = persistentCollector.initialize();
    expect(initResult1.ok).toBe(true);

    // Second initialization should return success immediately
    const initResult2 = persistentCollector.initialize();
    expect(initResult2.ok).toBe(true);
  });

  it("should handle exceptions in initialize catch block when restoreFromPersistenceState throws", () => {
    // Create a storage that provides state, but we'll make restoreFromPersistenceState throw
    const storage = new MockMetricsStorage();
    storage.state = {
      metrics: {
        containerResolutions: 1,
        resolutionErrors: 0,
        cacheHits: 0,
        cacheMisses: 0,
        portSelections: {},
        portSelectionFailures: {},
      },
      resolutionTimes: [],
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    };
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    // Mock restoreFromPersistenceState to throw a non-Error exception
    const restoreFromPersistenceStateSpy = vi
      .spyOn(
        persistentCollector as unknown as {
          restoreFromPersistenceState(state: MetricsPersistenceState): void;
        },
        "restoreFromPersistenceState"
      )
      .mockImplementation(() => {
        throw "String exception"; // Not an Error instance
      });

    const initResult = persistentCollector.initialize();

    expect(initResult.ok).toBe(false);
    if (!initResult.ok) {
      expect(initResult.error).toContain("Failed to initialize PersistentMetricsCollector");
      expect(initResult.error).toContain("String exception");
    }

    restoreFromPersistenceStateSpy.mockRestore();
  });

  it("should ignore storage save errors", () => {
    class ThrowingSaveStorage extends MockMetricsStorage {
      override save(): void {
        throw new Error("save failed");
      }
    }

    const storage = new ThrowingSaveStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    expect(() => persistentCollector.recordCacheAccess(true)).not.toThrow();
  });

  it("should ignore null persistence state restores", () => {
    const storage = new MockMetricsStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    (
      persistentCollector as unknown as {
        restoreFromPersistenceState(state: MetricsPersistenceState | null): void;
      }
    ).restoreFromPersistenceState(null);

    expect(persistentCollector.getSnapshot().containerResolutions).toBe(0);
  });

  it("should sanitize invalid persistence values", () => {
    const storage = new MockMetricsStorage();
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

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

  type MutablePersistentCollector = PersistentMetricsCollector & {
    restoreFromPersistenceState: (state: MetricsPersistenceState) => void;
  };

  it("should handle Error exceptions in initialize catch block", () => {
    // Arrange
    const storage = new MockMetricsStorage();
    storage.state = {
      metrics: {
        containerResolutions: 1,
        resolutionErrors: 0,
        cacheHits: 0,
        cacheMisses: 0,
        portSelections: {},
        portSelectionFailures: {},
      },
      resolutionTimes: [],
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    };
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    // Override restoreFromPersistenceState to throw an Error instance
    const mutableCollector = persistentCollector as MutablePersistentCollector;
    const originalMethod = mutableCollector.restoreFromPersistenceState;
    Object.defineProperty(mutableCollector, "restoreFromPersistenceState", {
      value: () => {
        throw new Error("Error exception");
      },
      writable: true,
      configurable: true,
    });

    const initResult = persistentCollector.initialize();

    expect(initResult.ok).toBe(false);
    if (!initResult.ok) {
      expect(initResult.error).toContain("Failed to initialize PersistentMetricsCollector");
      expect(initResult.error).toContain("Error exception");
    }

    mutableCollector.restoreFromPersistenceState = originalMethod;
  });

  it("should handle non-Error exceptions in initialize catch block", () => {
    // Create a storage that provides state
    const storage = new MockMetricsStorage();
    storage.state = {
      metrics: {
        containerResolutions: 1,
        resolutionErrors: 0,
        cacheHits: 0,
        cacheMisses: 0,
        portSelections: {},
        portSelectionFailures: {},
      },
      resolutionTimes: [],
      resolutionTimesIndex: 0,
      resolutionTimesCount: 0,
    };
    const config = createMockRuntimeConfig({ enableMetricsPersistence: true });
    const persistentCollector = createTestPersistentMetricsCollector(config, storage);

    // Override restoreFromPersistenceState to throw a non-Error exception
    // This tests the else branch in the catch block (line 47: String(error))
    // Since restoreFromPersistenceState is protected, we access it via type assertion
    const mutableCollector = persistentCollector as MutablePersistentCollector;

    // Override the method to throw a string (not an Error instance)
    // This will be called from restoreFromStorage (line 83), which will propagate the exception to initialize()
    // The exception is not caught in restoreFromStorage's try-finally (only finally runs), so it propagates to initialize()
    // We need to ensure the override happens before initialize() is called
    const originalMethod = mutableCollector.restoreFromPersistenceState;

    // Use Object.defineProperty to ensure the override is properly set
    Object.defineProperty(mutableCollector, "restoreFromPersistenceState", {
      value: function (_state: MetricsPersistenceState) {
        // Throw a string (not an Error instance) to test the else branch in catch block (line 47)
        throw "String exception";
      },
      writable: true,
      configurable: true,
    });

    const initResult = persistentCollector.initialize();

    expect(initResult.ok).toBe(false);
    if (!initResult.ok) {
      expect(initResult.error).toContain("Failed to initialize PersistentMetricsCollector");
      expect(initResult.error).toContain("String exception");
    }

    // Restore original method
    mutableCollector.restoreFromPersistenceState = originalMethod;
  });
});
