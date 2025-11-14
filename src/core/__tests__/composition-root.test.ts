// Test file: `any` needed for mocking game.modules and ENV

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "../composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { markAsApiSafe } from "@/di_infrastructure/types/api-safe-token";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";

describe("CompositionRoot", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        ["fvtt_relationship_app_module", { id: "fvtt_relationship_app_module", api: undefined }],
      ]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("bootstrap", () => {
    it("should bootstrap successfully", () => {
      const root = new CompositionRoot();
      const result = root.bootstrap();

      expectResultOk(result);
    });

    it("should bootstrap successfully with performance tracking enabled", async () => {
      // Mock ENV to enable performance tracking
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: true,
        enableDebugMode: false, // Debug logging is separate from performance tracking
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 1.0, // 100% sampling
      });

      // Mock Math.random to always return 0 (ensures sampling passes)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const root = new CompositionRoot();
      const result = root.bootstrap();

      // Verify bootstrap succeeded
      expectResultOk(result);

      randomSpy.mockRestore();
    });

    it("should skip performance tracking when debug mode disabled", async () => {
      // Mock ENV to disable debug mode
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: false,
        isProduction: true,
        logLevel: 1,
        enablePerformanceTracking: false,
        enableDebugMode: false,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 0.01,
      });

      const root = new CompositionRoot();

      // Clear previous marks
      performance.clearMarks();
      performance.clearMeasures();

      const marksCountBefore = performance.getEntriesByType("mark").length;
      root.bootstrap();
      const marksCountAfter = performance.getEntriesByType("mark").length;

      // No new marks should be created
      expect(marksCountAfter).toBe(marksCountBefore);
    });

    it("should handle performance tracking with debug mode and logger available", async () => {
      // Mock ENV to enable both performance tracking and debug mode
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: true,
        enableDebugMode: true,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 1.0,
      });

      // Mock Math.random to ensure sampling passes
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const root = new CompositionRoot();
      const result = root.bootstrap();

      expectResultOk(result);

      // After bootstrap, logger should be available in container
      const containerResult = root.getContainer();
      expectResultOk(containerResult);

      // Verify logger can be resolved (this covers lines 79-83)
      const loggerResult = containerResult.value.resolveWithError(markAsApiSafe(loggerToken));
      expectResultOk(loggerResult);

      randomSpy.mockRestore();
    });
  });

  describe("getContainer", () => {
    it("should return ok Result with container after bootstrap", () => {
      const root = new CompositionRoot();
      root.bootstrap();

      const result = root.getContainer();
      expectResultOk(result);
      expect(result.value).toBeDefined();
    });

    it("should return err Result before bootstrap", () => {
      const root = new CompositionRoot();

      const result = root.getContainer();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Container not initialized");
      }
    });
  });

  describe("Integration", () => {
    it("should provide fully configured container", () => {
      const root = new CompositionRoot();
      const bootstrapResult = root.bootstrap();
      expectResultOk(bootstrapResult);

      const containerResult = root.getContainer();
      expectResultOk(containerResult);

      const logger = containerResult.value.resolve(markAsApiSafe(loggerToken));
      expect(logger).toBeInstanceOf(ConsoleLoggerService);
    });
  });
});
