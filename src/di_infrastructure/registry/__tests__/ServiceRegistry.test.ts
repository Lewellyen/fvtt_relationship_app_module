import { describe, it, expect } from "vitest";
import { ServiceRegistry } from "../ServiceRegistry";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

class TestService {
  static dependencies = [] as const;
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

    it("should register value (not function)", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<{ value: number }>("ValueService");

      const result = registry.registerValue(token, { value: 42 });
      expectResultOk(result);

      const registration = registry.getRegistration(token);
      expect(registration?.providerType).toBe("value");
      expect(registration?.value).toEqual({ value: 42 });
      expect(registration?.lifecycle).toBe(ServiceLifecycle.SINGLETON);
    });

    it("should reject function as value", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<() => void>("FunctionValue");

      const result = registry.registerValue(token, (() => {}) as never);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
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

    it("should reject duplicate registration", () => {
      const registry = new ServiceRegistry();
      const token = createInjectionToken<TestService>("Duplicate");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const result = registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
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
      (TestService.dependencies as unknown as typeof depToken[]) = [depToken];
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
  });
});

