/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing error scenarios with invalid types

import { describe, it, expect } from "vitest";
import { ServiceResolver } from "../ServiceResolver";
import { ServiceRegistry } from "../../registry/ServiceRegistry";
import { InstanceCache } from "../../cache/InstanceCache";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Logger } from "@/interfaces/logger";

class TestService implements Logger {
  static dependencies = [] as const;
  constructor(public value: number = Math.random()) {}
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class TestServiceWithDep implements Logger {
  static dependencies = [] as const;
  constructor(public dep: TestService) {}
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("ServiceResolver", () => {
  describe("Resolution", () => {
    it("should resolve registered service", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Service");
      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(token);
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(TestService);
    });

    it("should fail for unregistered token", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Unregistered");

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("TokenNotRegistered");
    });
  });

  describe("Alias Resolution", () => {
    it("should resolve alias to target", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("Alias");

      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      registry.registerAlias(aliasToken, targetToken);

      const result = resolver.resolve(aliasToken);
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(TestService);
    });

    it("should resolve nested aliases", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const targetToken = createInjectionToken<TestService>("Target");
      const alias1Token = createInjectionToken<TestService>("Alias1");
      const alias2Token = createInjectionToken<TestService>("Alias2");

      registry.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      registry.registerAlias(alias1Token, targetToken);
      registry.registerAlias(alias2Token, alias1Token);

      const result = resolver.resolve(alias2Token);
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(TestService);
    });
  });

  describe("Singleton Lifecycle", () => {
    it("should return same instance on multiple resolves", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Singleton");

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result1 = resolver.resolve(token);
      expectResultOk(result1);

      const result2 = resolver.resolve(token);
      expectResultOk(result2);

      expect(result1.value).toBe(result2.value);
    });

    it("should delegate to parent resolver for singletons", () => {
      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const token = createInjectionToken<TestService>("SharedSingleton");

      // Zuerst registrieren, dann clonen
      parentRegistry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const parentResolver = new ServiceResolver(parentRegistry, parentCache, null, "parent");
      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = new ServiceResolver(childRegistry, childCache, parentResolver, "child");

      const parentResult = parentResolver.resolve(token);
      expectResultOk(parentResult);

      const childResult = childResolver.resolve(token);
      expectResultOk(childResult);

      // Child sollte die Parent-Instanz zurückgeben
      expect(childResult.value).toBe(parentResult.value);
    });

    it("should use child-specific singleton when parent doesn't have it", () => {
      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const parentResolver = new ServiceResolver(parentRegistry, parentCache, null, "parent");

      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = new ServiceResolver(childRegistry, childCache, parentResolver, "child");

      const token = createInjectionToken<TestService>("ChildSingleton");

      // Nur im Child registriert
      childRegistry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result1 = childResolver.resolve(token);
      expectResultOk(result1);

      const result2 = childResolver.resolve(token);
      expectResultOk(result2);

      // Sollte gleiche Instanz sein
      expect(result1.value).toBe(result2.value);
    });
  });

  describe("Transient Lifecycle", () => {
    it("should return new instance on each resolve", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Transient");

      registry.registerClass(token, TestService, ServiceLifecycle.TRANSIENT);

      const result1 = resolver.resolve(token);
      expectResultOk(result1);

      const result2 = resolver.resolve(token);
      expectResultOk(result2);

      expect(result1.value).not.toBe(result2.value);
      expect(result1.value.value).not.toBe(result2.value.value);
    });
  });

  describe("Scoped Lifecycle", () => {
    it("should fail when resolved in root scope", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Scoped");

      registry.registerClass(token, TestService, ServiceLifecycle.SCOPED);

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("ScopeRequired");
    });

    it("should return same instance within scope", () => {
      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const token = createInjectionToken<TestService>("Scoped");

      // Zuerst registrieren, dann clonen
      parentRegistry.registerClass(token, TestService, ServiceLifecycle.SCOPED);

      const parentResolver = new ServiceResolver(parentRegistry, parentCache, null, "parent");
      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = new ServiceResolver(childRegistry, childCache, parentResolver, "child");

      const result1 = childResolver.resolve(token);
      expectResultOk(result1);

      const result2 = childResolver.resolve(token);
      expectResultOk(result2);

      expect(result1.value).toBe(result2.value);
    });

    it("should isolate scoped instances between scopes", () => {
      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const token = createInjectionToken<TestService>("Scoped");

      // Zuerst registrieren, dann clonen
      parentRegistry.registerClass(token, TestService, ServiceLifecycle.SCOPED);

      const parentResolver = new ServiceResolver(parentRegistry, parentCache, null, "parent");
      const child1Registry = parentRegistry.clone();
      const child1Cache = new InstanceCache();
      const child1Resolver = new ServiceResolver(
        child1Registry,
        child1Cache,
        parentResolver,
        "child1"
      );

      const child2Registry = parentRegistry.clone();
      const child2Cache = new InstanceCache();
      const child2Resolver = new ServiceResolver(
        child2Registry,
        child2Cache,
        parentResolver,
        "child2"
      );

      const child1Result = child1Resolver.resolve(token);
      expectResultOk(child1Result);

      const child2Result = child2Resolver.resolve(token);
      expectResultOk(child2Result);

      expect(child1Result.value).not.toBe(child2Result.value);
    });
  });

  describe("Factory Resolution", () => {
    it("should resolve factory function", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Factory");

      registry.registerFactory(token, () => new TestService(42), ServiceLifecycle.SINGLETON, []);

      const result = resolver.resolve(token);
      expectResultOk(result);
      expect(result.value.value).toBe(42);
    });

    it("should wrap factory errors", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("FailingFactory");

      registry.registerFactory(
        token,
        () => {
          throw new Error("Factory failed");
        },
        ServiceLifecycle.SINGLETON,
        []
      );

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("FactoryFailed");
    });
  });

  describe("Value Resolution", () => {
    it("should resolve registered value", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const testInstance = new TestService(42);
      const token = createInjectionToken<TestService>("Value");

      registry.registerValue(token, testInstance);

      const result = resolver.resolve(token);
      expectResultOk(result);
      if (result.ok) {
        expect(result.value.value).toBe(42);
      }
    });
  });

  // Note: Circular dependency detection is handled by ContainerValidator, not ServiceResolver.
  // ServiceResolver will stack overflow if circular dependencies are not caught during validation.
  // This test is skipped as it tests a validation concern, not resolution logic.

  describe("Dependency Injection", () => {
    it("should inject dependencies for class", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const depToken = createInjectionToken<TestService>("Dep");
      const serviceToken = createInjectionToken<TestServiceWithDep>("Service");

      registry.registerClass(depToken, TestService, ServiceLifecycle.SINGLETON);
      // Class-basierte Dependency Injection
      (TestServiceWithDep.dependencies as unknown as (typeof depToken)[]) = [depToken];
      registry.registerClass(serviceToken, TestServiceWithDep, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(serviceToken);
      expectResultOk(result);
      expect(result.value.dep).toBeInstanceOf(TestService);
    });

    it("should allow factory to capture dependencies via closure", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const depToken = createInjectionToken<TestService>("Dep");
      const serviceToken = createInjectionToken<TestServiceWithDep>("Service");

      registry.registerClass(depToken, TestService, ServiceLifecycle.SINGLETON);

      // Factory muss Dependencies selbst auflösen (keine automatische DI)
      registry.registerFactory(
        serviceToken,
        () => {
          // Factory muss selbst resolver verwenden - nicht empfohlen!
          // Besser: Class-basierte DI verwenden
          const depResult = resolver.resolve(depToken);
          if (!depResult.ok) throw new Error("Failed to resolve dependency");
          return new TestServiceWithDep(depResult.value);
        },
        ServiceLifecycle.SINGLETON,
        [] // Dependencies-Array wird nicht für Factories verwendet
      );

      const result = resolver.resolve(serviceToken);
      expectResultOk(result);
      expect(result.value.dep).toBeInstanceOf(TestService);
    });

    it("should wrap constructor exceptions", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      class FailingService implements Logger {
        static dependencies = [] as const;
        constructor() {
          throw new Error("Constructor failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const token = createInjectionToken<FailingService>("Failing");
      registry.registerClass(token, FailingService, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("FactoryFailed");
      expect(result.error.message).toContain("Constructor failed");
    });

    it("should return error for invalid registration", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = new ServiceResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Invalid");

      // Manually create invalid registration (bypassing normal registration)
      (registry as any).registrations.set(
        token,
        new (class {
          lifecycle = ServiceLifecycle.SINGLETON;
          dependencies = [];
          providerType = "class";
          serviceClass = undefined;
          factory = undefined;
          value = undefined;
          aliasTarget = undefined;
        })()
      );

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });
  });
});
