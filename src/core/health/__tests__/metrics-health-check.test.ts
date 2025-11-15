import { describe, it, expect, beforeEach } from "vitest";
import { MetricsHealthCheck } from "../metrics-health-check";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { MetricsCollector as RealMetricsCollector } from "@/observability/metrics-collector";
import { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";

describe("MetricsHealthCheck", () => {
  let metricsCollector: MetricsCollector;
  let check: MetricsHealthCheck;

  beforeEach(() => {
    const mockEnv = createMockEnvironmentConfig();
    metricsCollector = new RealMetricsCollector(new RuntimeConfigService(mockEnv));
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
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const token = { description: "test" } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
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
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const token = { description: "test" } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
      metricsCollector.recordResolution(token, 1.0, false);
      metricsCollector.recordResolution(token, 1.0, false);

      const details = check.getDetails();
      expect(details).toContain("Resolution errors: 2");
    });

    it("should prioritize port failures over resolution errors in details", () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const token = { description: "test" } as any;
      /* eslint-enable @typescript-eslint/no-explicit-any */
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
