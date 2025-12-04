import { vi } from "vitest";
import type { Result, Ok, Err } from "@/domain/types/result";
import { createMockGame, createMockHooks, createMockUI } from "../mocks/foundry";
import { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { PerformanceTracker } from "@/infrastructure/observability/performance-tracker.interface";
import type { PerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import { LogLevel } from "@/domain/types/log-level";
import { APP_DEFAULTS } from "@/application/constants/app-constants";
import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { CompositionRoot } from "@/framework/core/composition-root";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";

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
 *
 * KRITISCH: Mocks werden pro Test gesetzt, nicht global!
 * Erlaubt Tests verschiedener Szenarien (Hooks available, undefined, etc.)
 *
 * @param overrides - Optionale Overrides für Default-Mocks
 * @returns Cleanup-Funktion die Mocks entfernt
 *
 * @example
 * ```typescript
 * it('test case', () => {
 *   const cleanup = withFoundryGlobals({ Hooks: undefined });
 *   // Test code...
 *   cleanup();
 * });
 * ```
 */
export function withFoundryGlobals(overrides: Partial<MockFoundryGlobals> = {}): () => void {
  const globals: MockFoundryGlobals = {
    game: createMockGame(),
    Hooks: createMockHooks(),
    ...overrides,
  };

  Object.entries(globals).forEach(([key, value]) => {
    if (value !== undefined) {
      vi.stubGlobal(key, value);
    }
  });

  return () => {
    vi.unstubAllGlobals();
  };
}

/**
 * Erstellt DOM-Struktur für UI-Tests
 * @param htmlString - HTML-String der eingefügt werden soll
 * @param selector - Optional: CSS-Selector um ein spezifisches Element zurückzugeben
 * @returns Container-Element und optional das gefundene Element
 */
export function createMockDOM(
  htmlString: string,
  selector?: string
): {
  container: HTMLElement;
  element?: HTMLElement | null;
} {
  const container = document.createElement("div");
  container.innerHTML = htmlString;

  if (selector) {
    const element = container.querySelector(selector) as HTMLElement | null;
    return { container, element };
  }

  return { container };
}

/**
 * Bootstrap-Helper für Integration-Tests
 *
 * Dupliziert den Bootstrap-Ablauf aus init-solid.ts für Tests.
 * Erstellt einen neuen CompositionRoot, bootstrappt ihn und gibt den Container zurück.
 *
 * @returns Result mit dem gebootstrapten Container oder Fehler
 *
 * @example
 * ```typescript
 * const containerResult = bootstrapTestContainer();
 * expectResultOk(containerResult);
 * const container = containerResult.value;
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
  overrides?: Partial<EnvironmentConfig>
): EnvironmentConfig {
  const { cacheMaxEntries, ...restOverrides } = overrides ?? {};
  return {
    isDevelopment: true,
    isProduction: false,
    logLevel: LogLevel.DEBUG,
    enablePerformanceTracking: true,
    enableMetricsPersistence: false,
    metricsPersistenceKey: "test.metrics",
    performanceSamplingRate: 1.0,
    enableCacheService: true,
    cacheDefaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
    ...restOverrides,
    ...(cacheMaxEntries !== undefined ? { cacheMaxEntries } : {}),
  };
}

export function createMockRuntimeConfig(
  overrides?: Partial<EnvironmentConfig>
): RuntimeConfigService {
  return new RuntimeConfigService(createMockEnvironmentConfig(overrides));
}

/**
 * Creates a mock MetricsCollector for testing.
 * @param config - Optional RuntimeConfigService (uses mock if not provided)
 * @returns A new MetricsCollector instance
 */
export function createMockMetricsCollector(config?: RuntimeConfigService): MetricsCollector {
  return new MetricsCollector(config ?? createMockRuntimeConfig());
}

/**
 * Creates a mock MetricsSampler for testing.
 * @param env - Optional EnvironmentConfig (uses mock if not provided)
 * @returns A MetricsCollector instance (implements MetricsSampler interface)
 */
export function createMockSampler(config?: RuntimeConfigService): MetricsSampler {
  // MetricsCollector implements MetricsSampler, so we can use it as a mock
  return new MetricsCollector(config ?? createMockRuntimeConfig());
}

/**
 * Creates a mock Logger for testing.
 * @returns A mock Logger with spy functions
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
 * Creates a mock PerformanceTracker for testing
 * @returns Mock implementation of PerformanceTracker interface
 */
export function createMockPerformanceTracker(): PerformanceTracker {
  return {
    track: vi
      .fn()
      .mockImplementation(
        <T>(operation: () => T, onComplete?: (duration: number, result: T) => void) => {
          const result = operation();
          // Call onComplete with mock duration (0ms) if provided
          if (onComplete) {
            onComplete(0, result);
          }
          return result;
        }
      ),
    trackAsync: vi
      .fn()
      .mockImplementation(
        async <T>(
          operation: () => Promise<T>,
          onComplete?: (duration: number, result: T) => void
        ) => {
          const result = await operation();
          // Call onComplete with mock duration (0ms) if provided
          if (onComplete) {
            onComplete(0, result);
          }
          return result;
        }
      ),
  };
}

/**
 * Creates a mock PerformanceTrackingService for testing
 * @returns Mock implementation of PerformanceTrackingService
 */
export function createMockPerformanceTrackingService(): PerformanceTrackingService {
  // Reuse PerformanceTracker mock as base (same interface)
  return createMockPerformanceTracker() as unknown as PerformanceTrackingService;
}

/**
 * Creates a minimal dummy service object for DI container test registrations.
 *
 * Use this when you need to register test services in the container
 * without complex mocking. Returns an empty object typed as any to bypass
 * unknown union constraints in test scenarios.
 *
 * @returns An empty object for test registrations
 *
 * @example
 * ```typescript
 * const token = createInjectionToken("test");
 * container.registerValue(token, createDummyService());
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDummyService(): any {
  return {};
}
