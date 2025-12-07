import { describe, it, expect, vi, afterEach } from "vitest";
import { createTestContainer } from "@/test/utils/test-helpers";
import {
  registerPortInfrastructure,
  registerPortRegistries,
} from "@/framework/config/modules/port-infrastructure.config";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryGamePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-game-port-registry.token";
import { foundryHooksPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks-port-registry.token";
import { foundryDocumentPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-document-port-registry.token";
import { foundryUIPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui-port-registry.token";
import { foundrySettingsPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings-port-registry.token";
import { foundryI18nPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-i18n-port-registry.token";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { err } from "@/domain/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

describe("port-infrastructure.config", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("registerPortInfrastructure", () => {
    it("should register PortSelector as singleton", () => {
      const container = createTestContainer();

      const result = registerPortInfrastructure(container);

      expectResultOk(result);
      expectResultOk(container.isRegistered(portSelectorToken));
    });

    it("should propagate errors when PortSelector registration fails", () => {
      const container = createTestContainer();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === portSelectorToken) {
          return err({
            code: "InvalidOperation",
            message: "PortSelector registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = registerPortInfrastructure(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("PortSelector");
      }
    });
  });

  describe("registerPortRegistries", () => {
    it("should register all Foundry port registries as values", () => {
      const container = createTestContainer();

      const result = registerPortRegistries(container);

      expectResultOk(result);
      expectResultOk(container.isRegistered(foundryGamePortRegistryToken));
      expectResultOk(container.isRegistered(foundryHooksPortRegistryToken));
      expectResultOk(container.isRegistered(foundryDocumentPortRegistryToken));
      expectResultOk(container.isRegistered(foundryUIPortRegistryToken));
      expectResultOk(container.isRegistered(foundrySettingsPortRegistryToken));
      expectResultOk(container.isRegistered(foundryI18nPortRegistryToken));
    });

    it("should propagate errors when PortRegistry registration fails", () => {
      const container = createTestContainer();

      vi.spyOn(PortRegistry.prototype, "register").mockImplementationOnce(() =>
        err(
          createFoundryError("PORT_REGISTRY_ERROR", "Failed to register port", {
            registry: "FoundryGamePort",
          })
        )
      );

      const result = registerPortRegistries(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Port registration failed");
      }
    });

    it("should propagate errors when value registration fails", () => {
      const container = createTestContainer();
      const originalRegisterValue = container.registerValue.bind(container);

      vi.spyOn(container, "registerValue").mockImplementation((token, value) => {
        if (token === foundryHooksPortRegistryToken) {
          return err({
            code: "InvalidOperation",
            message: "Hooks registry registration failed",
          });
        }
        return originalRegisterValue(token, value);
      });

      const result = registerPortRegistries(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryHooks");
      }
    });
  });
});
