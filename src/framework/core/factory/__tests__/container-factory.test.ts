import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ContainerFactory } from "@/framework/core/factory/container-factory";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { ServiceContainer } from "@/infrastructure/di/container";

describe("ContainerFactory", () => {
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
      const factory = new ContainerFactory();
      const env = createMockEnvironmentConfig();
      const container = factory.createRoot(env);

      expect(container).toBeInstanceOf(ServiceContainer);
    });

    it("should create different container instances for each call", () => {
      const factory = new ContainerFactory();
      const env = createMockEnvironmentConfig();
      const container1 = factory.createRoot(env);
      const container2 = factory.createRoot(env);

      expect(container1).not.toBe(container2);
    });

    it("should create container with provided environment config", () => {
      const factory = new ContainerFactory();
      const env = createMockEnvironmentConfig({
        logLevel: 2,
        isDevelopment: true,
      });
      const container = factory.createRoot(env);

      expect(container).toBeInstanceOf(ServiceContainer);
      // Container should be created successfully with the provided config
    });
  });
});
