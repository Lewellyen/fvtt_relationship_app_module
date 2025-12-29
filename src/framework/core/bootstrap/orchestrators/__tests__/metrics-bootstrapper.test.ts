import { describe, it, expect, vi, beforeEach } from "vitest";
import { MetricsBootstrapper } from "../metrics-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { ok, err } from "@/domain/utils/result";
import { PersistentMetricsCollector } from "@/infrastructure/observability/metrics-persistence/persistent-metrics-collector";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { MetricsAggregator } from "@/infrastructure/observability/metrics-aggregator";
import { MetricsPersistenceManager } from "@/infrastructure/observability/metrics-persistence/metrics-persistence-manager";
import { MetricsStateManager } from "@/infrastructure/observability/metrics-state/metrics-state-manager";

describe("MetricsBootstrapper", () => {
  let mockContainer: PlatformContainerPort;

  beforeEach(() => {
    mockContainer = {
      resolveWithError: vi.fn(),
      resolve: vi.fn(),
      getValidationState: vi.fn(),
      isRegistered: vi.fn(),
    } as unknown as PlatformContainerPort;
  });

  it("should return success when metrics collector is not available", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "Metrics collector not registered",
        tokenDescription: String(metricsCollectorToken),
      })
    );

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(metricsCollectorToken);
  });

  it("should return success when collector is not initializable", () => {
    const mockCollector = {} as MetricsCollector;
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(mockCollector));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
  });

  it("should initialize any Initializable collector, not just PersistentMetricsCollector", () => {
    // Create a mock collector that implements Initializable but is not PersistentMetricsCollector
    const mockInitializableCollector = {
      initialize: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as MetricsCollector & { initialize: () => ReturnType<typeof ok<undefined>> };
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(mockInitializableCollector));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockInitializableCollector.initialize).toHaveBeenCalledOnce();
  });

  it("should initialize PersistentMetricsCollector when available", () => {
    const collector = createPersistentCollector();
    const initSpy = vi.spyOn(collector, "initialize").mockReturnValue(ok(undefined));
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(collector));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(initSpy).toHaveBeenCalledOnce();
  });

  it("should return success even when initialize fails", () => {
    const collector = createPersistentCollector();
    const initSpy = vi.spyOn(collector, "initialize").mockReturnValue(err("Initialization failed"));
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(ok(collector));

    const result = MetricsBootstrapper.initializeMetrics(mockContainer);

    expect(result.ok).toBe(true);
    expect(initSpy).toHaveBeenCalledOnce();
  });
});

function createPersistentCollector(): PersistentMetricsCollector {
  const storage: MetricsStorage = {
    load: vi.fn().mockReturnValue(null),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const config: RuntimeConfigService = createMockRuntimeConfig();
  const aggregator = new MetricsAggregator();
  const persistenceManager = new MetricsPersistenceManager();
  const stateManager = new MetricsStateManager();
  return new PersistentMetricsCollector(
    config,
    storage,
    aggregator,
    persistenceManager,
    stateManager
  );
}
