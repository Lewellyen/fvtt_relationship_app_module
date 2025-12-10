import { describe, it, expect } from "vitest";
import {
  LocalStorageMetricsStorage,
  getStorage,
} from "@/infrastructure/observability/metrics-persistence/local-storage-metrics-storage";
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-types";
import { DEFAULT_METRICS_STORAGE_KEY } from "@/infrastructure/observability/metrics-persistence/metrics-storage";

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

  describe("getStorage", () => {
    it("should return localStorage when available", () => {
      // In test environment, localStorage should be available
      const result = getStorage();

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Object);
      // Verify it has Storage-like methods
      if (result) {
        expect(typeof result.getItem).toBe("function");
        expect(typeof result.setItem).toBe("function");
      }
    });

    it("should return null when accessing localStorage throws", () => {
      // Create a mock that throws when accessed
      const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
      try {
        Object.defineProperty(globalThis, "localStorage", {
          get() {
            throw new Error("localStorage access denied");
          },
          configurable: true,
        });

        const result = getStorage();

        expect(result).toBeNull();
      } finally {
        // Restore original descriptor
        if (originalDescriptor) {
          Object.defineProperty(globalThis, "localStorage", originalDescriptor);
        } else {
          delete (globalThis as { localStorage?: Storage }).localStorage;
        }
      }
    });

    it("should return null when localStorage is not available", () => {
      // Test the "in" check by temporarily removing localStorage
      const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
      try {
        // Delete localStorage property to simulate it not being in globalThis
        if (originalDescriptor) {
          delete (globalThis as { localStorage?: Storage }).localStorage;
        }

        // The "in" check should fail, so getStorage should return null
        const result = getStorage();
        expect(result).toBeNull();
      } finally {
        // Restore original descriptor
        if (originalDescriptor) {
          Object.defineProperty(globalThis, "localStorage", originalDescriptor);
        }
      }
    });
  });
});
