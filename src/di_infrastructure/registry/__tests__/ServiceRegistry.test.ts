/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing invalid service classes

import { describe, it, expect, vi } from "vitest";
import { ServiceRegistry } from "../ServiceRegistry";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { err } from "@/utils/functional/result";
import type { Logger } from "@/interfaces/logger";

class TestService implements Logger {
  static dependencies = [] as const;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class TestServiceWithoutDependencies implements Logger {
  // Keine dependencies Property definiert
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("ServiceRegistry", () => {
  describe("Registration", () => {
    it("should register service class with correct metadata", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("TestService");

      const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration).toBeDefined();
      expect(registration?.providerType).toBe("class");
      expect(registration?.serviceClass).toBe(TestService);
      expect(registration?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
    });

    it("should reject registerClass with null serviceClass", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("NullClass");

      const result = registry.registerClass(token, null as any, ServiceLifecycle.SINGLETON);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("serviceClass is required");
      }
    });

    it("should register factory with dependencies", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("FactoryService");
      const depToken = createInjectionToken<TestService>("Dep");

      const result = registry.registerFactory(
        token,
        () => new TestService(),
        ServiceLifecycle.TRANSIENT,
        [depToken]
      );
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration?.providerType).toBe("factory");
      expect(registration?.factory).toBeDefined();
      expect(registration?.dependencies).toEqual([depToken]);
    });

    it("should reject registerFactory with null factory", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("NullFactory");

      const result = registry.registerFactory(token, null as any, ServiceLifecycle.SINGLETON, []);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("factory is required");
      }
    });

    it("should reject registerFactory with undefined factory", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("UndefinedFactory");

      const result = registry.registerFactory(
        token,
        undefined as any,
        ServiceLifecycle.SINGLETON,
        []
      );
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("factory is required");
      }
    });

    it("should register value (not function)", () => {
      const registry = new ServiceRegistry();
      const testInstance = new TestService();
      const token = createInjectionToken<TestService>("ValueService");

      const result = registry.registerValue(token, testInstance);
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration?.providerType).toBe("value");
      expect(registration?.value).toBe(testInstance);
      expect(registration?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
    });

    it("should reject function as value", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("FunctionValue");

      // Try to register a function instead of a plain value
      const result = registry.registerValue(token, (() => {}) as any);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
      }
    });

    it("should register alias", () => {
      const registry = new ServiceRegistry();
      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("Alias");

      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      const result = registry.registerAlias(aliasToken, targetToken);
      expectResultOk(result);

      const registration = registry.getRegistration(aliasToken);
      expect(registration?.providerType).toBe("alias");
      expect(registration?.aliasTarget).toBe(targetToken);
    });

    it("should reject registerAlias with null targetToken", () => {
      const registry = new ServiceRegistry();
      const aliasToken = createInjectionToken<TestService>("Alias");

      const result = registry.registerAlias(aliasToken, null as any);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("targetToken is required");
      }
    });

    it("should reject registerAlias with undefined targetToken", () => {
      const registry = new ServiceRegistry();
      const aliasToken = createInjectionToken<TestService>("Alias");

      const result = registry.registerAlias(aliasToken, undefined as any);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("targetToken is required");
      }
    });

    it("should reject duplicate alias registration", () => {
      const registry = new ServiceRegistry();
      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("Alias");

      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      registry.registerAlias(aliasToken, targetToken);

      // Try to register same alias again
      const result = registry.registerAlias(aliasToken, targetToken);

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
      expect(result.error.message).toContain("already registered");
    });

    it("should reject duplicate registration for registerClass", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Duplicate");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
    });

    it("should reject duplicate registration for registerFactory", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("DuplicateFactory");

      registry.registerFactory(token, () => new TestService(), ServiceLifecycle.SINGLETON, []);
      const result = registry.registerFactory(
        token,
        () => new TestService(),
        ServiceLifecycle.SINGLETON,
        []
      );

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
    });

    it("should reject duplicate registration for registerValue", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("DuplicateValue");

      registry.registerValue(token, new TestService());
      const result = registry.registerValue(token, new TestService());

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
    });

    it("should reject duplicate registration for registerAlias", () => {
      const registry = new ServiceRegistry();
      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("DuplicateAlias");

      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      registry.registerAlias(aliasToken, targetToken);
      const result = registry.registerAlias(aliasToken, targetToken);

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
    });

    it("should register class without dependencies property", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestServiceWithoutDependencies>("NoDeps");

      // Sollte ohne Fehler registriert werden können
      const result = registry.registerClass(
        token,
        TestServiceWithoutDependencies,
        ServiceLifecycle.SINGLETON
      );
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration).toBeDefined();
      expect(registration?.providerType).toBe("class");
      expect(registration?.serviceClass).toBe(TestServiceWithoutDependencies);
      // Dependencies sollte leeres Array sein
      expect(registration?.dependencies).toEqual([]);
    });

    it("should register class with explicit dependencies property", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("WithDeps");

      // TestService hat dependencies-Property
      const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration).toBeDefined();
      expect(registration?.dependencies).toBeDefined();
      // dependencies ist ein Array (auch wenn leer)
      expect(Array.isArray(registration?.dependencies)).toBe(true);
    });

    it("should handle class with undefined dependencies property", () => {
      class ServiceWithUndefinedDeps implements Logger {
        static dependencies: any = undefined; // Explicitly set to undefined
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const registry = new ServiceRegistry();
      const token = createInjectionToken<ServiceWithUndefinedDeps>("UndefinedDeps");

      // Should fallback to empty array when dependencies is undefined
      const result = registry.registerClass(
        token,
        ServiceWithUndefinedDeps,
        ServiceLifecycle.SINGLETON
      );
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration?.dependencies).toEqual([]);
    });
  });

  describe("Retrieval", () => {
    it("should retrieve registration", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Service");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const registration = registry.getRegistration(token);

      expect(registration).toBeDefined();
      expect(registration?.serviceClass).toBe(TestService);
    });

    it("should return undefined for unregistered token", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Unregistered");

      const registration = registry.getRegistration(token);
      expect(registration).toBeUndefined();
    });

    it("has() should return correct boolean", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Service");

      expect(registry.has(token)).toBe(false);

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expect(registry.has(token)).toBe(true);
    });

    it("getAllRegistrations() should return defensive copy", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Service");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const allRegistrations = registry.getAllRegistrations();

      // Modifikation sollte Original nicht beeinflussen
      allRegistrations.clear();
      expect(registry.has(token)).toBe(true);
    });
  });

  describe("Cloning", () => {
    it("should create deep clone", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Service");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const cloned = registry.clone();

      // Clone sollte gleiche Registrierungen haben
      expect(cloned.has(token)).toBe(true);

      // Modifikation im Clone sollte Original nicht beeinflussen
      const newToken = createInjectionToken<TestService>("New");
      cloned.registerClass(newToken, TestService, ServiceLifecycle.SINGLETON);

      expect(cloned.has(newToken)).toBe(true);
      expect(registry.has(newToken)).toBe(false);
    });

    it("should clone dependencies array", () => {
      const registry = new ServiceRegistry();
      const depToken = createInjectionToken<TestService>("Dep");
      const token = createInjectionToken<TestService>("Service");

      // Service mit Dependencies registrieren
      (TestService.dependencies as unknown as (typeof depToken)[]) = [depToken];
      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const cloned = registry.clone();
      const originalReg = registry.getRegistration(token);
      const clonedReg = cloned.getRegistration(token);

      expect(originalReg?.dependencies).toEqual([depToken]);
      expect(clonedReg?.dependencies).toEqual([depToken]);
      expect(originalReg?.dependencies).not.toBe(clonedReg?.dependencies); // Verschiedene Arrays
    });
  });

  describe("clear()", () => {
    it("should remove all registrations", () => {
      const registry = new ServiceRegistry();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");

      registry.registerClass(token1, TestService, ServiceLifecycle.SINGLETON);
      registry.registerClass(token2, TestService, ServiceLifecycle.SINGLETON);

      expect(registry.has(token1)).toBe(true);
      expect(registry.has(token2)).toBe(true);

      registry.clear();

      expect(registry.has(token1)).toBe(false);
      expect(registry.has(token2)).toBe(false);
    });

    it("should clear lifecycle index", () => {
      const registry = new ServiceRegistry();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");

      registry.registerClass(token1, TestService, ServiceLifecycle.SINGLETON);
      registry.registerClass(token2, TestService, ServiceLifecycle.TRANSIENT);

      // Verify index has entries
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(1);
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT).length).toBe(1);

      registry.clear();

      // Index should be cleared
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(0);
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT).length).toBe(0);
    });
  });

  describe("getRegistrationsByLifecycle()", () => {
    it("should return registrations by lifecycle", () => {
      const registry = new ServiceRegistry();
      const singletonToken1 = createInjectionToken<TestService>("Singleton1");
      const singletonToken2 = createInjectionToken<TestService>("Singleton2");
      const transientToken = createInjectionToken<TestService>("Transient");
      const scopedToken = createInjectionToken<TestService>("Scoped");

      registry.registerClass(singletonToken1, TestService, ServiceLifecycle.SINGLETON);
      registry.registerClass(singletonToken2, TestService, ServiceLifecycle.SINGLETON);
      registry.registerClass(transientToken, TestService, ServiceLifecycle.TRANSIENT);
      registry.registerClass(scopedToken, TestService, ServiceLifecycle.SCOPED);

      const singletons = registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON);
      const transients = registry.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT);
      const scoped = registry.getRegistrationsByLifecycle(ServiceLifecycle.SCOPED);

      expect(singletons.length).toBe(2);
      expect(transients.length).toBe(1);
      expect(scoped.length).toBe(1);

      // Verify it's actually the right registrations
      expect(singletons[0]?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
      expect(transients[0]?.lifecycle).toBe(ServiceLifecycle.TRANSIENT);
      expect(scoped[0]?.lifecycle).toBe(ServiceLifecycle.SCOPED);
    });

    it("should return empty array for lifecycle with no registrations", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Service");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const transients = registry.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT);
      expect(transients).toEqual([]);
    });

    it("should handle value registrations as SINGLETON", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("ValueService");
      const instance = new TestService();

      registry.registerValue(token, instance);

      const singletons = registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON);
      expect(singletons.length).toBe(1);
      expect(singletons[0]?.providerType).toBe("value");
    });

    it("should be more efficient than getAllRegistrations for large registries", () => {
      const registry = new ServiceRegistry();

      // Register 100 services with different lifecycles
      for (let i = 0; i < 100; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        const lifecycle =
          i % 3 === 0
            ? ServiceLifecycle.SINGLETON
            : i % 3 === 1
              ? ServiceLifecycle.TRANSIENT
              : ServiceLifecycle.SCOPED;
        registry.registerClass(token, TestService, lifecycle);
      }

      // Query specific lifecycle (should be O(1) lookup)
      const startTime = performance.now();
      const singletons = registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON);
      const indexTime = performance.now() - startTime;

      // Compare with filtering all registrations (O(n))
      const startTimeAll = performance.now();
      const allRegs = Array.from(registry.getAllRegistrations().values());
      const filteredSingletons = allRegs.filter((r) => r.lifecycle === ServiceLifecycle.SINGLETON);
      const filterTime = performance.now() - startTimeAll;

      expect(singletons.length).toBe(filteredSingletons.length);
      // Index-based query should be faster (though with only 100 items, difference is minimal)
      // This test mainly documents the intent
      expect(indexTime).toBeLessThan(filterTime + 5); // Allow 5ms tolerance
    });
  });

  describe("Lifecycle Index", () => {
    it("should maintain index consistency across clone", () => {
      const registry = new ServiceRegistry();
      const token1 = createInjectionToken<TestService>("Service1");
      const token2 = createInjectionToken<TestService>("Service2");

      registry.registerClass(token1, TestService, ServiceLifecycle.SINGLETON);
      registry.registerClass(token2, TestService, ServiceLifecycle.TRANSIENT);

      const cloned = registry.clone();

      // Both should have same lifecycle counts
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(1);
      expect(cloned.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(1);
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT).length).toBe(1);
      expect(cloned.getRegistrationsByLifecycle(ServiceLifecycle.TRANSIENT).length).toBe(1);

      // Adding to clone should not affect original
      const token3 = createInjectionToken<TestService>("Service3");
      cloned.registerClass(token3, TestService, ServiceLifecycle.SINGLETON);

      expect(cloned.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(2);
      expect(registry.getRegistrationsByLifecycle(ServiceLifecycle.SINGLETON).length).toBe(1);
    });
  });

  describe("MAX_REGISTRATIONS Limit (DoS Protection)", () => {
    const MAX_REGISTRATIONS = 10000;

    it("should reject registerClass when MAX_REGISTRATIONS exceeded", () => {
      const registry = new ServiceRegistry();

      // Fill up to MAX_REGISTRATIONS
      for (let i = 0; i < MAX_REGISTRATIONS; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
        expectResultOk(result);
      }

      // Next registration should fail
      const overflowToken = createInjectionToken<TestService>("Overflow");
      const result = registry.registerClass(overflowToken, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("MaxRegistrationsExceeded");
      expect(result.error.message).toContain("10000");
    });

    it("should reject registerFactory when MAX_REGISTRATIONS exceeded", () => {
      const registry = new ServiceRegistry();

      // Fill up to MAX_REGISTRATIONS
      for (let i = 0; i < MAX_REGISTRATIONS; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
        expectResultOk(result);
      }

      // Next factory registration should fail
      const overflowToken = createInjectionToken<TestService>("OverflowFactory");
      const result = registry.registerFactory(
        overflowToken,
        () => new TestService(),
        ServiceLifecycle.SINGLETON,
        []
      );

      expectResultErr(result);
      expect(result.error.code).toBe("MaxRegistrationsExceeded");
      expect(result.error.message).toContain("10000");
    });

    it("should reject registerValue when MAX_REGISTRATIONS exceeded", () => {
      const registry = new ServiceRegistry();

      // Fill up to MAX_REGISTRATIONS
      for (let i = 0; i < MAX_REGISTRATIONS; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
        expectResultOk(result);
      }

      // Next value registration should fail
      const overflowToken = createInjectionToken<TestService>("OverflowValue");
      const result = registry.registerValue(overflowToken, new TestService());

      expectResultErr(result);
      expect(result.error.code).toBe("MaxRegistrationsExceeded");
      expect(result.error.message).toContain("10000");
    });

    it("should reject registerAlias when MAX_REGISTRATIONS exceeded", () => {
      const registry = new ServiceRegistry();

      // Fill up to MAX_REGISTRATIONS
      for (let i = 0; i < MAX_REGISTRATIONS; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
        expectResultOk(result);
      }

      // Register target for alias
      const targetToken = createInjectionToken<TestService>("Target");
      registry.clear(); // Clear to make room for target
      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);

      // Fill again to MAX_REGISTRATIONS
      for (let i = 0; i < MAX_REGISTRATIONS - 1; i++) {
        const token = createInjectionToken<TestService>(`Service${i}`);
        registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      }

      // Next alias registration should fail
      const overflowToken = createInjectionToken<TestService>("OverflowAlias");
      const result = registry.registerAlias(overflowToken, targetToken);

      expectResultErr(result);
      expect(result.error.code).toBe("MaxRegistrationsExceeded");
      expect(result.error.message).toContain("10000");
    });

    it("should handle ServiceRegistration.createClass validation errors", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Test");

      // Pass null/undefined as serviceClass to trigger validation error
      // @ts-expect-error - Testing runtime validation
      const result = registry.registerClass(token, null, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should propagate errors from ServiceRegistration.createClass", async () => {
      // This test covers lines 119-120 in ServiceRegistry.ts
      // Even though ServiceRegistration.createClass() always returns ok(),
      // we mock it to return an error to test the error propagation path
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Test");

      // Mock ServiceRegistration.createClass to return an error
      const serviceRegistrationModule = await import("../../types/serviceregistration");
      vi.spyOn(serviceRegistrationModule.ServiceRegistration, "createClass").mockReturnValue(
        err({
          code: "InvalidOperation",
          message: "Mocked createClass error",
        })
      );

      const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
      expect(result.error.message).toBe("Mocked createClass error");

      // Restore
      vi.restoreAllMocks();
    });

    it("should handle ServiceRegistration.createFactory validation errors", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Test");

      // Pass null/undefined as factory to trigger validation error
      // @ts-expect-error - Testing runtime validation
      const result = registry.registerFactory(token, null, ServiceLifecycle.SINGLETON, []);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should handle ServiceRegistration.createValue validation errors", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Test");

      // Pass function as value (not allowed - values must be instances/primitives)
      const result = registry.registerValue(token, (() => {}) as any);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should handle ServiceRegistration.createAlias validation errors", () => {
      const registry = new ServiceRegistry();
      const aliasToken = createInjectionToken<TestService>("Alias");

      // Pass null/undefined as targetToken
      // @ts-expect-error - Testing runtime validation
      const result = registry.registerAlias(aliasToken, null);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });
  });
});
