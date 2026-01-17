// Test file: `any` needed for mocking game.modules and ENV

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "@/framework/core/composition-root";
import { expectResultOk, createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";
import { ConsoleLoggerService } from "@/infrastructure/logging/ConsoleLoggerService";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { IDependencyConfigurator } from "@/framework/core/config/dependency-configurator";
import { BootstrapErrorHandler } from "@/framework/core/bootstrap-error-handler";

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
      const loggerResult = containerResult.value.resolveWithError(
        markAsApiSafe(platformLoggingPortToken)
      );
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
      const _runtimeConfigModule = await import("@/infrastructure/config/runtime-config-adapter");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigAdapter
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
      // We need to mock resolveWithError to fail for platformLoggingPortToken during the onComplete callback
      // This is tricky because configureDependencies is called inside bootstrap
      // Solution: Mock the track method to intercept the onComplete callback and call it with a mocked container

      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
      vi.resetModules();

      const { createMockEnvironmentConfig: createMockEnv } =
        await import("@/test/utils/test-helpers");
      const envModule = await import("@/framework/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue(
        createMockEnv({
          logLevel: 0,
          enablePerformanceTracking: true,
          performanceSamplingRate: 1.0,
        })
      );

      const mockSampler = { shouldSample: vi.fn(() => true) };
      const bootstrapTrackerModule =
        await import("@/infrastructure/observability/bootstrap-performance-tracker");
      const _runtimeConfigModule = await import("@/infrastructure/config/runtime-config-adapter");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigAdapter
      >;

      const { platformLoggingPortToken: testLoggerToken } =
        await import("@/application/tokens/domain-ports.tokens");

      // We need to capture the container created in bootstrap to mock resolveWithError
      // The container is created before track is called, so we intercept ServiceContainer.createRoot
      const { ServiceContainer: serviceContainer } = await import("@/infrastructure/di/container");
      let capturedContainer: ServiceContainer | null = null;

      const realCreateRoot = serviceContainer.createRoot;
      vi.spyOn(serviceContainer, "createRoot").mockImplementation(() => {
        const container = realCreateRoot(createMockEnv());
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

            // Before calling onComplete, mock resolveWithError to fail for platformLoggingPortToken
            if (capturedContainer) {
              let originalResolveWithError: typeof capturedContainer.resolveWithError | null = null;
              originalResolveWithError = capturedContainer.resolveWithError.bind(capturedContainer);
              capturedContainer.resolveWithError = vi.fn((token: symbol) => {
                if (token === testLoggerToken) {
                  return {
                    ok: false as const,
                    error: { code: "TokenNotRegistered", message: "Logger not available" },
                  };
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

    it("should handle configuration failure and return error result", () => {
      // Create a mock dependency configurator that returns an error
      const mockConfigurator: IDependencyConfigurator = {
        configure: vi.fn(() => ({
          ok: false as const,
          error: "Configuration failed: Test error",
        })),
      };

      // Create a mock error handler to verify it's called
      const mockErrorHandler = {
        logError: vi.fn(),
      };

      const root = new CompositionRoot(
        undefined,
        mockConfigurator,
        undefined,
        mockErrorHandler as unknown as typeof BootstrapErrorHandler
      );

      const result = root.bootstrap();

      // Verify bootstrap failed
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Configuration failed: Test error");
      }

      // Verify error handler was called
      expect(mockErrorHandler.logError).toHaveBeenCalledWith("Configuration failed: Test error", {
        phase: "bootstrap",
        component: "CompositionRoot",
        metadata: { error: "Configuration failed: Test error" },
      });

      // Verify container is not set
      const containerResult = root.getContainer();
      expect(containerResult.ok).toBe(false);
    });

    it("should use default values when constructor parameters are undefined", async () => {
      // Test that all ?? operators in constructor are covered
      // This test ensures that when all optional parameters are undefined,
      // the default values are used (covering the ?? branches)

      // Mock ENV to enable performance tracking so onComplete callback can be called
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

      // Create CompositionRoot with all optional parameters undefined
      // This should trigger all ?? operators in constructor
      const root = new CompositionRoot(undefined, undefined, undefined);

      const result = root.bootstrap();

      // Verify bootstrap succeeded
      expectResultOk(result);

      // Verify container is set
      const containerResult = root.getContainer();
      expectResultOk(containerResult);

      randomSpy.mockRestore();
    });

    it("should use explicit errorHandler when provided", () => {
      // This test covers the explicit errorHandler parameter path (branch coverage)
      // to ensure the default parameter branch is not always taken
      const mockErrorHandler = {
        logError: vi.fn(),
      };

      // Create a mock configurator that fails to trigger errorHandler
      const mockConfigurator: IDependencyConfigurator = {
        configure: vi.fn(() => ({
          ok: false as const,
          error: "Configuration failed: Test error",
        })),
      };

      const root = new CompositionRoot(
        undefined,
        mockConfigurator,
        undefined,
        mockErrorHandler as unknown as typeof BootstrapErrorHandler
      );

      // Bootstrap should fail, triggering errorHandler
      const result = root.bootstrap();
      expect(result.ok).toBe(false);

      // Verify the explicit errorHandler was used (not the default)
      // This covers the branch where errorHandler is explicitly provided
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(
        "Configuration failed: Test error",
        expect.objectContaining({
          phase: "bootstrap",
          component: "CompositionRoot",
        })
      );
    });

    it("should handle logger resolution failure in onComplete callback when configure succeeds", async () => {
      // This test explicitly covers the else branch of if (loggerResult.ok) on line 89
      // We need to ensure configure() succeeds, onComplete is called, but logger resolution fails

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

      const { platformLoggingPortToken: testLoggerToken } =
        await import("@/application/tokens/domain-ports.tokens");
      const { ServiceContainer: serviceContainerClass } =
        await import("@/infrastructure/di/container");
      const bootstrapTrackerModule =
        await import("@/infrastructure/observability/bootstrap-performance-tracker");
      const _runtimeConfigModule = await import("@/infrastructure/config/runtime-config-adapter");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigAdapter
      >;

      // Create a sampler that always returns true so onComplete is called
      const mockSampler = { shouldSample: vi.fn(() => true) };

      // Intercept container creation to capture it and mock resolveWithError
      const realCreateRoot = serviceContainerClass.createRoot;
      vi.spyOn(serviceContainerClass, "createRoot").mockImplementation((env) => {
        const container = realCreateRoot(env);

        // Mock resolveWithError to fail for platformLoggingPortToken
        const originalResolveWithError = container.resolveWithError.bind(container);
        container.resolveWithError = vi.fn((token: symbol) => {
          if (token === testLoggerToken) {
            return {
              ok: false as const,
              error: { code: "TokenNotRegistered", message: "Logger not available" },
            };
          }
          return originalResolveWithError(token);
        }) as typeof container.resolveWithError;

        return container;
      });

      // Create a mock tracker that uses the sampler so onComplete is called
      class MockBootstrapPerformanceTracker extends originalConstructor {
        constructor(config: RuntimeConfigServiceType) {
          super(config, mockSampler); // Use sampler instead of null
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

      // Bootstrap should succeed even if logger resolution fails in onComplete
      expectResultOk(result);

      // Verify that onComplete was called (sampler.shouldSample was called)
      expect(mockSampler.shouldSample).toHaveBeenCalled();

      randomSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it("should handle logger resolution failure in onComplete callback (simple test)", async () => {
      // Simple test: Mock resolveWithError to return { ok: false } for platformLoggingPortToken
      // This directly tests the else branch in line 92-94

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

      const { platformLoggingPortToken: testLoggerToken } =
        await import("@/application/tokens/domain-ports.tokens");
      const { ServiceContainer: serviceContainerClass } =
        await import("@/infrastructure/di/container");
      const bootstrapTrackerModule =
        await import("@/infrastructure/observability/bootstrap-performance-tracker");
      const _runtimeConfigModule = await import("@/infrastructure/config/runtime-config-adapter");
      const originalConstructor = bootstrapTrackerModule.BootstrapPerformanceTracker;
      type RuntimeConfigServiceType = InstanceType<
        typeof _runtimeConfigModule.RuntimeConfigAdapter
      >;

      const mockSampler = { shouldSample: vi.fn(() => true) };

      // Mock container.createRoot to return a container with mocked resolveWithError
      const realCreateRoot = serviceContainerClass.createRoot;
      vi.spyOn(serviceContainerClass, "createRoot").mockImplementation((env) => {
        const container = realCreateRoot(env);

        // Mock resolveWithError to fail for platformLoggingPortToken
        const originalResolveWithError = container.resolveWithError.bind(container);
        container.resolveWithError = vi.fn((token: symbol) => {
          if (token === testLoggerToken) {
            return {
              ok: false as const,
              error: {
                code: "TokenNotRegistered" as const,
                message: "Logger not available",
                tokenDescription: String(token),
              },
            };
          }
          return originalResolveWithError(token);
        }) as typeof container.resolveWithError;

        return container;
      });

      class MockBootstrapPerformanceTracker extends originalConstructor {
        constructor(config: RuntimeConfigServiceType) {
          super(config, mockSampler);
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

      // Bootstrap should succeed even if logger resolution fails in onComplete
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

      const logger = containerResult.value.resolve(markAsApiSafe(platformLoggingPortToken));
      expect(logger).toBeInstanceOf(ConsoleLoggerService);
    });
  });
});
