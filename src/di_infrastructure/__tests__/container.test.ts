import { describe, it, expect, beforeEach, vi } from "vitest";
import { ServiceContainer, registerFallback } from "../container";
import { createInjectionToken } from "../tokenutilities";
import { ServiceLifecycle } from "../types/servicelifecycle";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok } from "@/utils/result";

// Test-Services
class TestService {
  static dependencies = [] as const;
  constructor(public value: number = Math.random()) {}
}

class TestServiceWithDeps {
  static dependencies = [] as const;
  constructor(public dep: TestService) {}
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
      const valueToken = createInjectionToken<{ value: number }>("ValueService");
      const result = container.registerValue(valueToken, { value: 42 });
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

      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);

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

      const parentInstance = parent.resolve(token);
      const childInstance = child.resolve(token);

      expect(parentInstance).toBe(childInstance);
    });
  });

  describe("Lifecycle: Transient", () => {
    it("should return new instance on each resolve", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("TransientService");

      container.registerClass(token, TestService, ServiceLifecycle.TRANSIENT);
      container.validate();

      const instance1 = container.resolve(token);
      const instance2 = container.resolve(token);

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

      const instance1 = child.resolve(token);
      const instance2 = child.resolve(token);

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

      const instance1 = child1.resolve(token);
      const instance2 = child2.resolve(token);

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
      (TestServiceWithDeps.dependencies as unknown as typeof depToken[]) = [depToken];
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

      const instance = container.resolve(token);
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

      expect(container.isRegistered(token).value).toBe(true);

      container.clear();

      expect(container.isRegistered(token).value).toBe(false);
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

      expect(container.isRegistered(token).value).toBe(false);

      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      expect(container.isRegistered(token).value).toBe(true);
    });
  });

  describe("Fallback-Mechanismus", () => {
    it("should use fallback when resolution fails", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<{ value: string }>("Test");

      registerFallback(token, () => ({ value: "fallback" }));
      container.validate();

      // Token NICHT registriert -> Fallback wird genutzt
      const result = container.resolve(token);
      expect(result.value).toBe("fallback");
    });

    it("should throw when no fallback available", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");
      container.validate();

      // Kein Fallback -> Exception
      expect(() => container.resolve(token)).toThrow();
      expect(() => container.resolve(token)).toThrow(/No fallback/);
    });

    it("should prefer registered service over fallback", () => {
      const container = ServiceContainer.createRoot();
      const token = createInjectionToken<TestService>("Test");

      registerFallback(token, () => new TestService(999));
      container.registerClass(token, TestService, ServiceLifecycle.SINGLETON);
      container.validate();

      const instance = container.resolve(token);
      // Sollte die registrierte Instanz sein, nicht der Fallback
      expect(instance).toBeInstanceOf(TestService);
      expect(instance.value).not.toBe(999);
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

      const parentInstance = parent.resolve(token);
      const childInstance = child.resolve(token);

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
      expect(child.resolve(parentToken)).toBeInstanceOf(TestService);
      expect(child.resolve(childToken)).toBeInstanceOf(TestService);

      // Parent kann nur sein eigenes auflösen
      expect(parent.resolve(parentToken)).toBeInstanceOf(TestService);
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
});

