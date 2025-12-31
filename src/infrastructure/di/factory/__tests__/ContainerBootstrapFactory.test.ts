import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ContainerBootstrapFactory } from "@/infrastructure/di/factory/ContainerBootstrapFactory";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { ServiceContainer } from "@/infrastructure/di/container";

describe("ContainerBootstrapFactory", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        ["fvtt_relationship_app_module", { id: "fvtt_relationship_app_module", api: undefined }],
      ]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("createRoot", () => {
    it("should create a ServiceContainer instance", () => {
      const factory = new ContainerBootstrapFactory();
      const env = createMockEnvironmentConfig();
      const container = factory.createRoot(env);

      expect(container).toBeInstanceOf(ServiceContainer);
    });

    it("should create different container instances for each call", () => {
      const factory = new ContainerBootstrapFactory();
      const env = createMockEnvironmentConfig();
      const container1 = factory.createRoot(env);
      const container2 = factory.createRoot(env);

      expect(container1).not.toBe(container2);
    });

    it("should create container with provided environment config", () => {
      const factory = new ContainerBootstrapFactory();
      const env = createMockEnvironmentConfig({
        logLevel: 2,
        isDevelopment: true,
      });
      const container = factory.createRoot(env);

      expect(container).toBeInstanceOf(ServiceContainer);
      expect(container.getValidationState()).toBe("registering");
    });

    it("should create container with bootstrap dependencies", () => {
      const factory = new ContainerBootstrapFactory();
      const env = createMockEnvironmentConfig();
      const container = factory.createRoot(env);

      // Container should be in registering state (not validated yet)
      expect(container.getValidationState()).toBe("registering");

      // Container should be able to register services
      expect(container).toBeInstanceOf(ServiceContainer);
    });
  });

  describe("createScope", () => {
    it("should create child scope from parent container", () => {
      const factory = new ContainerBootstrapFactory();
      const env = createMockEnvironmentConfig();
      const parent = factory.createRoot(env);

      // Note: createScope is tested via parent.createScope() in container tests
      // This factory method delegates to parent.createScope()
      // The parent container must be validated before creating scopes
      const validateResult = parent.validate();
      expect(validateResult.ok).toBe(true);

      const childResult = factory.createScope(parent, "child");

      expect(childResult.ok).toBe(true);
      if (childResult.ok) {
        expect(childResult.value).toBeInstanceOf(ServiceContainer);
        expect(childResult.value.getValidationState()).toBe("registering");
      }
    });
  });
});
