/**
 * Tests for PerformanceTrackingService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PerformanceTrackingService,
  DIPerformanceTrackingService,
} from "../PerformanceTrackingService";
import type { MetricsSampler } from "@/observability/interfaces/metrics-sampler";
import type { EnvironmentConfig } from "@/config/environment";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";

describe("PerformanceTrackingService", () => {
  let mockEnv: EnvironmentConfig;
  let mockSampler: MetricsSampler;
  let service: PerformanceTrackingService;

  beforeEach(() => {
    // Mock EnvironmentConfig
    mockEnv = createMockEnvironmentConfig();

    // Mock MetricsSampler
    mockSampler = {
      shouldSample: vi.fn().mockReturnValue(true),
    };

    service = new PerformanceTrackingService(mockEnv, mockSampler);

    // Mock performance.now()
    vi.spyOn(performance, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("track", () => {
    it("should execute operation when performance tracking is disabled", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      // Disable performance tracking in ENV
      mockEnv.enablePerformanceTracking = false;

      const result = service.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute operation when MetricsSampler sampling returns false", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(false);

      const result = service.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should track performance when enabled and sampling passes", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      const result = service.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(0, 42);
    });

    it("should call onComplete with duration and result", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      vi.spyOn(performance, "now")
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1050); // end

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      service.track(operation, onComplete);

      expect(onComplete).toHaveBeenCalledWith(50, 42);
    });

    it("should work without onComplete callback", () => {
      const operation = vi.fn().mockReturnValue(42);

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      const result = service.track(operation);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from operation", () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error("Operation failed");
      });
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      expect(() => {
        service.track(operation, onComplete);
      }).toThrow("Operation failed");

      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("trackAsync", () => {
    it("should execute async operation when performance tracking is disabled", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockEnv.enablePerformanceTracking = false;

      const result = await service.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute async operation when MetricsSampler sampling returns false", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(false);

      const result = await service.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should track performance for async operations when enabled", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      const result = await service.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(0, 42);
    });

    it("should call onComplete with duration and result for async operations", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      vi.spyOn(performance, "now")
        .mockReturnValueOnce(1000) // start
        .mockReturnValueOnce(1075); // end

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      await service.trackAsync(operation, onComplete);

      expect(onComplete).toHaveBeenCalledWith(75, 42);
    });

    it("should work without onComplete callback for async operations", async () => {
      const operation = vi.fn().mockResolvedValue(42);

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      const result = await service.trackAsync(operation);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should propagate errors from async operation", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Async operation failed"));
      const onComplete = vi.fn();

      mockSampler.shouldSample = vi.fn().mockReturnValue(true);

      await expect(service.trackAsync(operation, onComplete)).rejects.toThrow(
        "Async operation failed"
      );

      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("static dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(DIPerformanceTrackingService.dependencies).toEqual([
        expect.any(Symbol), // environmentConfigToken
        expect.any(Symbol), // metricsSamplerToken
      ]);
      expect(DIPerformanceTrackingService.dependencies).toHaveLength(2);
    });
  });

  describe("DI wrapper", () => {
    it("should construct service via DI wrapper", () => {
      const diService = new DIPerformanceTrackingService(mockEnv, mockSampler);
      expect(diService).toBeInstanceOf(PerformanceTrackingService);
    });
  });
});
