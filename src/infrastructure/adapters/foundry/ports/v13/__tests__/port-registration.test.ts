import { describe, it, expect, vi } from "vitest";
import { registerV13Ports } from "../port-registration";
import { createTestContainer } from "@/test/utils/test-helpers";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { err } from "@/domain/utils/result";
import { foundryV13GamePortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-game-port.token";
import { foundryV13HooksPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-hooks-port.token";
import { foundryV13UIPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-ui-port.token";
import { foundryV13SettingsPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-settings-port.token";
import { foundryV13I18nPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-i18n-port.token";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import type { FoundryModule } from "@/infrastructure/adapters/foundry/interfaces/FoundryModule";

describe("port-registration", () => {
  describe("registerV13Ports", () => {
    it("should register all ports successfully", () => {
      const container = createTestContainer();
      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultOk(result);
    });

    it("should handle error when FoundryGame port registration fails", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13GamePortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryGame registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryGame");
        expect(result.error).toContain("FoundryGame registration failed");
      }
    });

    it("should handle error when FoundryHooks port registration fails", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13HooksPortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryHooks registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryHooks");
        expect(result.error).toContain("FoundryHooks registration failed");
      }
    });

    it("should handle error when FoundryUI port registration fails", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13UIPortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryUI registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryUI");
        expect(result.error).toContain("FoundryUI registration failed");
      }
    });

    it("should handle error when FoundrySettings port registration fails", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13SettingsPortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundrySettings registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundrySettings");
        expect(result.error).toContain("FoundrySettings registration failed");
      }
    });

    it("should handle error when FoundryI18n port registration fails", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13I18nPortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryI18n registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryI18n");
        expect(result.error).toContain("FoundryI18n registration failed");
      }
    });

    it("should handle multiple registration errors", () => {
      const container = createTestContainer();
      const originalRegisterFactory = container.registerFactory.bind(container);

      vi.spyOn(container, "registerFactory").mockImplementation(
        (token, factory, lifecycle, deps) => {
          if (token === foundryV13GamePortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryGame registration failed",
            });
          }
          if (token === foundryV13HooksPortToken) {
            return err({
              code: "InvalidOperation",
              message: "FoundryHooks registration failed",
            });
          }
          return originalRegisterFactory(token, factory, lifecycle, deps);
        }
      );

      const registries = {
        gamePortRegistry: new PortRegistry<FoundryGame>(),
        hooksPortRegistry: new PortRegistry<FoundryHooks>(),
        documentPortRegistry: new PortRegistry<FoundryDocument>(),
        uiPortRegistry: new PortRegistry<FoundryUI>(),
        settingsPortRegistry: new PortRegistry<FoundrySettings>(),
        i18nPortRegistry: new PortRegistry<FoundryI18n>(),
        modulePortRegistry: new PortRegistry<FoundryModule>(),
      };

      const result = registerV13Ports(registries, container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryGame");
        expect(result.error).toContain("FoundryHooks");
        expect(result.error).toContain("FoundryGame registration failed");
        expect(result.error).toContain("FoundryHooks registration failed");
      }
    });
  });
});
