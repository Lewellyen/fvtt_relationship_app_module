import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DependencyConfigurator } from "@/framework/core/config/dependency-configurator";
import { createMockEnvironmentConfig, expectResultOk } from "@/test/utils/test-helpers";
import { ServiceContainer } from "@/infrastructure/di/container";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";

describe("DependencyConfigurator", () => {
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

  describe("configure", () => {
    it("should configure dependencies successfully", () => {
      const configurator = new DependencyConfigurator();
      const env = createMockEnvironmentConfig();
      const container = ServiceContainer.createRoot(env);
      const result = configurator.configure(container);

      expectResultOk(result);
    });

    it("should register all required services", () => {
      const configurator = new DependencyConfigurator();
      const env = createMockEnvironmentConfig();
      const container = ServiceContainer.createRoot(env);
      const result = configurator.configure(container);

      expectResultOk(result);

      // Verify that logger can be resolved after configuration
      const loggerResult = container.resolveWithError(markAsApiSafe(loggerToken));
      expectResultOk(loggerResult);
    });

    it("should return error result if configuration fails", async () => {
      const configurator = new DependencyConfigurator();
      const env = createMockEnvironmentConfig();
      const container = ServiceContainer.createRoot(env);

      // Mock configureDependencies to return an error
      const configureDependenciesModule = await import("@/framework/config/dependencyconfig");
      vi.spyOn(configureDependenciesModule, "configureDependencies").mockReturnValue({
        ok: false,
        error: "Configuration failed",
      });

      const result = configurator.configure(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Configuration failed");
      }

      // Restore original
      vi.restoreAllMocks();
    });
  });
});
