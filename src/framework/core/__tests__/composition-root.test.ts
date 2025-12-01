// Test file: `any` needed for mocking game.modules and ENV

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "@/framework/core/composition-root";
import { expectResultOk, createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import { loggerToken } from "@/infrastructure/shared/tokens";
import { ConsoleLoggerService } from "@/infrastructure/logging/ConsoleLoggerService";
import type { ServiceContainer } from "@/infrastructure/di/container";

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
      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnvironmentConfig({
          logLevel: 0,
          enablePerformanceTracking: true,
          performanceSamplingRate: 1.0,
        })
      );

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
      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnvironmentConfig({
          isDevelopment: false,
          isProduction: true,
          logLevel: 1,
          enablePerformanceTracking: false,
          performanceSamplingRate: 0.01,
        })
      );

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
      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnvironmentConfig({
          logLevel: 0,
          enablePerformanceTracking: true,
          performanceSamplingRate: 1.0,
        })
      );

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

    it("should call onComplete callback when performance tracking is enabled and sampling passes", async () => {
      // This test verifies that the onComplete callback in performanceTracker.track() is called
      // The callback (lines 50-56 in composition-root.ts) resolves the logger and calls debug()
      // We need to verify that logger.debug() is actually called to cover lines 52-56

      // Mock Math.random to ensure sampling passes (required for onComplete to be called)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      // Mock BootstrapPerformanceTracker to use a non-null sampler so onComplete is called
      // Reset modules to ensure fresh imports after mocking
      vi.resetModules();

      // Re-import and mock ENV after resetModules
      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnvironmentConfig({
          logLevel: 0,
          enablePerformanceTracking: true,
          performanceSamplingRate: 1.0,
        })
      );

      const mockSampler = { shouldSample: vi.fn(() => true) };
      const bootstrapTrackerModule =
        await import("@/infrastructure/observability/bootstrap-performance-tracker");
      const _runtimeConfigModule = await import("@/application/services/RuntimeConfigService");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigService
      >;

      // Create a mock class that extends the original but uses the mock sampler
      class MockBootstrapPerformanceTracker extends originalConstructor {
        constructor(config: RuntimeConfigServiceType) {
          super(config, mockSampler);
        }
      }

      // Replace the export directly - ES modules have live bindings, so this should work
      Object.defineProperty(bootstrapTrackerModule, "BootstrapPerformanceTracker", {
        value: MockBootstrapPerformanceTracker,
        writable: true,
        configurable: true,
      });

      // Spy on logger.debug() AFTER resetModules (so we spy on the newly loaded module)
      const loggerModule = await import("@/infrastructure/logging/ConsoleLoggerService");
      const loggerClassSpy = vi.spyOn(loggerModule.ConsoleLoggerService.prototype, "debug");

      // Now import CompositionRoot dynamically after the mock is in place
      const { CompositionRoot: compositionRootClass } =
        await import("@/framework/core/composition-root");
      const root = new compositionRootClass();
      const result = root.bootstrap();
      expectResultOk(result);

      // Verify that logger.debug() was called in the onComplete callback
      expect(loggerClassSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Bootstrap completed in \d+\.\d+ms/)
      );

      randomSpy.mockRestore();
      loggerClassSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it("should handle case when logger is not available in onComplete callback", async () => {
      // This test covers the case where loggerResult.ok is false (line 53)
      // We need to mock resolveWithError to fail for loggerToken during the onComplete callback
      // This is tricky because configureDependencies is called inside bootstrap
      // Solution: Mock the track method to intercept the onComplete callback and call it with a mocked container

      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
      vi.resetModules();

      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnvironmentConfig({
          logLevel: 0,
          enablePerformanceTracking: true,
          performanceSamplingRate: 1.0,
        })
      );

      const mockSampler = { shouldSample: vi.fn(() => true) };
      const bootstrapTrackerModule =
        await import("@/infrastructure/observability/bootstrap-performance-tracker");
      const _runtimeConfigModule = await import("@/application/services/RuntimeConfigService");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigService
      >;

      const { loggerToken: testLoggerToken } = await import("@/infrastructure/shared/tokens");

      // We need to capture the container created in bootstrap to mock resolveWithError
      // The container is created before track is called, so we intercept ServiceContainer.createRoot
      const { ServiceContainer: serviceContainer } = await import("@/infrastructure/di/container");
      let capturedContainer: ServiceContainer | null = null;

      const realCreateRoot = serviceContainer.createRoot;
      vi.spyOn(serviceContainer, "createRoot").mockImplementation(() => {
        const container = realCreateRoot();
        capturedContainer = container;
        return container;
      });

      class MockBootstrapPerformanceTracker extends originalConstructor {
        constructor(config: RuntimeConfigServiceType) {
          super(config, mockSampler);
        }

        override track<T>(
          operation: () => T,
          onComplete?: (duration: number, result: T) => void
        ): T {
          const result = operation();
          if (
            onComplete &&
            this.config.get("enablePerformanceTracking") &&
            this.sampler?.shouldSample()
          ) {
            const duration = 0; // Duration doesn't matter for this test

            // Before calling onComplete, mock resolveWithError to fail for loggerToken
            if (capturedContainer) {
              let originalResolveWithError: typeof capturedContainer.resolveWithError | null = null;
              originalResolveWithError = capturedContainer.resolveWithError.bind(capturedContainer);
              capturedContainer.resolveWithError = vi.fn((token: symbol) => {
                if (token === testLoggerToken) {
                  return { ok: false as const, error: "Logger not available" };
                }
                return originalResolveWithError!(token);
              }) as typeof capturedContainer.resolveWithError;

              // Call onComplete
              onComplete(duration, result);

              // Restore original resolveWithError
              if (originalResolveWithError) {
                capturedContainer.resolveWithError = originalResolveWithError;
              }
            } else {
              // Call onComplete even if container is not captured
              onComplete(duration, result);
            }
          }
          return result;
        }
      }

      Object.defineProperty(bootstrapTrackerModule, "BootstrapPerformanceTracker", {
        value: MockBootstrapPerformanceTracker,
        writable: true,
        configurable: true,
      });

      const { CompositionRoot: compositionRootClass } =
        await import("@/framework/core/composition-root");
      const root = new compositionRootClass();
      const result = root.bootstrap();

      // Bootstrap should still succeed even if logger is not available in onComplete
      expectResultOk(result);

      randomSpy.mockRestore();
      vi.restoreAllMocks();
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
