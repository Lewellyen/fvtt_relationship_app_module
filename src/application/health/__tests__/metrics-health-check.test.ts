import { describe, it, expect, beforeEach } from "vitest";
import { MetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { MetricsCollector as RealMetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { MetricsAggregator } from "@/infrastructure/observability/metrics-aggregator";
import { MetricsPersistenceManager } from "@/infrastructure/observability/metrics-persistence/metrics-persistence-manager";
import { MetricsStateManager } from "@/infrastructure/observability/metrics-state/metrics-state-manager";

describe("MetricsHealthCheck", () => {
  let metricsCollector: MetricsCollector;
  let check: MetricsHealthCheck;

  beforeEach(() => {
    const mockEnv = createMockEnvironmentConfig();
    const runtimeConfig = createRuntimeConfig(mockEnv);
    const aggregator = new MetricsAggregator();
    const persistenceManager = new MetricsPersistenceManager();
    const stateManager = new MetricsStateManager();
    metricsCollector = new RealMetricsCollector(
      runtimeConfig,
      aggregator,
      persistenceManager,
      stateManager
    );
    check = new MetricsHealthCheck(metricsCollector);
  });

  describe("name", () => {
    it('should have name "metrics"', () => {
      expect(check.name).toBe("metrics");
    });
  });

  describe("check", () => {
    it("should return true when no port failures and no resolution errors", () => {
      expect(check.check()).toBe(true);
    });

    it("should return false when port selection failures exist", () => {
      metricsCollector.recordPortSelectionFailure(12);

      expect(check.check()).toBe(false);
    });

    it("should return false when resolution errors exist", () => {
      const token = { description: "test" } as any;

      metricsCollector.recordResolution(token, 1.0, false);

      expect(check.check()).toBe(false);
    });
  });

  describe("getDetails", () => {
    it("should return null when healthy", () => {
      expect(check.getDetails()).toBeNull();
    });

    it("should return port failure details", () => {
      metricsCollector.recordPortSelectionFailure(12);
      metricsCollector.recordPortSelectionFailure(13);

      const details = check.getDetails();
      expect(details).toContain("Port selection failures:");
      expect(details).toContain("12");
      expect(details).toContain("13");
    });

    it("should return resolution error details", () => {
      const token = { description: "test" } as any;

      metricsCollector.recordResolution(token, 1.0, false);
      metricsCollector.recordResolution(token, 1.0, false);

      const details = check.getDetails();
      expect(details).toContain("Resolution errors: 2");
    });

    it("should prioritize port failures over resolution errors in details", () => {
      const token = { description: "test" } as any;

      metricsCollector.recordResolution(token, 1.0, false);
      metricsCollector.recordPortSelectionFailure(14);

      const details = check.getDetails();
      expect(details).toContain("Port selection failures:");
    });
  });

  describe("dispose", () => {
    it("should be callable without throwing", () => {
      expect(() => check.dispose()).not.toThrow();
    });
  });
});
