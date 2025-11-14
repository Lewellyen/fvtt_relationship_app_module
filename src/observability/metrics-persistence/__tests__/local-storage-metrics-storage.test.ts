import { describe, it, expect } from "vitest";
import { LocalStorageMetricsStorage } from "../local-storage-metrics-storage";
import type { MetricsPersistenceState } from "@/observability/metrics-collector";
import { DEFAULT_METRICS_STORAGE_KEY } from "../metrics-storage";

function createMockStorage(): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? (data.get(key) ?? null) : null;
    },
    key(index: number) {
      return Array.from(data.keys())[index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  } as Storage & { data: Map<string, string> };
}

describe("LocalStorageMetricsStorage", () => {
  const sampleState: MetricsPersistenceState = {
    metrics: {
      containerResolutions: 2,
      resolutionErrors: 1,
      cacheHits: 3,
      cacheMisses: 4,
      portSelections: Object.fromEntries([[13, 5]]) as Record<number, number>,
      portSelectionFailures: Object.fromEntries([[13, 1]]) as Record<number, number>,
    },
    resolutionTimes: [1, 2, 3],
    resolutionTimesIndex: 2,
    resolutionTimesCount: 3,
  };

  it("should persist and load state via storage", () => {
    const mockStorage = createMockStorage();
    const storage = new LocalStorageMetricsStorage("test.metrics", mockStorage);

    storage.save(sampleState);
    const restored = storage.load();

    expect(restored).toEqual(sampleState);
  });

  it("should clear persisted state", () => {
    const mockStorage = createMockStorage();
    const storage = new LocalStorageMetricsStorage("test.metrics", mockStorage);

    storage.save(sampleState);
    storage.clear();

    expect(storage.load()).toBeNull();
  });

  it("should return null when storage throws during load", () => {
    const faultyStorage = {
      getItem() {
        throw new Error("Not available");
      },
      setItem() {},
      removeItem() {},
      clear() {},
      key() {
        return null;
      },
      length: 0,
    } as unknown as Storage;

    const storage = new LocalStorageMetricsStorage("test.metrics", faultyStorage);
    expect(storage.load()).toBeNull();
  });

  it("should behave as no-op when storage is unavailable", () => {
    const storage = new LocalStorageMetricsStorage("test.metrics", null);
    expect(storage.load()).toBeNull();

    expect(() => storage.save(sampleState)).not.toThrow();
    expect(() => storage.clear()).not.toThrow();
  });

  it("should ignore serialization errors during save and clear", () => {
    const faultyStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        throw new Error("not allowed");
      },
      clear: () => {},
      key: () => null,
      length: 0,
    } as unknown as Storage;

    const storage = new LocalStorageMetricsStorage(DEFAULT_METRICS_STORAGE_KEY, faultyStorage);

    expect(() => storage.save(sampleState)).not.toThrow();
    expect(() => storage.clear()).not.toThrow();
  });
});
