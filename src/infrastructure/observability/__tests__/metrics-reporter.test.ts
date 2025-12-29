import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  MetricsReporter,
  DIMetricsReporter,
} from "@/infrastructure/observability/metrics-reporter";
import { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { MetricsAggregator } from "@/infrastructure/observability/metrics-aggregator";
import { MetricsPersistenceManager } from "@/infrastructure/observability/metrics-persistence/metrics-persistence-manager";
import { MetricsStateManager } from "@/infrastructure/observability/metrics-state/metrics-state-manager";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";

describe("MetricsReporter", () => {
  let reporter: MetricsReporter;
  let collector: MetricsCollector;
  let logger: Logger | undefined;

  function createTestMetricsCollector(): MetricsCollector {
    const runtimeConfig = createMockRuntimeConfig();
    const aggregator = new MetricsAggregator();
    const persistenceManager = new MetricsPersistenceManager();
    const stateManager = new MetricsStateManager();
    return new MetricsCollector(runtimeConfig, aggregator, persistenceManager, stateManager);
  }

  beforeEach(() => {
    collector = createTestMetricsCollector();
    logger = undefined; // Optional logger
    reporter = new MetricsReporter(collector, logger);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("DI Integration", () => {
    it("should create independent instances", () => {
      const collector1 = createTestMetricsCollector();
      const collector2 = createTestMetricsCollector();
      const reporter1 = new MetricsReporter(collector1);
      const reporter2 = new MetricsReporter(collector2);

      expect(reporter1).not.toBe(reporter2);
    });

    it("should have correct dependencies", () => {
      expect(DIMetricsReporter.dependencies).toHaveLength(2);
      expect(DIMetricsReporter.dependencies[0]).toBe(metricsCollectorToken);
      expect(DIMetricsReporter.dependencies[1]).toBe(loggerToken);
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

      reporter.logSummary();

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

      reporter.logSummary();

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

    it("should format metrics correctly with various data", () => {
      const token = createInjectionToken<Logger>("TestService");
      const consoleTableSpy = vi.spyOn(console, "table").mockImplementation(() => {});

      collector.recordResolution(token, 1.5, true);
      collector.recordResolution(token, 2.5, true);
      collector.recordResolution(token, 3.5, true);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(true);
      collector.recordCacheAccess(false);

      reporter.logSummary();

      /* eslint-disable @typescript-eslint/naming-convention */
      expect(consoleTableSpy).toHaveBeenCalledWith({
        "Total Resolutions": 3,
        Errors: 0,
        "Avg Time (ms)": "2.50",
        "Cache Hit Rate": "75.0%",
      });
      /* eslint-enable @typescript-eslint/naming-convention */

      consoleTableSpy.mockRestore();
    });
  });

  describe("toJSON", () => {
    it("should return JSON string of metrics snapshot", () => {
      const token = createInjectionToken<Logger>("TestService");

      collector.recordResolution(token, 2.5, true);
      collector.recordPortSelection(13);
      collector.recordCacheAccess(true);

      const json = reporter.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty("containerResolutions", 1);
      expect(parsed).toHaveProperty("resolutionErrors", 0);
      expect(parsed).toHaveProperty("avgResolutionTimeMs", 2.5);
      expect(parsed).toHaveProperty("portSelections");
      expect(parsed).toHaveProperty("cacheHitRate", 100);
    });

    it("should return valid JSON for empty metrics", () => {
      const json = reporter.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveProperty("containerResolutions", 0);
      expect(parsed).toHaveProperty("resolutionErrors", 0);
      expect(parsed).toHaveProperty("avgResolutionTimeMs", 0);
      expect(parsed).toHaveProperty("cacheHitRate", 0);
    });

    it("should format JSON with indentation", () => {
      const token = createInjectionToken<Logger>("TestService");
      collector.recordResolution(token, 1.0, true);

      const json = reporter.toJSON();

      // Should contain newlines (from indentation)
      expect(json).toContain("\n");
      // Should be valid JSON
      expect(() => JSON.parse(json)).not.toThrow();
    });
  });

  describe("with Logger", () => {
    it("should accept optional logger parameter", () => {
      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
      };

      const reporterWithLogger = new MetricsReporter(collector, mockLogger);

      expect(reporterWithLogger).toBeInstanceOf(MetricsReporter);
    });
  });

  describe("DI Integration", () => {
    it("DI wrapper should construct correctly", () => {
      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        log: vi.fn(),
      };

      const diReporter = new DIMetricsReporter(collector, mockLogger);
      expect(diReporter).toBeInstanceOf(MetricsReporter);
      expect(diReporter.logSummary).toBeDefined();
      expect(diReporter.toJSON).toBeDefined();
    });
  });
});
