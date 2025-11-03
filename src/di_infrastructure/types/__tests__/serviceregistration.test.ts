import { describe, it, expect } from "vitest";
import { ServiceRegistration } from "../serviceregistration";
import { ServiceLifecycle } from "../servicelifecycle";
import { createInjectionToken } from "../../tokenutilities";
import type { Logger } from "@/interfaces/logger";

class TestService implements Logger {
  static dependencies = [] as const;
  log(): void {}
  error(): void {}
  warn(): void {}
  info(): void {}
  debug(): void {}
}

describe("ServiceRegistration", () => {
  describe("createClass() Factory Method", () => {
    it("should create valid class registration", () => {
      const result = ServiceRegistration.createClass(ServiceLifecycle.SINGLETON, [], TestService);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerType).toBe("class");
        expect(result.value.serviceClass).toBe(TestService);
        expect(result.value.lifecycle).toBe(ServiceLifecycle.SINGLETON);
      }
    });

    it("should fail when serviceClass is undefined", () => {
      const result = ServiceRegistration.createClass(
        ServiceLifecycle.SINGLETON,
        [],
        undefined as any
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("serviceClass is required");
      }
    });
  });

  describe("createFactory() Factory Method", () => {
    it("should create valid factory registration", () => {
      const factory = () => new TestService();
      const result = ServiceRegistration.createFactory(ServiceLifecycle.TRANSIENT, [], factory);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerType).toBe("factory");
        expect(result.value.factory).toBe(factory);
        expect(result.value.lifecycle).toBe(ServiceLifecycle.TRANSIENT);
      }
    });

    it("should fail when factory is undefined", () => {
      const result = ServiceRegistration.createFactory(
        ServiceLifecycle.SINGLETON,
        [],
        undefined as any
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("factory is required");
      }
    });
  });

  describe("createValue() Factory Method", () => {
    it("should create valid value registration", () => {
      const value = new TestService();
      const result = ServiceRegistration.createValue(value);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerType).toBe("value");
        expect(result.value.value).toBeInstanceOf(TestService);
        expect(result.value.lifecycle).toBe(ServiceLifecycle.SINGLETON);
      }
    });

    it("should fail when value is undefined", () => {
      const result = ServiceRegistration.createValue(undefined as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("value cannot be undefined");
      }
    });

    it("should fail when value is a function", () => {
      const result = ServiceRegistration.createValue((() => {}) as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("only accepts plain values");
      }
    });
  });

  describe("createAlias() Factory Method", () => {
    it("should create valid alias registration", () => {
      const targetToken = createInjectionToken<Logger>("Target");
      const result = ServiceRegistration.createAlias(targetToken);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerType).toBe("alias");
        expect(result.value.aliasTarget).toBe(targetToken);
        expect(result.value.lifecycle).toBe(ServiceLifecycle.SINGLETON);
        expect(result.value.dependencies).toContain(targetToken);
      }
    });

    it("should fail when targetToken is undefined", () => {
      const result = ServiceRegistration.createAlias(undefined as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("InvalidOperation");
        expect(result.error.message).toContain("targetToken is required");
      }
    });
  });

  describe("clone()", () => {
    it("should create independent clone with same values", () => {
      const token = createInjectionToken<Logger>("Test");
      const result = ServiceRegistration.createClass(
        ServiceLifecycle.SINGLETON,
        [token],
        TestService
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        const original = result.value;
        const cloned = original.clone();

        expect(cloned.lifecycle).toBe(original.lifecycle);
        expect(cloned.providerType).toBe(original.providerType);
        expect(cloned.serviceClass).toBe(original.serviceClass);
        expect(cloned.dependencies).toEqual(original.dependencies);
        expect(cloned.dependencies).not.toBe(original.dependencies); // Different array instance
      }
    });

    it("should clone factory registration", () => {
      const factory = () => new TestService();
      const result = ServiceRegistration.createFactory(ServiceLifecycle.TRANSIENT, [], factory);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const original = result.value;
        const cloned = original.clone();

        expect(cloned.factory).toBe(factory);
        expect(cloned.lifecycle).toBe(ServiceLifecycle.TRANSIENT);
      }
    });
  });
});
