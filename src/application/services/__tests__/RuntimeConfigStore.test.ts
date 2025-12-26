import { describe, it, expect } from "vitest";
import { LogLevel } from "@/domain/types/log-level";
import { RuntimeConfigStore } from "../RuntimeConfigStore";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";

function createStore(
  overrides: Partial<ReturnType<typeof createMockEnvironmentConfig>> = {}
): RuntimeConfigStore {
  const { cacheMaxEntries, ...restOverrides } = overrides;
  return new RuntimeConfigStore(
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

describe("RuntimeConfigStore", () => {
  it("initializes with environment defaults", () => {
    const store = createStore({ logLevel: LogLevel.WARN });

    expect(store.get("logLevel")).toBe(LogLevel.WARN);
    expect(store.get("enableCacheService")).toBe(true);
    expect(store.get("cacheDefaultTtlMs")).toBe(5000);
    expect(store.get("cacheMaxEntries")).toBeUndefined();
    expect(store.get("enablePerformanceTracking")).toBe(true);
    expect(store.get("performanceSamplingRate")).toBe(0.5);
  });

  it("returns current value for a key", () => {
    const store = createStore({ logLevel: LogLevel.ERROR });

    expect(store.get("logLevel")).toBe(LogLevel.ERROR);
  });

  it("updates value and returns true when value changes", () => {
    const store = createStore({ logLevel: LogLevel.INFO });

    const changed = store.set("logLevel", LogLevel.ERROR);

    expect(changed).toBe(true);
    expect(store.get("logLevel")).toBe(LogLevel.ERROR);
  });

  it("returns false when value does not change", () => {
    const store = createStore({ logLevel: LogLevel.INFO });

    const changed = store.set("logLevel", LogLevel.INFO);

    expect(changed).toBe(false);
    expect(store.get("logLevel")).toBe(LogLevel.INFO);
  });

  it("handles Object.is comparison for same values", () => {
    const store = createStore({ performanceSamplingRate: 0.5 });

    const changed = store.set("performanceSamplingRate", 0.5);

    expect(changed).toBe(false);
  });

  it("exposes all values via getAll", () => {
    const store = createStore({
      isDevelopment: false,
      isProduction: true,
      enableMetricsPersistence: true,
      metricsPersistenceKey: "custom.metrics",
    });

    const all = store.getAll();

    expect(all.isDevelopment).toBe(false);
    expect(all.isProduction).toBe(true);
    expect(all.enableMetricsPersistence).toBe(true);
    expect(all.metricsPersistenceKey).toBe("custom.metrics");
  });

  it("getAll returns a copy of values", () => {
    const store = createStore();
    const all1 = store.getAll();
    store.set("logLevel", LogLevel.ERROR);
    const all2 = store.getAll();

    expect(all1.logLevel).not.toBe(all2.logLevel);
  });
});
