import { describe, it, expect } from "vitest";
import { ServiceRegistration } from "../serviceregistration";
import { ServiceLifecycle } from "../servicelifecycle";
import { createInjectionToken } from "../../tokenutilities";

class TestService {
  static dependencies = [] as const;
}

describe("ServiceRegistration", () => {
  describe("Constructor Validation", () => {
    it("should create valid class registration", () => {
      const registration = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [],
        "class",
        TestService,
        undefined,
        undefined,
        undefined
      );

      expect(registration.providerType).toBe("class");
      expect(registration.serviceClass).toBe(TestService);
    });

    it("should create valid factory registration", () => {
      const factory = () => new TestService();
      const registration = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [],
        "factory",
        undefined,
        factory,
        undefined,
        undefined
      );

      expect(registration.providerType).toBe("factory");
      expect(registration.factory).toBe(factory);
    });

    it("should create valid value registration", () => {
      const value = { test: "value" };
      const registration = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [],
        "value",
        undefined,
        undefined,
        value,
        undefined
      );

      expect(registration.providerType).toBe("value");
      expect(registration.value).toBe(value);
    });

    it("should create valid alias registration", () => {
      const targetToken = createInjectionToken<TestService>("Target");
      const registration = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [targetToken],
        "alias",
        undefined,
        undefined,
        undefined,
        targetToken
      );

      expect(registration.providerType).toBe("alias");
      expect(registration.aliasTarget).toBe(targetToken);
    });

    it("should throw when no field is set", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "class",
          undefined,
          undefined,
          undefined,
          undefined
        );
      }).toThrow("exactly one");
    });

    it("should throw when multiple fields are set", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "class",
          TestService,
          () => new TestService(),
          undefined,
          undefined
        );
      }).toThrow("exactly one");
    });

    it("should throw when providerType does not match field", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "class",
          undefined,
          () => new TestService(),
          undefined,
          undefined
        );
      }).toThrow('ProviderType "class" requires serviceClass');
    });

    it("should throw when factory providerType but no factory", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "factory",
          TestService,
          undefined,
          undefined,
          undefined
        );
      }).toThrow('ProviderType "factory" requires factory');
    });

    it("should throw when value providerType but no value", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "value",
          undefined,
          undefined,
          undefined,
          undefined
        );
      }).toThrow("exactly one");
    });

    it("should throw when alias providerType but no aliasTarget", () => {
      expect(() => {
        new ServiceRegistration(
          ServiceLifecycle.SINGLETON,
          [],
          "alias",
          undefined,
          undefined,
          undefined,
          undefined
        );
      }).toThrow("exactly one");
    });
  });

  describe("clone", () => {
    it("should clone registration", () => {
      const original = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [],
        "class",
        TestService,
        undefined,
        undefined,
        undefined
      );

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.serviceClass).toBe(original.serviceClass);
      expect(cloned.providerType).toBe(original.providerType);
      expect(cloned.lifecycle).toBe(original.lifecycle);
    });

    it("should clone dependencies array", () => {
      const depToken = createInjectionToken<TestService>("Dep");
      const original = new ServiceRegistration(
        ServiceLifecycle.SINGLETON,
        [depToken],
        "class",
        TestService,
        undefined,
        undefined,
        undefined
      );

      const cloned = original.clone();

      expect(cloned.dependencies).toEqual([depToken]);
      expect(cloned.dependencies).not.toBe(original.dependencies);
    });
  });
});

