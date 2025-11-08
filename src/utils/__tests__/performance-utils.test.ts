/**
 * Tests for performance tracking utilities with sampling support
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withPerformanceTracking, withPerformanceTrackingAsync } from "../performance-utils";
import type { MetricsCollector } from "@/observability/metrics-collector";
import type { EnvironmentConfig } from "@/config/environment";
import { LogLevel } from "@/config/environment";

describe("performance-utils", () => {
  let mockMetricsCollector: MetricsCollector;
  let mockEnv: EnvironmentConfig;

  beforeEach(() => {
    mockMetricsCollector = {
      shouldSample: vi.fn().mockReturnValue(true),
      recordResolution: vi.fn(),
      recordPortSelection: vi.fn(),
      recordPortSelectionFailure: vi.fn(),
      recordCacheAccess: vi.fn(),
      getSnapshot: vi.fn(),
      logSummary: vi.fn(),
      reset: vi.fn(),
    } as unknown as MetricsCollector;

    mockEnv = {
      isDevelopment: true,
      isProduction: false,
      logLevel: LogLevel.DEBUG,
      enablePerformanceTracking: true,
      enableDebugMode: true,
      performanceSamplingRate: 1.0,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("withPerformanceTracking", () => {
    it("should execute operation when performance tracking is disabled", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      // Disable performance tracking in ENV
      mockEnv.enablePerformanceTracking = false;

      const result = withPerformanceTracking(mockEnv, mockMetricsCollector, operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
      expect(mockMetricsCollector.shouldSample).not.toHaveBeenCalled();
    });

    it("should execute operation when metricsCollector is null", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      const result = withPerformanceTracking(mockEnv, null, operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute operation but not call onComplete when shouldSample returns false", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(false);

      const result = withPerformanceTracking(mockEnv, mockMetricsCollector, operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should measure performance and call onComplete when shouldSample returns true", () => {
      const operation = vi.fn().mockReturnValue(42);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      const result = withPerformanceTracking(mockEnv, mockMetricsCollector, operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), 42);

      // Verify duration is reasonable (>= 0)
      const duration = onComplete.mock.calls[0]?.[0] as number;
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it("should work without onComplete callback", () => {
      const operation = vi.fn().mockReturnValue(42);

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      const result = withPerformanceTracking(mockEnv, mockMetricsCollector, operation);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
    });

    it("should pass operation result to onComplete callback", () => {
      const operationResult = { ok: true, value: "test" };
      const operation = vi.fn().mockReturnValue(operationResult);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      withPerformanceTracking(mockEnv, mockMetricsCollector, operation, onComplete);

      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), operationResult);
    });

    it("should propagate exceptions from operation", () => {
      const operation = vi.fn().mockImplementation(() => {
        throw new Error("Operation failed");
      });
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      expect(() => {
        withPerformanceTracking(mockEnv, mockMetricsCollector, operation, onComplete);
      }).toThrow("Operation failed");

      expect(operation).toHaveBeenCalledTimes(1);
      // onComplete should not be called if operation throws
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("withPerformanceTrackingAsync", () => {
    it("should execute async operation when performance tracking is disabled", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockEnv.enablePerformanceTracking = false;

      const result = await withPerformanceTrackingAsync(
        mockEnv,
        mockMetricsCollector,
        operation,
        onComplete
      );

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
      expect(mockMetricsCollector.shouldSample).not.toHaveBeenCalled();
    });

    it("should execute async operation when metricsCollector is null", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      const result = await withPerformanceTrackingAsync(mockEnv, null, operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute async operation but not call onComplete when shouldSample returns false", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(false);

      const result = await withPerformanceTrackingAsync(
        mockEnv,
        mockMetricsCollector,
        operation,
        onComplete
      );

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should measure performance and call onComplete when shouldSample returns true", async () => {
      const operation = vi.fn().mockResolvedValue(42);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      const result = await withPerformanceTrackingAsync(
        mockEnv,
        mockMetricsCollector,
        operation,
        onComplete
      );

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), 42);

      // Verify duration is reasonable (>= 0)
      const duration = onComplete.mock.calls[0]?.[0] as number;
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it("should work without onComplete callback", async () => {
      const operation = vi.fn().mockResolvedValue(42);

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      const result = await withPerformanceTrackingAsync(mockEnv, mockMetricsCollector, operation);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockMetricsCollector.shouldSample).toHaveBeenCalledTimes(1);
    });

    it("should pass async operation result to onComplete callback", async () => {
      const operationResult = { ok: true, value: "test" };
      const operation = vi.fn().mockResolvedValue(operationResult);
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      await withPerformanceTrackingAsync(mockEnv, mockMetricsCollector, operation, onComplete);

      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), operationResult);
    });

    it("should propagate rejections from async operation", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Async operation failed"));
      const onComplete = vi.fn();

      mockMetricsCollector.shouldSample = vi.fn().mockReturnValue(true);

      await expect(
        withPerformanceTrackingAsync(mockEnv, mockMetricsCollector, operation, onComplete)
      ).rejects.toThrow("Async operation failed");

      expect(operation).toHaveBeenCalledTimes(1);
      // onComplete should not be called if operation rejects
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
