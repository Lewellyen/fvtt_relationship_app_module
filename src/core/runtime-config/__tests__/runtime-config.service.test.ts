import { describe, it, expect, vi } from "vitest";
import { LogLevel } from "@/config/environment";
import { RuntimeConfigService } from "../runtime-config.service";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";

function createService(
  overrides: Partial<ReturnType<typeof createMockEnvironmentConfig>> = {}
): RuntimeConfigService {
  const { cacheMaxEntries, ...restOverrides } = overrides;
  return new RuntimeConfigService(
    createMockEnvironmentConfig({
      logLevel: LogLevel.INFO,
      enableCacheService: true,
      cacheDefaultTtlMs: 5000,
      enablePerformanceTracking: true,
      performanceSamplingRate: 0.5,
      enableMetricsPersistence: false,
      metricsPersistenceKey: "metrics",
      isDevelopment: true,
      isProduction: false,
      ...restOverrides,
      ...(cacheMaxEntries !== undefined ? { cacheMaxEntries } : {}),
    })
  );
}

describe("RuntimeConfigService", () => {
  it("initializes with environment defaults", () => {
    const service = createService({ logLevel: LogLevel.WARN });

    expect(service.get("logLevel")).toBe(LogLevel.WARN);
    expect(service.get("enableCacheService")).toBe(true);
    expect(service.get("cacheDefaultTtlMs")).toBe(5000);
    expect(service.get("cacheMaxEntries")).toBeUndefined();
    expect(service.get("enablePerformanceTracking")).toBe(true);
    expect(service.get("performanceSamplingRate")).toBe(0.5);
  });

  it("notifies listeners when foundry overrides a value", () => {
    const service = createService();
    const listener = vi.fn();
    service.onChange("logLevel", listener);

    service.setFromFoundry("logLevel", LogLevel.ERROR);

    expect(service.get("logLevel")).toBe(LogLevel.ERROR);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(LogLevel.ERROR);
  });

  it("does not notify listeners if value remains unchanged", () => {
    const service = createService();
    const listener = vi.fn();
    service.onChange("enableCacheService", listener);

    service.setFromFoundry("enableCacheService", true);

    expect(listener).not.toHaveBeenCalled();
  });

  it("exposes all environment-backed flags", () => {
    const service = createService({
      isDevelopment: false,
      isProduction: true,
      enableMetricsPersistence: true,
      metricsPersistenceKey: "custom.metrics",
    });

    expect(service.get("isDevelopment")).toBe(false);
    expect(service.get("isProduction")).toBe(true);
    expect(service.get("enableMetricsPersistence")).toBe(true);
    expect(service.get("metricsPersistenceKey")).toBe("custom.metrics");
  });

  it("allows overriding string/numeric values via setFromFoundry", () => {
    const service = createService();
    const samplingSpy = vi.fn();
    const metricsKeySpy = vi.fn();

    service.onChange("performanceSamplingRate", samplingSpy);
    service.onChange("metricsPersistenceKey", metricsKeySpy);

    service.setFromFoundry("performanceSamplingRate", 0.25);
    service.setFromFoundry("metricsPersistenceKey", "runtime.metrics");

    expect(service.get("performanceSamplingRate")).toBe(0.25);
    expect(service.get("metricsPersistenceKey")).toBe("runtime.metrics");
    expect(samplingSpy).toHaveBeenCalledWith(0.25);
    expect(metricsKeySpy).toHaveBeenCalledWith("runtime.metrics");
  });

  it("allows listeners to unsubscribe", () => {
    const service = createService();
    const listener = vi.fn();
    const unsubscribe = service.onChange("cacheDefaultTtlMs", listener);

    unsubscribe();
    service.setFromFoundry("cacheDefaultTtlMs", 10000);

    expect(listener).not.toHaveBeenCalled();
  });

  it("removes listener map entry when last listener is removed (coverage for empty set branch)", () => {
    const service = createService();
    const listener1 = vi.fn();
    const listener2 = vi.fn();

    // Add two listeners
    const unsubscribe1 = service.onChange("logLevel", listener1);
    const unsubscribe2 = service.onChange("logLevel", listener2);

    // Remove first listener - map entry should still exist
    unsubscribe1();
    service.setFromFoundry("logLevel", LogLevel.DEBUG);
    expect(listener1).not.toHaveBeenCalled();
    expect(listener2).toHaveBeenCalledTimes(1);

    // Remove second listener - map entry should be removed (activeListeners.size === 0)
    unsubscribe2();
    service.setFromFoundry("logLevel", LogLevel.WARN);
    expect(listener2).toHaveBeenCalledTimes(1); // Still only called once from before

    // Verify we can add a new listener after cleanup (map entry was removed)
    const listener3 = vi.fn();
    service.onChange("logLevel", listener3);
    service.setFromFoundry("logLevel", LogLevel.ERROR);
    expect(listener3).toHaveBeenCalledTimes(1);
    expect(listener3).toHaveBeenCalledWith(LogLevel.ERROR);
  });
});
