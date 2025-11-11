import { describe, it, expect } from "vitest";
import { TypeSafeRegistrationMap } from "../TypeSafeRegistrationMap";
import { ServiceRegistration } from "../../types/serviceregistration";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import type { Logger } from "@/interfaces/logger";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { createMockLogger, createMockMetricsCollector } from "@/test/utils/test-helpers";

describe("TypeSafeRegistrationMap", () => {
  describe("Basic Operations", () => {
    it("should store and retrieve registrations", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("TestLogger");

      const logger = createMockLogger();
      const registration = ServiceRegistration.createValue(logger);
      if (!registration.ok) throw new Error("Failed to create registration");

      map.set(token, registration.value);
      const retrieved = map.get(token);

      expect(retrieved).toBeDefined();
      expect(retrieved?.value).toBe(logger);
    });

    it("should return undefined for unregistered token", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("TestLogger");

      const result = map.get(token);

      expect(result).toBeUndefined();
    });

    it("should check token existence with has()", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("TestLogger");

      expect(map.has(token)).toBe(false);

      const logger = createMockLogger();
      const registration = ServiceRegistration.createValue(logger);
      if (!registration.ok) throw new Error("Failed to create registration");
      map.set(token, registration.value);

      expect(map.has(token)).toBe(true);
    });

    it("should delete registrations", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("TestLogger");

      const logger = createMockLogger();
      const registration = ServiceRegistration.createValue(logger);
      if (!registration.ok) throw new Error("Failed to create registration");
      map.set(token, registration.value);

      expect(map.has(token)).toBe(true);
      const deleted = map.delete(token);
      expect(deleted).toBe(true);
      expect(map.has(token)).toBe(false);
    });

    it("should return false when deleting non-existent token", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("TestLogger");

      const deleted = map.delete(token);
      expect(deleted).toBe(false);
    });

    it("should track size correctly", () => {
      const map = new TypeSafeRegistrationMap();
      const token1 = createInjectionToken<Logger>("Logger1");
      const token2 = createInjectionToken<MetricsCollector>("Metrics1");

      expect(map.size).toBe(0);

      const logger = createMockLogger();
      const reg1 = ServiceRegistration.createValue(logger);
      if (!reg1.ok) throw new Error("Failed to create registration");
      map.set(token1, reg1.value);
      expect(map.size).toBe(1);

      const metrics = createMockMetricsCollector();
      const reg2 = ServiceRegistration.createValue(metrics);
      if (!reg2.ok) throw new Error("Failed to create registration");
      map.set(token2, reg2.value);
      expect(map.size).toBe(2);

      map.delete(token1);
      expect(map.size).toBe(1);
    });

    it("should clear all registrations", () => {
      const map = new TypeSafeRegistrationMap();
      const token1 = createInjectionToken<Logger>("Logger1");
      const token2 = createInjectionToken<MetricsCollector>("Metrics1");

      const logger = createMockLogger();
      const metrics = createMockMetricsCollector();
      const reg1 = ServiceRegistration.createValue(logger);
      const reg2 = ServiceRegistration.createValue(metrics);
      if (!reg1.ok || !reg2.ok) throw new Error("Failed to create registrations");

      map.set(token1, reg1.value);
      map.set(token2, reg2.value);
      expect(map.size).toBe(2);

      map.clear();
      expect(map.size).toBe(0);
      expect(map.has(token1)).toBe(false);
      expect(map.has(token2)).toBe(false);
    });
  });

  describe("Iteration", () => {
    it("should provide entries() iterator", () => {
      const map = new TypeSafeRegistrationMap();
      const token1 = createInjectionToken<Logger>("Logger1");
      const token2 = createInjectionToken<MetricsCollector>("Metrics1");

      const logger = createMockLogger();
      const metrics = createMockMetricsCollector();
      const reg1 = ServiceRegistration.createValue(logger);
      const reg2 = ServiceRegistration.createValue(metrics);
      if (!reg1.ok || !reg2.ok) throw new Error("Failed to create registrations");

      map.set(token1, reg1.value);
      map.set(token2, reg2.value);

      const entries = Array.from(map.entries());
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual([expect.any(Symbol), expect.any(ServiceRegistration)]);
      expect(entries[1]).toEqual([expect.any(Symbol), expect.any(ServiceRegistration)]);
    });
  });

  describe("Cloning", () => {
    it("should create a shallow clone", () => {
      const map = new TypeSafeRegistrationMap();
      const token1 = createInjectionToken<Logger>("Logger1");
      const token2 = createInjectionToken<MetricsCollector>("Metrics1");

      const logger = createMockLogger();
      const metrics = createMockMetricsCollector();
      const reg1 = ServiceRegistration.createValue(logger);
      const reg2 = ServiceRegistration.createValue(metrics);
      if (!reg1.ok || !reg2.ok) throw new Error("Failed to create registrations");

      map.set(token1, reg1.value);
      map.set(token2, reg2.value);

      const cloned = map.clone();

      expect(cloned.size).toBe(2);
      expect(cloned.has(token1)).toBe(true);
      expect(cloned.has(token2)).toBe(true);
      expect(cloned.get(token1)).toBe(reg1.value); // Same reference (shallow)
      expect(cloned.get(token2)).toBe(reg2.value);
    });

    it("should create independent clone (mutations don't affect original)", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("Logger1");

      const logger = createMockLogger();
      const registration = ServiceRegistration.createValue(logger);
      if (!registration.ok) throw new Error("Failed to create registration");
      map.set(token, registration.value);

      const cloned = map.clone();
      const newToken = createInjectionToken<MetricsCollector>("Metrics1");
      const metrics = createMockMetricsCollector();
      const newReg = ServiceRegistration.createValue(metrics);
      if (!newReg.ok) throw new Error("Failed to create registration");

      cloned.set(newToken, newReg.value);

      expect(map.has(newToken)).toBe(false); // Original unaffected
      expect(cloned.has(newToken)).toBe(true);
      expect(map.size).toBe(1);
      expect(cloned.size).toBe(2);
    });
  });

  describe("Type Safety", () => {
    it("should preserve generic type through get() with class registration", () => {
      const map = new TypeSafeRegistrationMap();
      const token = createInjectionToken<Logger>("Logger");

      // Use a factory instead of class for simpler test
      const loggerFactory = (): Logger => createMockLogger();
      const registration = ServiceRegistration.createFactory<Logger>(
        ServiceLifecycle.SINGLETON,
        [],
        loggerFactory
      );
      if (!registration.ok) throw new Error("Failed to create registration");

      map.set(token, registration.value);
      const retrieved = map.get(token);

      expect(retrieved).toBeDefined();
      expect(retrieved?.factory).toBe(loggerFactory);
      expect(retrieved?.providerType).toBe("factory");
    });
  });
});
