import { describe, it, expect } from "vitest";
import { InstanceCache } from "../InstanceCache";
import { createInjectionToken } from "../../tokenutilities";
import type { Logger } from "@/interfaces/logger";

class TestService implements Logger {
  value = 42;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("InstanceCache", () => {
  describe("get", () => {
    it("should return undefined for non-existent token", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<Logger>("TestService");

      const result = cache.get(token);

      expect(result).toBeUndefined();
    });

    it("should return cached instance for existing token", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);
      const result = cache.get(token);

      expect(result).toBe(instance);
      expect(result?.value).toBe(42);
    });

    it("should return correct type for cached instance", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);
      const result = cache.get(token);

      expect(result).toBeInstanceOf(TestService);
    });
  });

  describe("set", () => {
    it("should store instance in cache", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);

      expect(cache.get(token)).toBe(instance);
    });

    it("should overwrite existing instance", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance1 = new TestService();
      instance1.value = 1;
      const instance2 = new TestService();
      instance2.value = 2;

      cache.set(token, instance1);
      cache.set(token, instance2);

      expect(cache.get(token)).toBe(instance2);
      expect(cache.get(token)?.value).toBe(2);
    });

    it("should store multiple different tokens", () => {
      const cache = new InstanceCache();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");
      const instance1 = new TestService();
      instance1.value = 1;
      const instance2 = new TestService();
      instance2.value = 2;

      cache.set(token1, instance1);
      cache.set(token2, instance2);

      expect(cache.get(token1)?.value).toBe(1);
      expect(cache.get(token2)?.value).toBe(2);
    });
  });

  describe("has", () => {
    it("should return false for non-existent token", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<Logger>("TestService");

      expect(cache.has(token)).toBe(false);
    });

    it("should return true for existing token", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);

      expect(cache.has(token)).toBe(true);
    });

    it("should return false after clearing cache", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);
      cache.clear();

      expect(cache.has(token)).toBe(false);
    });
  });

  describe("clear", () => {
    it("should remove all cached instances", () => {
      const cache = new InstanceCache();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");
      const instance1 = new TestService();
      const instance2 = new TestService();

      cache.set(token1, instance1);
      cache.set(token2, instance2);

      cache.clear();

      expect(cache.has(token1)).toBe(false);
      expect(cache.has(token2)).toBe(false);
      expect(cache.get(token1)).toBeUndefined();
      expect(cache.get(token2)).toBeUndefined();
    });

    it("should not throw when clearing empty cache", () => {
      const cache = new InstanceCache();

      expect(() => cache.clear()).not.toThrow();
    });
  });

  describe("getAllInstances", () => {
    it("should return empty map for empty cache", () => {
      const cache = new InstanceCache();

      const instances = cache.getAllInstances();

      expect(instances).toBeInstanceOf(Map);
      expect(instances.size).toBe(0);
    });

    it("should return copy of all cached instances", () => {
      const cache = new InstanceCache();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");
      const instance1 = new TestService();
      instance1.value = 1;
      const instance2 = new TestService();
      instance2.value = 2;

      cache.set(token1, instance1);
      cache.set(token2, instance2);

      const instances = cache.getAllInstances();

      expect(instances.size).toBe(2);
      expect(instances.get(token1)).toBe(instance1);
      expect(instances.get(token2)).toBe(instance2);
    });

    it("should return independent copy that does not affect cache", () => {
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("TestService");
      const instance = new TestService();

      cache.set(token, instance);
      const instances = cache.getAllInstances();
      instances.clear();

      // Original cache should still have the instance
      expect(cache.has(token)).toBe(true);
      expect(cache.get(token)).toBe(instance);
    });

    it("should return all instances after multiple operations", () => {
      const cache = new InstanceCache();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");
      const token3 = createInjectionToken<TestService>("Service3");
      const instance1 = new TestService();
      const instance2 = new TestService();
      const instance3 = new TestService();

      cache.set(token1, instance1);
      cache.set(token2, instance2);
      cache.set(token3, instance3);
      cache.clear();
      cache.set(token1, instance1);
      cache.set(token2, instance2);

      const instances = cache.getAllInstances();

      expect(instances.size).toBe(2);
      expect(instances.has(token1)).toBe(true);
      expect(instances.has(token2)).toBe(true);
      expect(instances.has(token3)).toBe(false);
    });
  });
});

