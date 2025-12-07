import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { MetricsSampler, DIMetricsSampler } from "@/infrastructure/observability/metrics-sampler";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

describe("MetricsSampler", () => {
  let runtimeConfig: RuntimeConfigService;

  beforeEach(() => {
    runtimeConfig = createMockRuntimeConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("DI Integration", () => {
    it("should create independent instances", () => {
      const instance1 = new MetricsSampler(runtimeConfig);
      const instance2 = new MetricsSampler(runtimeConfig);

      expect(instance1).not.toBe(instance2);
    });

    it("should have runtimeConfigToken in dependencies", () => {
      expect(MetricsSampler.prototype.constructor.name).toBe("MetricsSampler");
      // Dependencies are defined on DIMetricsSampler
      expect(DIMetricsSampler.dependencies).toHaveLength(1);
      expect(DIMetricsSampler.dependencies[0]).toBeDefined();
      expect(String(DIMetricsSampler.dependencies[0])).toContain("RuntimeConfig");
    });

    it("DI wrapper should construct correctly", () => {
      const diSampler = new DIMetricsSampler(runtimeConfig);
      expect(diSampler).toBeInstanceOf(MetricsSampler);
      expect(diSampler.shouldSample()).toBeDefined();
    });
  });

  describe("shouldSample", () => {
    it("should always return true in development mode", () => {
      const devConfig = createMockRuntimeConfig({ isDevelopment: true });
      const sampler = new MetricsSampler(devConfig);

      const result = sampler.shouldSample();

      expect(result).toBe(true);
    });

    it("should sample when Math.random() < samplingRate (production)", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        performanceSamplingRate: 0.7,
      });
      const sampler = new MetricsSampler(prodConfig);

      // Mock Math.random to return 0.5 (< 0.7 = should sample)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = sampler.shouldSample();

      expect(result).toBe(true);
    });

    it("should not sample when Math.random() >= samplingRate (production)", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        performanceSamplingRate: 0.3,
      });
      const sampler = new MetricsSampler(prodConfig);

      // Mock Math.random to return 0.5 (>= 0.3 = should NOT sample)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = sampler.shouldSample();

      expect(result).toBe(false);
    });

    it("should handle edge case: samplingRate = 0", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        performanceSamplingRate: 0,
      });
      const sampler = new MetricsSampler(prodConfig);

      vi.spyOn(Math, "random").mockReturnValue(0);

      const result = sampler.shouldSample();

      expect(result).toBe(false); // 0 < 0 = false
    });

    it("should handle edge case: samplingRate = 1", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        performanceSamplingRate: 1,
      });
      const sampler = new MetricsSampler(prodConfig);

      vi.spyOn(Math, "random").mockReturnValue(0.999);

      const result = sampler.shouldSample();

      expect(result).toBe(true); // 0.999 < 1 = true
    });

    it("should handle edge case: Math.random() returns exactly samplingRate", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        performanceSamplingRate: 0.5,
      });
      const sampler = new MetricsSampler(prodConfig);

      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = sampler.shouldSample();

      expect(result).toBe(false); // 0.5 < 0.5 = false
    });
  });
});
