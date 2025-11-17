/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing error scenarios with invalid types

import { describe, it, expect, vi } from "vitest";
import { ServiceResolver } from "../ServiceResolver";
import { ServiceRegistry } from "../../registry/ServiceRegistry";
import { InstanceCache } from "../../cache/InstanceCache";
import { createInjectionToken } from "../../tokenutilities";
import { ServiceLifecycle } from "../../types/servicelifecycle";
import {
  expectResultOk,
  expectResultErr,
  createMockPerformanceTracker,
} from "@/test/utils/test-helpers";
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

/**
 * Helper to create a ServiceResolver with mock PerformanceTracker
 */
function createTestResolver(
  registry: ServiceRegistry,
  cache: InstanceCache,
  parentResolver: ServiceResolver | null,
  scopeName: string
): ServiceResolver {
  const mockPerformanceTracker = createMockPerformanceTracker();
  return new ServiceResolver(registry, cache, parentResolver, scopeName, mockPerformanceTracker);
}

describe("ServiceResolver", () => {
  describe("Resolution", () => {
    it("should resolve registered service", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Service");
      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(token);
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(TestService);
    });

    it("should fail for unregistered token", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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

      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");
      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = createTestResolver(childRegistry, childCache, parentResolver, "child");

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
      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");

      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = createTestResolver(childRegistry, childCache, parentResolver, "child");

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

    it("should propagate circular dependency error from parent", () => {
      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");

      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = createTestResolver(childRegistry, childCache, parentResolver, "child");

      const token = createInjectionToken<TestService>("CircularSingleton");

      // Register in both parent and child
      parentRegistry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      childRegistry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Spy on parent resolver to return circular dependency error
      vi.spyOn(parentResolver, "resolve").mockImplementation(() => ({
        ok: false,
        error: {
          code: "CircularDependency" as const,
          message: "Circular dependency detected",
          tokenDescription: String(token),
          resolutionStack: [String(token)],
        },
      }));

      // Child should propagate the circular dependency error from parent
      const result = childResolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("CircularDependency");

      // Restore
      vi.restoreAllMocks();
    });
  });

  describe("Transient Lifecycle", () => {
    it("should return new instance on each resolve", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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

      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");
      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = createTestResolver(childRegistry, childCache, parentResolver, "child");

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

      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");
      const child1Registry = parentRegistry.clone();
      const child1Cache = new InstanceCache();
      const child1Resolver = createTestResolver(
        child1Registry,
        child1Cache,
        parentResolver,
        "child1"
      );

      const child2Registry = parentRegistry.clone();
      const child2Cache = new InstanceCache();
      const child2Resolver = createTestResolver(
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

    it("should handle scoped instantiation failure", () => {
      class FailingScopedService implements Logger {
        static dependencies = [] as const;
        constructor() {
          throw new Error("Scoped service instantiation failed");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const parentRegistry = new ServiceRegistry();
      const parentCache = new InstanceCache();
      const token = createInjectionToken<FailingScopedService>("FailingScoped");

      // Register as scoped
      parentRegistry.registerClass(token, FailingScopedService, ServiceLifecycle.SCOPED);

      const parentResolver = createTestResolver(parentRegistry, parentCache, null, "parent");
      const childRegistry = parentRegistry.clone();
      const childCache = new InstanceCache();
      const childResolver = createTestResolver(childRegistry, childCache, parentResolver, "child");

      const result = childResolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("FactoryFailed");
      expect(result.error.message).toContain("Scoped service instantiation failed");
    });
  });

  describe("Factory Resolution", () => {
    it("should resolve factory function", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("Factory");

      registry.registerFactory(token, () => new TestService(42), ServiceLifecycle.SINGLETON, []);

      const result = resolver.resolve(token);
      expectResultOk(result);
      expect(result.value.value).toBe(42);
    });

    it("should wrap factory errors", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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

    it("should fail when class dependency resolution fails", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

      const depToken = createInjectionToken<TestService>("MissingDep");
      const serviceToken = createInjectionToken<TestServiceWithDep>("Service");

      // Register service with dependency, but don't register the dependency
      (TestServiceWithDep.dependencies as unknown as (typeof depToken)[]) = [depToken];
      registry.registerClass(serviceToken, TestServiceWithDep, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(serviceToken);
      expectResultErr(result);
      expect(result.error.code).toBe("DependencyResolveFailed");
      expect(result.error.message).toContain("Cannot resolve dependency");
    });

    it("should allow factory to capture dependencies via closure", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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
      const resolver = createTestResolver(registry, cache, null, "root");

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

    it("should handle invalid lifecycle enum value", () => {
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

      const token = createInjectionToken<TestService>("InvalidLifecycle");

      // Manually create registration with invalid lifecycle (bypassing normal registration)
      (registry as any).registrations.set(
        token,
        new (class {
          lifecycle = "invalid" as any;
          dependencies = [];
          providerType = "class";
          serviceClass = TestService;
          factory = undefined;
          value = undefined;
          aliasTarget = undefined;
        })()
      );

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidLifecycle");
      expect(result.error.message).toContain("Invalid service lifecycle");
    });

    it("should handle constructor errors gracefully", () => {
      class FailingService implements Logger {
        static dependencies = [] as const;
        constructor() {
          throw new Error("Constructor intentionally fails");
        }
        log(): void {}
        error(): void {}
        warn(): void {}
        info(): void {}
        debug(): void {}
      }

      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const resolver = createTestResolver(registry, cache, null, "root");

      const token = createInjectionToken<FailingService>("FailingService");
      registry.registerClass(token, FailingService, ServiceLifecycle.SINGLETON);

      const result = resolver.resolve(token);
      expectResultErr(result);
      expect(result.error.code).toBe("FactoryFailed");
      expect(result.error.message).toContain("Constructor failed");
      expect(result.error.message).toContain("Constructor intentionally fails");
    });

    it("should handle null metricsCollector gracefully (optional chaining)", () => {
      // Create resolver without metricsCollector (pass null)
      // This test covers line 120 in ServiceResolver.ts: metricsCollector?.recordResolution
      const registry = new ServiceRegistry();
      const cache = new InstanceCache();
      const token = createInjectionToken<TestService>("Test");

      // Create resolver with null metricsCollector to test optional chaining
      // We need to ensure the onComplete callback is called, so we need a performanceTracker
      // that actually calls the onComplete callback
      const mockPerformanceTracker = {
        track: vi.fn(
          (operation: () => any, onComplete?: (duration: number, result: any) => void) => {
            const result = operation();
            if (onComplete) {
              onComplete(0.5, { ok: true, value: result });
            }
            return result;
          }
        ),
      };
      const resolver = new ServiceResolver(
        registry,
        cache,
        null,
        "test",
        mockPerformanceTracker as any
      );

      // Explicitly set metricsCollector to null to test the optional chaining path
      resolver["metricsCollector"] = null;

      // Verify metricsCollector is null
      expect(resolver["metricsCollector"]).toBeNull();

      registry.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Should resolve without throwing (metricsCollector?.recordResolution is safe)
      // The onComplete callback (line 119-121) will be called by the performanceTracker,
      // and metricsCollector?.recordResolution (line 120) should handle null gracefully
      const result = resolver.resolve(token);
      expectResultOk(result);

      // Verify that the onComplete callback was called (this ensures line 120 is executed)
      expect(mockPerformanceTracker.track).toHaveBeenCalled();
      const onCompleteCall = mockPerformanceTracker.track.mock.calls[0]?.[1];
      expect(onCompleteCall).toBeDefined();

      // Call onComplete manually to ensure line 120 is covered
      if (onCompleteCall) {
        onCompleteCall(0.5, { ok: true, value: result.value });
      }
    });
  });
});
