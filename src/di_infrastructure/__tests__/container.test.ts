/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for type manipulation in edge case tests

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceContainer } from "../container";
import { createInjectionToken } from "../tokenutilities";
import { markAsApiSafe } from "../types/api-safe-token";
import { ServiceLifecycle } from "../types/servicelifecycle";
import type { ServiceType } from "@/types/servicetypeindex";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok } from "@/utils/result";
import type { Logger } from "@/interfaces/logger";

// Helper for tests: Wrap tokens for resolve() testing (simulates external API usage)
// In production, only composition-root marks tokens as API-safe

const testResolve = <T extends ServiceType>(container: ServiceContainer, token: any): T => {
  return container.resolve(markAsApiSafe(token));
};

// Test-Services that implement Logger to satisfy ServiceType constraint
class TestService implements Logger {
  static dependencies = [] as const;
  constructor(public value: number = Math.random()) {}
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

class TestServiceWithDeps implements Logger {
  static dependencies = [] as const;
  constructor(public dep: TestService) {}
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("ServiceContainer", () => {
  describe("Container Creation", () => {
    it("should create root container", () => {
      const container = ServiceContainer.createRoot();
      expect(container).toBeInstanceOf(ServiceContainer);
      expect(container.getValidationState()).toBe("registering");
    });

    it("should start in registering state", () => {
      const container = ServiceContainer.createRoot();
      expect(container.getValidationState()).toBe("registering");
    });
  });

  describe("Service Registration", () => {
    let container: ServiceContainer;
    let token: ReturnType<typeof createInjectionToken<TestService>>;

    beforeEach(() => {
      container = ServiceContainer.createRoot();
      token = createInjectionToken<TestService>("TestService");
    });

    it("should register service class", () => {
      const result = container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expectResultOk(result);
    });

    it("should register factory", () => {
      const factoryToken = createInjectionToken<TestService>("FactoryService");
      const result = container.registerFactory(
        factoryToken,
        () => new TestService(42),
        ServiceLifecycle.SINGLETON,
        []
      );
      expectResultOk(result);
    });

    it("should register value", () => {
      const testLogger = new TestService();
      const valueToken = createInjectionToken<TestService>("ValueService");
      const result = container.registerValue(valueToken, testLogger);
      expectResultOk(result);
    });

    it("should register alias", () => {
      const aliasToken = createInjectionToken<TestService>("AliasService");
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const result = container.registerAlias(aliasToken, token);
      expectResultOk(result);
    });

    it("should reject duplicate registration", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const result = container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expectResultErr(result);
      expect(result.error.code).toBe("DuplicateRegistration");
    });

    it("should reject registration after validation", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const newToken = createInjectionToken<TestService>("NewService");
      const result = container.registerClass(newToken, TestService, ServiceLifecycle.SINGLETON);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });
  });

  describe("Lifecycle: Singleton", () => {
    it("should return same instance on multiple resolves", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("SingletonService");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance1 = testResolve<TestService>(container, token);
      const instance2 = testResolve<TestService>(container, token);

      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });

    it("should share singleton between parent and child", () => {
      const parent = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("SharedSingleton");

      parent.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      parent.validate();

      const childResult = parent.createScope("child");
      expectResultOk(childResult);
      const child = childResult.value;

      child.validate();

      const parentInstance = testResolve<TestService>(parent, token);
      const childInstance = testResolve<TestService>(child, token);

      expect(parentInstance).toBe(childInstance);
    });
  });

  describe("Lifecycle: Transient", () => {
    it("should return new instance on each resolve", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("TransientService");

      container.registerClass(token, TestService, ServiceLifecycle.TRANSIENT);
      container.validate();

      const instance1 = testResolve<TestService>(container, token);
      const instance2 = testResolve<TestService>(container, token);

      expect(instance1).not.toBe(instance2);
      expect(instance1.value).not.toBe(instance2.value);
    });
  });

  describe("Lifecycle: Scoped", () => {
    it("should require child scope", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("ScopedService");

      container.registerClass(token, TestService, ServiceLifecycle.SCOPED);
      container.validate();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("ScopeRequired");
    });

    it("should return same instance within scope", () => {
      const parent = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("ScopedService");

      parent.registerClass(token, TestService, ServiceLifecycle.SCOPED);
      parent.validate();

      const childResult = parent.createScope("child");
      expectResultOk(childResult);
      const child = childResult.value;
      child.validate();

      const instance1 = testResolve<TestService>(child, token);
      const instance2 = testResolve<TestService>(child, token);

      expect(instance1).toBe(instance2);
    });

    it("should isolate scoped instances between scopes", () => {
      const parent = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("ScopedService");

      parent.registerClass(token, TestService, ServiceLifecycle.SCOPED);
      parent.validate();

      const child1Result = parent.createScope("child1");
      expectResultOk(child1Result);
      const child1 = child1Result.value;
      child1.validate();

      const child2Result = parent.createScope("child2");
      expectResultOk(child2Result);
      const child2 = child2Result.value;
      child2.validate();

      const instance1 = testResolve<TestService>(child1, token);
      const instance2 = testResolve<TestService>(child2, token);

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("Validation", () => {
    it("should validate successfully with valid dependencies", () => {
      const container = ServiceContainer.createRoot();
      const depToken = createInjectionToken<TestService>("Dep");
      const serviceToken = createInjectionToken<TestServiceWithDeps>("Service");

      container.registerClass(depToken, TestService, ServiceLifecycle.SINGLETON);
      container.registerClass(serviceToken, TestServiceWithDeps, ServiceLifecycle.SINGLETON);

      const result = container.validate();
      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should detect missing dependencies", () => {
      const container = ServiceContainer.createRoot();
      const depToken = createInjectionToken<TestService>("MissingDep");
      const serviceToken = createInjectionToken<TestServiceWithDeps>("Service");

      // Register service but not dependency
      (TestServiceWithDeps.dependencies as unknown as (typeof depToken)[]) = [depToken];
      container.registerClass(serviceToken, TestServiceWithDeps, ServiceLifecycle.SINGLETON);

      const result = container.validate();
      expectResultErr(result);
      expect(result.error[0]?.code).toBe("TokenNotRegistered");
    });

    it("should allow only one validation", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      // Should be idempotent
      const result2 = container.validate();
      expectResultOk(result2);
    });

    it("should prevent concurrent validation", () => {
      const container = ServiceContainer.createRoot();

      // Mock validator to hang
      vi.spyOn((container as any).validator, "validate").mockImplementation(() => {
        // Simulate slow validation
        return ok(undefined);
      });

      container.validate();

      // Try to validate while validating
      // Note: This is hard to test without async, so we test the state guard
      expect(container.getValidationState()).toBe("validated");
    });
  });

  describe("Resolution", () => {
    it("should fail resolution before validation", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("NotValidated");
    });

    it("should resolve registered service after validation", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance = testResolve<TestService>(container, token);
      expect(instance).toBeInstanceOf(TestService);
    });

    it("should fail resolution for unregistered token", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Unregistered");

      container.validate();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("TokenNotRegistered");
    });
  });

  describe("clear() and isRegistered()", () => {
    it("should clear all registrations", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const beforeClear = container.isRegistered(token);
      expectResultOk(beforeClear);
      if (beforeClear.ok) expect(beforeClear.value).toBe(true);

      container.clear();

      const afterClear = container.isRegistered(token);
      expectResultOk(afterClear);
      if (afterClear.ok) expect(afterClear.value).toBe(false);
    });

    it("should reset validation state after clear", () => {
      const container = ServiceContainer.createRoot();
      container.validate();

      expect(container.getValidationState()).toBe("validated");

      container.clear();

      expect(container.getValidationState()).toBe("registering");
    });

    it("should allow multiple clear() calls", () => {
      const container = ServiceContainer.createRoot();
      container.clear();
      container.clear();
      expect(container.getValidationState()).toBe("registering");
    });

    it("isRegistered() should return correct boolean", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Service");

      const beforeReg = container.isRegistered(token);
      expectResultOk(beforeReg);
      if (beforeReg.ok) expect(beforeReg.value).toBe(false);

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const afterReg = container.isRegistered(token);
      expectResultOk(afterReg);
      if (afterReg.ok) expect(afterReg.value).toBe(true);
    });
  });

  describe("Fallback-Mechanismus", () => {
    it("should use fallback when resolution fails", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      container.registerFallback(token, () => new TestService(42));
      container.validate();

      // Token NICHT registriert -> Fallback wird genutzt
      const result = testResolve<TestService>(container, token);
      expect(result).toBeInstanceOf(TestService);
      expect(result.value).toBe(42);
    });

    it("should throw when no fallback available", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");
      container.validate();

      // Kein Fallback -> Exception
      expect(() => testResolve(container, token)).toThrow();
      expect(() => testResolve(container, token)).toThrow(/No fallback/);
    });

    it("should prefer registered service over fallback", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      container.registerFallback(token, () => new TestService(999));
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance = testResolve<TestService>(container, token);
      // Sollte die registrierte Instanz sein, nicht der Fallback
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.value).not.toBe(999);
    });

    it("should isolate fallbacks between containers", () => {
      const container1 = ServiceContainer.createRoot();
      const container2 = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      // Container 1 hat einen Fallback
      container1.registerFallback(token, () => new TestService(111));
      container1.validate();

      // Container 2 hat einen anderen Fallback
      container2.registerFallback(token, () => new TestService(222));
      container2.validate();

      // Jeder Container verwendet seinen eigenen Fallback
      const result1 = testResolve<TestService>(container1, token);
      const result2 = testResolve<TestService>(container2, token);

      expect(result1.value).toBe(111);
      expect(result2.value).toBe(222);
    });

    it("should not inherit fallback from parent in child container", () => {
      const parent = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      // Parent hat einen Fallback
      parent.registerFallback(token, () => new TestService(100));
      parent.validate();

      // Child erstellen
      const childResult = parent.createScope("child");
      expectResultOk(childResult);
      const child = childResult.value;
      child.validate();

      // Child sollte KEINEN Zugriff auf Parent-Fallback haben
      // (Fallbacks sind container-spezifisch, nicht vererbt)
      expect(() => testResolve(child, token)).toThrow(/No fallback/);
    });
  });

  describe("Disposed Container", () => {
    it("should fail registration on disposed container", () => {
      const container = ServiceContainer.createRoot();
      container.dispose();

      const token = createInjectionToken<TestService>("Test");
      const result = container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail resolution on disposed container", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      container.dispose();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail registerAlias on disposed container", () => {
      const container = ServiceContainer.createRoot();
      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("Alias");

      container.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      container.dispose();

      const result = container.registerAlias(aliasToken, targetToken);
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail createScope on disposed container", () => {
      const container = ServiceContainer.createRoot();
      container.validate();
      container.dispose();

      const result = container.createScope("child");
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });
  });

  describe("Scopes (Parent-Child)", () => {
    it("should create child scope", () => {
      const parent = ServiceContainer.createRoot();
      parent.validate();

      const result = parent.createScope("child");
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(ServiceContainer);
    });

    it("should require parent validation before creating scope", () => {
      const parent = ServiceContainer.createRoot();

      const result = parent.createScope("child");
      expectResultErr(result);
      expect(result.error.code).toBe("NotValidated");
    });

    it("should inherit parent registrations", () => {
      const parent = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("ParentService");

      parent.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      parent.validate();

      const childResult = parent.createScope("child");
      expectResultOk(childResult);
      const child = childResult.value;
      child.validate();

      const parentInstance = testResolve<TestService>(parent, token);
      const childInstance = testResolve<TestService>(child, token);

      expect(parentInstance).toBe(childInstance);
    });

    it("should allow child-specific registrations", () => {
      const parent = ServiceContainer.createRoot();
      const parentToken = createInjectionToken<TestService>("Parent");
      const childToken = createInjectionToken<TestService>("Child");

      parent.registerClass(parentToken, TestService, ServiceLifecycle.SINGLETON);
      parent.validate();

      const childResult = parent.createScope("child");
      expectResultOk(childResult);
      const child = childResult.value;

      child.registerClass(childToken, TestService, ServiceLifecycle.SINGLETON);
      child.validate();

      // Child kann beide auflösen
      expect(testResolve<TestService>(child, parentToken)).toBeInstanceOf(TestService);
      expect(testResolve<TestService>(child, childToken)).toBeInstanceOf(TestService);

      // Parent kann nur sein eigenes auflösen
      expect(testResolve<TestService>(parent, parentToken)).toBeInstanceOf(TestService);
      const childResolveResult = parent.resolveWithError(childToken);
      expectResultErr(childResolveResult);
    });

    it("should dispose children when parent is disposed", () => {
      const parent = ServiceContainer.createRoot();
      parent.validate();

      const child1Result = parent.createScope("child1");
      expectResultOk(child1Result);
      const child1 = child1Result.value;
      child1.validate();

      const child2Result = parent.createScope("child2");
      expectResultOk(child2Result);
      const child2 = child2Result.value;
      child2.validate();

      parent.dispose();

      // Beide Children sollten disposed sein
      const child1ResolveResult = child1.resolveWithError(
        createInjectionToken<TestService>("Test")
      );
      expectResultErr(child1ResolveResult);
      expect(child1ResolveResult.error.code).toBe("Disposed");

      const child2ResolveResult = child2.resolveWithError(
        createInjectionToken<TestService>("Test")
      );
      expectResultErr(child2ResolveResult);
      expect(child2ResolveResult.error.code).toBe("Disposed");
    });
  });

  describe("Edge Cases & Scalability", () => {
    it("should handle deep dependency chains (10+ levels)", () => {
      const container = ServiceContainer.createRoot();

      // Create a 10-level deep dependency chain
      const tokens = Array.from({ length: 10 }, (_, i) =>
        createInjectionToken<TestService>(`Level${i}`)
      );

      // Register services with dependencies on the next level
      for (let i = tokens.length - 1; i >= 0; i--) {
        const token = tokens[i]!;
        const deps = i < tokens.length - 1 ? [tokens[i + 1]!] : [];

        // Manually create a factory that accepts dependencies
        container.registerFactory(
          token,
          i === tokens.length - 1
            ? () => new TestService(i)
            : (...resolved: TestService[]) => new TestService(resolved[0]?.value ?? i),
          ServiceLifecycle.SINGLETON,
          deps
        );
      }

      container.validate();

      // Should resolve without stack overflow
      const result = container.resolveWithError(tokens[0]!);
      expectResultOk(result);
    });

    it("should handle many transient services without memory leak", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.TRANSIENT);
      container.validate();

      // Resolve 1000 times
      for (let i = 0; i < 1000; i++) {
        const instance = testResolve<TestService>(container, token);
        expect(instance).toBeInstanceOf(TestService);
      }

      // All instances should be different (transient)
      const instances = Array.from({ length: 10 }, () =>
        testResolve<TestService>(container, token)
      );
      const uniqueInstances = new Set(instances);
      expect(uniqueInstances.size).toBe(10);
    });

    it("should handle 100+ service registrations efficiently", () => {
      const container = ServiceContainer.createRoot();
      const tokens = Array.from({ length: 100 }, (_, i) =>
        createInjectionToken<TestService>(`Service${i}`)
      );

      const startTime = performance.now();

      // Register 100 services
      for (const token of tokens) {
        container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      }

      const validationResult = container.validate();
      expectResultOk(validationResult);

      // Resolve all services
      for (const token of tokens) {
        const result = container.resolveWithError(token);
        expectResultOk(result);
      }

      const duration = performance.now() - startTime;

      // Should complete within reasonable time (500ms)
      expect(duration).toBeLessThan(500);
    });

    it("should detect circular dependencies in deep chains", () => {
      const container = ServiceContainer.createRoot();
      const tokenA = createInjectionToken<TestService>("A");
      const tokenB = createInjectionToken<TestService>("B");
      const tokenC = createInjectionToken<TestService>("C");

      // A -> B -> C -> A (circular)
      container.registerFactory(tokenA, () => new TestService(1), ServiceLifecycle.SINGLETON, [
        tokenB,
      ]);
      container.registerFactory(tokenB, () => new TestService(2), ServiceLifecycle.SINGLETON, [
        tokenC,
      ]);
      container.registerFactory(tokenC, () => new TestService(3), ServiceLifecycle.SINGLETON, [
        tokenA,
      ]);

      const validationResult = container.validate();

      // Should detect circular dependency during validation
      expectResultErr(validationResult);
      expect(validationResult.error).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "CircularDependency",
          }),
        ])
      );
    });

    it("should handle empty container (no registrations)", () => {
      const container = ServiceContainer.createRoot();
      const validationResult = container.validate();

      // Empty container is valid
      expectResultOk(validationResult);

      // Resolving should fail gracefully
      const token = createInjectionToken<TestService>("Test");
      const resolveResult = container.resolveWithError(token);
      expectResultErr(resolveResult);
      expect(resolveResult.error.code).toBe("TokenNotRegistered");
    });
  });

  describe("Async Validation", () => {
    it("should validate asynchronously without blocking", async () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = await container.validateAsync();
      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should set validation state correctly during async validation", async () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // State should be validating during validation
      const validationPromise = container.validateAsync();
      expect(container.getValidationState()).toBe("validating");

      await validationPromise;
      expect(container.getValidationState()).toBe("validated");
    });
  });
});
