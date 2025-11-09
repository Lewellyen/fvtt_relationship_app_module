import { describe, it, expect, vi } from "vitest";
import { BootstrapPerformanceTracker } from "../bootstrap-performance-tracker";
import { createMockEnvironmentConfig, createMockSampler } from "@/test/utils/test-helpers";

describe("BootstrapPerformanceTracker", () => {
  describe("track", () => {
    it("should execute operation without tracking when performance tracking is disabled", () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: false });
      const tracker = new BootstrapPerformanceTracker(env, null);

      const operation = vi.fn(() => 42);
      const onComplete = vi.fn();

      const result = tracker.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled(); // Not called when tracking disabled
    });

    it("should execute operation without tracking when sampler is null", () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const tracker = new BootstrapPerformanceTracker(env, null);

      const operation = vi.fn(() => 42);
      const onComplete = vi.fn();

      const result = tracker.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled(); // Not called when no sampler
    });

    it("should execute operation without tracking when sampling rejects", () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(false);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(() => 42);
      const onComplete = vi.fn();

      const result = tracker.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled(); // Not called when sampling rejects
    });

    it("should track operation and call onComplete when tracking is enabled", () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(true);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(() => 42);
      const onComplete = vi.fn();

      const result = tracker.track(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).toHaveBeenCalledOnce();
      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), 42);

      // Duration should be a number >= 0
      const duration = onComplete.mock.calls[0]?.[0];
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it("should work without onComplete callback", () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(true);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(() => 42);

      const result = tracker.track(operation); // No onComplete

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
    });
  });

  describe("trackAsync", () => {
    it("should execute async operation without tracking when performance tracking is disabled", async () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: false });
      const tracker = new BootstrapPerformanceTracker(env, null);

      const operation = vi.fn(async () => 42);
      const onComplete = vi.fn();

      const result = await tracker.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute async operation without tracking when sampler is null", async () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const tracker = new BootstrapPerformanceTracker(env, null);

      const operation = vi.fn(async () => 42);
      const onComplete = vi.fn();

      const result = await tracker.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should execute async operation without tracking when sampling rejects", async () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(false);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(async () => 42);
      const onComplete = vi.fn();

      const result = await tracker.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should track async operation and call onComplete when tracking is enabled", async () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(true);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(async () => 42);
      const onComplete = vi.fn();

      const result = await tracker.trackAsync(operation, onComplete);

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
      expect(onComplete).toHaveBeenCalledOnce();
      expect(onComplete).toHaveBeenCalledWith(expect.any(Number), 42);

      const duration = onComplete.mock.calls[0]?.[0];
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it("should work without onComplete callback", async () => {
      const env = createMockEnvironmentConfig({ enablePerformanceTracking: true });
      const sampler = createMockSampler(env);
      vi.spyOn(sampler, "shouldSample").mockReturnValue(true);

      const tracker = new BootstrapPerformanceTracker(env, sampler);

      const operation = vi.fn(async () => 42);

      const result = await tracker.trackAsync(operation); // No onComplete

      expect(result).toBe(42);
      expect(operation).toHaveBeenCalledOnce();
    });
  });
});
