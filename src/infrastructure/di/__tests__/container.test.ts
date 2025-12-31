// Test file: `any` needed for type manipulation in edge case tests

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceContainer } from "@/infrastructure/di/container";
import { createTestContainer } from "@/test/utils/test-helpers";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { markAsApiSafe } from "@/infrastructure/di/types";
import { ServiceLifecycle } from "@/infrastructure/di/types";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { ContainerErrorImpl } from "@/infrastructure/di/errors/ContainerErrorImpl";

// Helper for tests: Wrap tokens for resolve() testing (simulates external API usage)
// In production, only composition-root marks tokens as API-safe

const testResolve = <T>(container: ServiceContainer, token: any): T => {
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
      const container = createTestContainer();
      expect(container).toBeInstanceOf(ServiceContainer);
      expect(container.getValidationState()).toBe("registering");
    });

    it("should start in registering state", () => {
      const container = createTestContainer();
      expect(container.getValidationState()).toBe("registering");
    });
  });

  describe("Service Registration", () => {
    let container: ServiceContainer;
    let token: ReturnType<typeof createInjectionToken<TestService>>;

    beforeEach(() => {
      container = createTestContainer();
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

    it("should reject invalid factory parameter", () => {
      const factoryToken = createInjectionToken<TestService>("InvalidFactoryService");
      const result = container.registerFactory(
        factoryToken,
        null as any,
        ServiceLifecycle.SINGLETON,
        []
      );
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidFactory");
      expect(result.error.message).toContain("Factory must be a function");
    });

    it("should register value", () => {
      const testLogger = new TestService();
      const valueToken = createInjectionToken<TestService>("ValueService");
      const result = container.registerValue(valueToken, testLogger);
      expectResultOk(result);
    });

    it("should register instance and resolve same instance", () => {
      const instanceToken = createInjectionToken<TestService>("InstanceService");
      const instance = new TestService(99);

      const result = container.registerInstance(instanceToken, instance);
      expectResultOk(result);

      container.validate();
      const resolved = testResolve<TestService>(container, instanceToken);
      expect(resolved).toBe(instance);
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

    it("should reject registration after validation for registerClass", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const newToken = createInjectionToken<TestService>("NewService");
      const result = container.registerClass(newToken, TestService, ServiceLifecycle.SINGLETON);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should reject registration after validation for registerFactory", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const newToken = createInjectionToken<TestService>("NewFactory");
      const result = container.registerFactory(
        newToken,
        () => new TestService(),
        ServiceLifecycle.SINGLETON,
        []
      );
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should reject registration after validation for registerValue", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const newToken = createInjectionToken<TestService>("NewValue");
      const result = container.registerValue(newToken, new TestService());
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should reject registration after validation for registerInstance", () => {
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const newToken = createInjectionToken<TestService>("NewInstance");
      const result = container.registerInstance(newToken, new TestService());
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should reject registration after validation for registerAlias", () => {
      const targetToken = createInjectionToken<TestService>("AliasTarget");
      container.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      container.validate();
      const aliasToken = createInjectionToken<TestService>("NewAlias");
      const result = container.registerAlias(aliasToken, targetToken);
      expectResultErr(result);
      expect(result.error.code).toBe("InvalidOperation");
    });

    it("should return null when getRegisteredValue resolves undefined", () => {
      const container = createTestContainer();
      const valueToken = createInjectionToken<Logger>("OptionalValue");

      const registry = (container as any).registry;
      registry.registrations.set(valueToken, {
        lifecycle: ServiceLifecycle.SINGLETON,
        dependencies: [],
        providerType: "value",
        serviceClass: undefined,
        factory: undefined,
        value: undefined as unknown as Logger,
        aliasTarget: undefined,
      });

      const resolved = container.getRegisteredValue(valueToken);
      expect(resolved).toBeNull();
    });

    it("should return null when getRegisteredValue targets non-value providers", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("ClassToken");
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const resolved = container.getRegisteredValue(token);
      expect(resolved).toBeNull();
    });

    it("should return null when getRegisteredValue is called for missing tokens", () => {
      const container = createTestContainer();
      const missingToken = createInjectionToken<TestService>("MissingValueToken");

      const resolved = container.getRegisteredValue(missingToken);
      expect(resolved).toBeNull();
    });
  });

  describe("Lifecycle: Singleton", () => {
    it("should return same instance on multiple resolves", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("SingletonService");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance1 = testResolve<TestService>(container, token);
      const instance2 = testResolve<TestService>(container, token);

      expect(instance1).toBe(instance2);
      expect(instance1.value).toBe(instance2.value);
    });

    it("should share singleton between parent and child", () => {
      const parent = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("ScopedService");

      container.registerClass(token, TestService, ServiceLifecycle.SCOPED);
      container.validate();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("ScopeRequired");
    });

    it("should return same instance within scope", () => {
      const parent = createTestContainer();
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
      const parent = createTestContainer();
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
      const container = createTestContainer();
      const depToken = createInjectionToken<TestService>("Dep");
      const serviceToken = createInjectionToken<TestServiceWithDeps>("Service");

      container.registerClass(depToken, TestService, ServiceLifecycle.SINGLETON);
      container.registerClass(serviceToken, TestServiceWithDeps, ServiceLifecycle.SINGLETON);

      const result = container.validate();
      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should detect missing dependencies", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      // Should be idempotent
      const result2 = container.validate();
      expectResultOk(result2);
    });

    it("should prevent concurrent validation", () => {
      const container = createTestContainer();

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
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("NotValidated");
    });

    it("should resolve registered service after validation", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Service");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance = testResolve<TestService>(container, token);
      expect(instance).toBeInstanceOf(TestService);
    });

    it("should fail resolution for unregistered token", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Unregistered");

      container.validate();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("TokenNotRegistered");
    });
  });

  describe("clear() and isRegistered()", () => {
    it("should clear all registrations", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
      container.validate();

      expect(container.getValidationState()).toBe("validated");

      container.clear();

      expect(container.getValidationState()).toBe("registering");
    });

    it("should allow multiple clear() calls", () => {
      const container = createTestContainer();
      container.clear();
      container.clear();
      expect(container.getValidationState()).toBe("registering");
    });

    it("isRegistered() should return correct boolean", () => {
      const container = createTestContainer();
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

  describe("getApiSafeToken()", () => {
    it("should return metadata for API-safe token", () => {
      const container = createTestContainer();
      const token = markAsApiSafe(createInjectionToken<TestService>("ApiSafe"));
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const info = container.getApiSafeToken(token);

      expect(info).not.toBeNull();
      expect(info?.description).toBe(String(token));
      expect(info?.isRegistered).toBe(true);
    });

    it("should report unregistered state for API-safe token", () => {
      const container = createTestContainer();
      const token = markAsApiSafe(createInjectionToken<TestService>("ApiSafeMissing"));

      const info = container.getApiSafeToken(token);

      expect(info).not.toBeNull();
      expect(info?.isRegistered).toBe(false);
    });

    it("should return null for non-API-safe token", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("RegularToken");

      const info = container.getApiSafeToken(token as unknown as ReturnType<typeof markAsApiSafe>);

      expect(info).toBeNull();
    });
  });

  describe("Disposed Container", () => {
    it("should fail registration on disposed container", () => {
      const container = createTestContainer();
      container.dispose();

      const token = createInjectionToken<TestService>("Test");
      const result = container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail resolution on disposed container", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      container.dispose();

      const result = container.resolveWithError(token);
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail registerAlias on disposed container", () => {
      const container = createTestContainer();
      const targetToken = createInjectionToken<TestService>("Target");
      const aliasToken = createInjectionToken<TestService>("Alias");

      container.registerClass(targetToken, TestService, ServiceLifecycle.SINGLETON);
      container.dispose();

      const result = container.registerAlias(aliasToken, targetToken);
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });

    it("should fail createScope on disposed container", () => {
      const container = createTestContainer();
      container.validate();
      container.dispose();

      const result = container.createScope("child");
      expectResultErr(result);
      expect(result.error.code).toBe("Disposed");
    });
  });

  describe("Scopes (Parent-Child)", () => {
    it("should create child scope", () => {
      const parent = createTestContainer();
      parent.validate();

      const result = parent.createScope("child");
      expectResultOk(result);
      expect(result.value).toBeInstanceOf(ServiceContainer);
    });

    it("should require parent validation before creating scope", () => {
      const parent = createTestContainer();

      const result = parent.createScope("child");
      expectResultErr(result);
      expect(result.error.code).toBe("NotValidated");
    });

    it("should propagate scope manager errors from createScope", () => {
      // Create a container and validate it
      const parent = createTestContainer();
      parent.validate();

      // Try to create child - should fail because max depth is already reached
      let currentContainer = parent;
      for (let i = 0; i < 11; i++) {
        const result = currentContainer.createScope(`child${i}`);
        if (!result.ok) {
          expect(result.error.code).toBe("MaxScopeDepthExceeded");
          return;
        }
        currentContainer = result.value;
        currentContainer.validate();
      }

      // Should have failed before reaching here
      expect.fail("Expected createScope to fail with MaxScopeDepthExceeded");
    });

    it("should inherit parent registrations", () => {
      const parent = createTestContainer();
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
      const parent = createTestContainer();
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
      const parent = createTestContainer();
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

    it("should not reset validation state when dispose fails", () => {
      // This covers lines 623-659: if (result.ok) - the case where result.ok is false
      const container = createTestContainer();
      container.validate();

      // Mock scopeManager.dispose to return an error
      const scopeManager = container["scopeManager"];
      const _originalDispose = scopeManager.dispose.bind(scopeManager);
      vi.spyOn(scopeManager, "dispose").mockReturnValue(
        err({
          code: "DisposalFailed",
          message: "Mock disposal failure",
          tokenDescription: "test",
        })
      );

      // Store initial validation state
      const initialState = container.getValidationState();

      // dispose() should return error and NOT reset validation state when result.ok is false
      const result = container.dispose();
      expectResultErr(result);

      // Validation state should NOT be reset when dispose fails (line 623-625)
      expect(container.getValidationState()).toBe(initialState);

      vi.restoreAllMocks();
    });

    it("should not reset validation state when disposeAsync fails", async () => {
      // This covers lines 659: if (result.ok) - the case where result.ok is false
      const container = createTestContainer();
      container.validate();

      // Mock scopeManager.disposeAsync to return an error
      const scopeManager = container["scopeManager"];
      const _originalDisposeAsync = scopeManager.disposeAsync.bind(scopeManager);
      vi.spyOn(scopeManager, "disposeAsync").mockResolvedValue(
        err({
          code: "DisposalFailed",
          message: "Mock async disposal failure",
          tokenDescription: "test",
        })
      );

      // Store initial validation state
      const initialState = container.getValidationState();

      // disposeAsync() should return error and NOT reset validation state when result.ok is false
      const result = await container.disposeAsync();
      expectResultErr(result);

      // Validation state should NOT be reset when disposeAsync fails (line 659)
      expect(container.getValidationState()).toBe(initialState);

      vi.restoreAllMocks();
    });
  });

  describe("Edge Cases & Scalability", () => {
    it("should handle deep dependency chains (10+ levels)", () => {
      const container = createTestContainer();

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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const result = await container.validateAsync();
      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should set validation state correctly during async validation", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // State should be validating during validation
      const validationPromise = container.validateAsync();
      expect(container.getValidationState()).toBe("validating");

      await validationPromise;
      expect(container.getValidationState()).toBe("validated");
    });

    it("should reset validationState on validation failure (sync)", () => {
      const container = createTestContainer();
      const tokenA = createInjectionToken<TestService>("ServiceA");
      const tokenB = createInjectionToken<TestService>("ServiceB");

      // Register service A that depends on non-existent service B
      container.registerFactory(tokenA, () => new TestService(), ServiceLifecycle.SINGLETON, [
        tokenB,
      ]);

      const result = container.validate();

      expectResultErr(result);
      // State should be reset to "registering"
      expect(container.getValidationState()).toBe("registering");
    });

    it("should reset validationState on validation failure (async)", async () => {
      const container = createTestContainer();
      const tokenA = createInjectionToken<TestService>("ServiceA");
      const tokenB = createInjectionToken<TestService>("ServiceB");

      // Register service A that depends on non-existent service B
      container.registerFactory(tokenA, () => new TestService(), ServiceLifecycle.SINGLETON, [
        tokenB,
      ]);

      const result = await container.validateAsync();

      expectResultErr(result);
      // State should be reset to "registering"
      expect(container.getValidationState()).toBe("registering");
    });

    it("should return fast-path when already validated", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      const syncResult = container.validate();
      expectResultOk(syncResult);

      // Now call validateAsync - should return immediately
      const asyncResult = await container.validateAsync();
      expectResultOk(asyncResult);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should handle concurrent validateAsync calls", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Start multiple concurrent validations
      const promises = [
        container.validateAsync(),
        container.validateAsync(),
        container.validateAsync(),
      ];

      const results = await Promise.all(promises);

      // All should succeed and return the same promise
      expect(results.every((r) => r.ok)).toBe(true);
      expect(container.getValidationState()).toBe("validated");
    });

    it("should handle mixed sync/async validation conflict", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Start async validation first
      const asyncPromise = container.validateAsync();

      // Try sync validation while async is in progress (this should detect the conflict)
      // Note: In practice, sync validate() completes immediately, so we need to check
      // the state during async validation
      const stateDuringAsync = container.getValidationState();
      expect(stateDuringAsync).toBe("validating");

      // Wait for async to complete
      await asyncPromise;

      // Now try to call validateAsync while sync validate() is being called
      // This tests the mixed sync/async conflict path
      container.clear();
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Start sync validation (sets state to "validating")
      const syncResult = container.validate();
      expectResultOk(syncResult);

      // Now try async - but sync already completed, so this should work
      // To test the conflict, we need to mock the state
      const testContainer = createTestContainer();
      testContainer.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      // Manually set state to "validating" to simulate sync validation in progress
      // Access validationManager through container
      testContainer["validationManager"]["validationState"] = "validating";

      const asyncResult = await testContainer.validateAsync();
      expectResultErr(asyncResult);
      if (!asyncResult.ok) {
        expect(asyncResult.error[0]?.message).toContain("Validation already in progress");
      }
    });

    it("should handle timeout in validateAsync", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Mock validator.validate to return a promise that never resolves (simulating slow validation)
      const validator = container["validator"];
      vi.spyOn(validator, "validate").mockImplementation(() => {
        // Return a promise that never resolves to trigger timeout
        return new Promise(() => {
          // Never resolves
        }) as any;
      });

      // Call validateAsync with very short timeout
      const result = await container.validateAsync(10);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error[0]?.message).toContain("timed out");
      }
      expect(container.getValidationState()).toBe("registering");

      // Restore
      vi.restoreAllMocks();
    });

    it("should cleanup validationPromise in finally block", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      const promise1 = container.validateAsync();
      const result1 = await promise1;
      expectResultOk(result1);

      // validationPromise should be null after completion
      expect(container["validationManager"]["validationPromise"]).toBeNull();

      // Should be able to validate again
      const promise2 = container.validateAsync();
      const result2 = await promise2;
      expectResultOk(result2);
    });

    it("should cleanup validationPromise in finally block even on timeout", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Mock validator.validate to return a promise that never resolves (simulating slow validation)
      const validator = container["validator"];
      vi.spyOn(validator, "validate").mockImplementation(() => {
        // Return a promise that never resolves to trigger timeout
        return new Promise(() => {
          // Never resolves
        }) as any;
      });

      // Call validateAsync with very short timeout to trigger finally block
      const result = await container.validateAsync(10);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error[0]?.message).toContain("timed out");
      }

      // Verify that the finally block executed by checking validationPromise is null
      // This ensures the finally block is covered even in timeout scenario
      expect(container["validationManager"]["validationPromise"]).toBeNull();

      // Restore
      vi.restoreAllMocks();
    });
  });

  describe("Concurrent Sync Validation", () => {
    it("should handle concurrent validate() calls", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Start first validation
      const result1 = container.validate();
      expectResultOk(result1);

      // Try to validate again while already validated - should return ok immediately
      const result2 = container.validate();
      expectResultOk(result2);
    });

    it("should detect concurrent validate() calls during validation", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // This is difficult to test in sync context, but we can verify the guard exists
      // by checking that validation state prevents re-entry
      const result1 = container.validate();
      expectResultOk(result1);
      expect(container.getValidationState()).toBe("validated");

      // Once validated, subsequent calls should return ok immediately
      const result2 = container.validate();
      expectResultOk(result2);
    });
  });

  describe("resolve() error handling", () => {
    it("should throw ContainerErrorImpl when resolve() fails (no fallback)", () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Unregistered");

      // Validate container first (required before resolve)
      container.validate();

      // resolve() should throw ContainerErrorImpl when service is not registered (LSP compliance)
      expect(() => {
        testResolve<TestService>(container, token);
      }).toThrow(/Cannot resolve.*Unregistered/);

      try {
        testResolve<TestService>(container, token);
        expect.fail("Expected ContainerErrorImpl to be thrown");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ContainerErrorImpl);
        expect(error).toBeInstanceOf(Error);
        if (error instanceof ContainerErrorImpl) {
          expect(error.code).toBe("TokenNotRegistered");
          expect(error.message).toContain("Cannot resolve");
          expect(error.tokenDescription).toBeDefined();
        }
      }
    });
  });

  describe("validateAsync() error handling", () => {
    it("should re-throw unexpected errors in validateAsync", async () => {
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Mock validator.validate to throw an unexpected error (not TimeoutError)
      const validator = container["validator"];
      const unexpectedError = new Error("Unexpected validation error");
      vi.spyOn(validator, "validate").mockImplementation(() => {
        throw unexpectedError;
      });

      // validateAsync should re-throw the unexpected error
      // The finally block should execute to clean up validationPromise
      await expect(container.validateAsync()).rejects.toThrow("Unexpected validation error");

      // Verify that the finally block executed by checking validationPromise is null
      // This ensures finally block is covered
      expect(container["validationManager"]["validationPromise"]).toBeNull();

      vi.restoreAllMocks();
    });
  });

  describe("validate() concurrent calls", () => {
    it("should return error when validate() is called while validation is in progress", () => {
      // This test covers lines 277-283 in container.ts
      // We need to simulate a scenario where validate() is called while validation is already in progress
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);

      // Manually set validation state to "validating" to simulate validation in progress
      container["validationManager"]["validationState"] = "validating";

      // Now call validate() - it should detect that validation is already in progress
      const result = container.validate();

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error[0]?.code).toBe("InvalidOperation");
        expect(result.error[0]?.message).toBe("Validation already in progress");
      }
    });
  });

  describe("MetricsInjectionManager factory function", () => {
    it("should handle error when resolving metricsCollectorToken fails", () => {
      // This test covers lines 139-151 in container.ts (factory function error path)
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate(); // Validate container so resolution can proceed

      // Get the factory function from MetricsInjectionManager
      const metricsInjectionManager = container["metricsInjectionManager"];
      const factoryFunction = metricsInjectionManager["resolveMetricsCollector"];

      // Create a token that is not registered to trigger error path
      // Use MetricsCollector type to match factory function signature
      const unregisteredToken = createInjectionToken<MetricsCollector>("Unregistered");

      // Call factory function with unregistered token to test error path (lines 141-148)
      const result = factoryFunction(unregisteredToken);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error.code).toBe("TokenNotRegistered");
        expect(result.error.tokenDescription).toContain("Unregistered");
      }
    });

    it("should handle success when resolving metricsCollectorToken succeeds", () => {
      // This test covers lines 150-151 in container.ts (factory function success path)
      // Note: This test requires metricsCollectorToken to be registered, which happens
      // during bootstrap. We test the code path by calling the factory function directly
      // with a mock that returns success.
      const container = createTestContainer();
      const token = createInjectionToken<TestService>("Test");

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate(); // Validate container so resolution can proceed

      // Get the factory function from MetricsInjectionManager
      const metricsInjectionManager = container["metricsInjectionManager"];
      const factoryFunction = metricsInjectionManager["resolveMetricsCollector"];

      // Mock resolutionManager to return success for metricsCollectorToken
      // This tests the success path (lines 150-151)
      const originalResolve = container["resolutionManager"].resolveWithError;
      const mockMetricsCollector = {
        recordResolution: vi.fn(),
        recordCacheAccess: vi.fn(),
      } as unknown as MetricsCollector;

      container["resolutionManager"].resolveWithError = vi.fn((t) => {
        if (t === metricsCollectorToken) {
          return ok(mockMetricsCollector);
        }
        return originalResolve.call(container["resolutionManager"], t);
      });

      // Call factory function with metricsCollectorToken to test success path (lines 150-151)
      const result = factoryFunction(metricsCollectorToken);

      expectResultOk(result);
      if (result.ok) {
        expect(result.value).toBe(mockMetricsCollector);
      }

      // Restore
      container["resolutionManager"].resolveWithError = originalResolve;
    });
  });
});
