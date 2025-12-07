import { vi } from "vitest";
import type { Result, Ok, Err } from "@/domain/types/result";
import { createMockGame, createMockHooks, createMockUI } from "../mocks/foundry";
import { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import type { MetricsCollector as MetricsCollectorType } from "@/infrastructure/observability/metrics-collector";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { PerformanceTracker } from "@/infrastructure/observability/performance-tracker.interface";
import { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import { LogLevel } from "@/domain/types/log-level";
import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { CompositionRoot } from "@/framework/core/composition-root";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { ServiceContainer as ServiceContainerImpl } from "@/infrastructure/di/container";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";

/**
 * Type-safe Result assertion helpers
 */

/**
 * Asserts that a Result is Ok and returns the value
 */
export function expectResultOk<T>(result: Result<T, unknown>): asserts result is Ok<T> {
  if (!result.ok) {
    throw new Error(`Expected Result to be OK, but got error: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Asserts that a Result is Err and returns the error
 */
export function expectResultErr<E>(result: Result<unknown, E>): asserts result is Err<E> {
  if (result.ok) {
    throw new Error(`Expected Result to be Err, but got value: ${JSON.stringify(result.value)}`);
  }
}

/**
 * Type definitions for Foundry globals
 */
export type MockFoundryGlobals = {
  game?: ReturnType<typeof createMockGame>;
  Hooks?: ReturnType<typeof createMockHooks> | undefined;
  ui?: ReturnType<typeof createMockUI> | undefined;
};

/**
 * Setup/Cleanup-Helper für globale Foundry-Mocks
 */
export function setupFoundryGlobals(mocks: MockFoundryGlobals): void {
  if (mocks.game) {
    (globalThis as { game?: unknown }).game = mocks.game;
  }
  if (mocks.Hooks) {
    (globalThis as { Hooks?: unknown }).Hooks = mocks.Hooks;
  }
  if (mocks.ui) {
    (globalThis as { ui?: unknown }).ui = mocks.ui;
  }
}

/**
 * Cleanup-Helper für globale Foundry-Mocks
 */
export function cleanupFoundryGlobals(): void {
  delete (globalThis as { game?: unknown }).game;
  delete (globalThis as { Hooks?: unknown }).Hooks;
  delete (globalThis as { ui?: unknown }).ui;
}

/**
 * Helper function that sets up Foundry globals and returns a cleanup function.
 * This is a convenience wrapper around setupFoundryGlobals and cleanupFoundryGlobals.
 *
 * @param mocks - Foundry global mocks to set up
 * @returns Cleanup function that restores the original state
 *
 * @example
 * ```typescript
 * const cleanup = withFoundryGlobals({
 *   game: createMockGame(),
 *   Hooks: createMockHooks(),
 * });
 * // Test code...
 * cleanup(); // Always cleanup!
 * ```
 */
export function withFoundryGlobals(mocks: MockFoundryGlobals): () => void {
  setupFoundryGlobals(mocks);
  return () => cleanupFoundryGlobals();
}

/**
 * Creates a mock service instance for testing.
 * Useful for creating dummy services that satisfy type requirements.
 */
export function createDummyService(): { dispose: () => void } {
  return {
    dispose: vi.fn(),
  };
}

/**
 * Creates a mock logger for testing.
 */
export function createMockLogger(): Logger {
  return {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    setMinLevel: vi.fn(),
  };
}

/**
 * Creates a mock metrics sampler for testing.
 */
export function createMockMetricsSampler(): MetricsSampler {
  return {
    shouldSample: vi.fn().mockReturnValue(true),
  };
}

/**
 * Alias for createMockMetricsSampler for convenience.
 * @param _config - Optional RuntimeConfigService (unused, kept for API compatibility)
 */
export function createMockSampler(_config?: RuntimeConfigService): MetricsSampler {
  return createMockMetricsSampler();
}

/**
 * Creates a mock MetricsCollector for testing.
 */
export function createMockMetricsCollector(): MetricsCollectorType {
  const runtimeConfig = createMockRuntimeConfig();
  return new MetricsCollector(runtimeConfig);
}

/**
 * Creates a mock performance tracker for testing.
 */
export function createMockPerformanceTracker(): PerformanceTracker {
  return {
    track: vi.fn((fn) => fn()),
    trackAsync: vi.fn((fn) => Promise.resolve(fn())),
  };
}

/**
 * Creates a mock performance tracking service for testing.
 */
export function createMockPerformanceTrackingService(): PerformanceTrackingService {
  const mockConfig = createMockRuntimeConfig();
  const mockSampler = createMockMetricsSampler();
  const service = new PerformanceTrackingService(mockConfig, mockSampler);
  return service;
}

/**
 * Bootstraps a test container with all services registered and validated.
 *
 * This is a convenience function for tests that need a fully configured container.
 * It uses CompositionRoot to bootstrap the container, ensuring all services are
 * registered in the correct order.
 *
 * @returns Result with validated ServiceContainer or error message
 *
 * @example
 * ```typescript
 * const containerResult = bootstrapTestContainer();
 * if (containerResult.ok) {
 *   const logger = containerResult.value.resolve(loggerToken);
 *   logger.info("Test started");
 * }
 * ```
 */
export function bootstrapTestContainer(): Result<ServiceContainer, string> {
  const root = new CompositionRoot();
  const bootstrapResult = root.bootstrap();

  if (!bootstrapResult.ok) {
    return { ok: false, error: `Bootstrap failed: ${bootstrapResult.error}` };
  }

  // bootstrapResult.value ist bereits der Container
  const container = bootstrapResult.value;

  // Prüfen ob Container validiert ist
  const validationState = container.getValidationState();
  if (validationState !== "validated") {
    return { ok: false, error: `Container not validated, state: ${validationState}` };
  }

  // Debug: Prüfen ob wichtige Services registriert sind
  // Hinweis: Diese Prüfung kann auch im Test gemacht werden, aber hier für frühes Debugging
  // WICHTIG: Diese Prüfung wird hier gemacht, um sicherzustellen, dass der Container korrekt bootstrappt wurde
  // Falls diese Prüfung fehlschlägt, wird ein Fehler zurückgegeben, der den Test früh scheitern lässt
  const loggerRegisteredResult = container.isRegistered(loggerToken);
  if (!loggerRegisteredResult.ok) {
    return {
      ok: false,
      error: `isRegistered(loggerToken) failed: ${JSON.stringify(loggerRegisteredResult)}`,
    };
  }
  if (!loggerRegisteredResult.value) {
    // Bootstrap scheint erfolgreich, aber Logger ist nicht registriert
    // Dies deutet darauf hin, dass configureDependencies fehlgeschlagen ist oder der Container nicht korrekt initialisiert wurde
    return {
      ok: false,
      error: `Logger not registered after bootstrap. Container state: ${container.getValidationState()}. This indicates configureDependencies may have failed silently.`,
    };
  }

  const journalVisibilityRegisteredResult = container.isRegistered(journalVisibilityServiceToken);
  if (!journalVisibilityRegisteredResult.ok) {
    return {
      ok: false,
      error: `isRegistered(journalVisibilityServiceToken) failed: ${JSON.stringify(journalVisibilityRegisteredResult)}`,
    };
  }
  if (!journalVisibilityRegisteredResult.value) {
    // Bootstrap scheint erfolgreich, aber JournalVisibilityService ist nicht registriert
    // Dies deutet darauf hin, dass registerFoundryServices fehlgeschlagen ist oder der Service nicht registriert wurde
    return {
      ok: false,
      error: `JournalVisibilityService not registered after bootstrap. Container state: ${container.getValidationState()}. This indicates registerFoundryServices may have failed silently.`,
    };
  }

  return { ok: true, value: container };
}

/**
 * Creates a mock EnvironmentConfig for testing.
 * @param overrides - Optional overrides for specific config values
 * @returns A mock EnvironmentConfig
 */
export function createMockEnvironmentConfig(
  overrides: Partial<EnvironmentConfig> = {}
): EnvironmentConfig {
  return {
    isDevelopment: false,
    isProduction: true,
    logLevel: LogLevel.INFO,
    enablePerformanceTracking: true,
    enableMetricsPersistence: false,
    metricsPersistenceKey: "test.metrics",
    performanceSamplingRate: 1.0,
    enableCacheService: true,
    cacheDefaultTtlMs: 5000,
    cacheMaxEntries: undefined,
    ...overrides,
  };
}

/**
 * Creates a RuntimeConfigService with mock environment config.
 * @param overrides - Optional overrides for environment config
 * @returns A RuntimeConfigService instance
 */
export function createMockRuntimeConfig(
  overrides: Partial<EnvironmentConfig> = {}
): RuntimeConfigService {
  return new RuntimeConfigService(createMockEnvironmentConfig(overrides));
}

/**
 * Creates a test container with mock environment config.
 * This is a convenience function for tests that need a container but don't need full bootstrap.
 *
 * @param env - Optional environment config (defaults to mock config)
 * @returns A new ServiceContainer instance (not validated)
 */
export function createTestContainer(env?: EnvironmentConfig): ServiceContainer {
  return ServiceContainerImpl.createRoot(env ?? createMockEnvironmentConfig());
}

// Re-export createMockDOM from foundry mocks for convenience
export { createMockDOM } from "@/test/mocks/foundry";
