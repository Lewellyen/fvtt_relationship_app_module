/**
 * Port registration for Foundry VTT v13.
 * This file is part of the "Concrete Platform Concrete Version" layer.
 * It registers all v13 port implementations into the DI container and their respective registries.
 */

import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import type { FoundryModule } from "@/infrastructure/adapters/foundry/interfaces/FoundryModule";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createFoundryV13GamePort } from "./FoundryV13GamePort";
import { createFoundryV13HooksPort } from "./FoundryV13HooksPort";
import { FoundryV13DocumentPort } from "./FoundryV13DocumentPort";
import { createFoundryV13UIPort } from "./FoundryV13UIPort";
import { createFoundryV13SettingsPort } from "./FoundryV13SettingsPort";
import { createFoundryV13I18nPort } from "./FoundryV13I18nPort";
import { createFoundryV13ModulePort } from "./FoundryV13ModulePort";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { foundryV13GamePortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-game-port.token";
import { foundryV13HooksPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-hooks-port.token";
import { foundryV13DocumentPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-document-port.token";
import { foundryV13UIPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-ui-port.token";
import { foundryV13SettingsPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-settings-port.token";
import { foundryV13I18nPortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-i18n-port.token";
import { foundryV13ModulePortToken } from "@/infrastructure/shared/tokens/foundry/foundry-v13-module-port.token";

/**
 * Helper function for port registration.
 * Reduces duplication when registering multiple ports.
 */
function registerPortToRegistry<T>(
  registry: PortRegistry<T>,
  version: number,
  token: InjectionToken<T>,
  portName: string,
  errors: string[]
): void {
  const result = registry.register(version, token);
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
}

/**
 * Registers all v13 port implementations into the DI container and their respective registries.
 *
 * This function is called from the version-agnostic config layer to populate
 * port registries with v13-specific implementations. Ports are registered in the
 * DI container first, then their tokens are stored in the registries for later resolution.
 *
 * @param registries - Object containing all port registries to populate
 * @param container - Service container for dependency injection
 * @returns Result indicating success or error with details
 */
export function registerV13Ports(
  registries: {
    gamePortRegistry: PortRegistry<FoundryGame>;
    hooksPortRegistry: PortRegistry<FoundryHooks>;
    documentPortRegistry: PortRegistry<FoundryDocument>;
    uiPortRegistry: PortRegistry<FoundryUI>;
    settingsPortRegistry: PortRegistry<FoundrySettings>;
    i18nPortRegistry: PortRegistry<FoundryI18n>;
    modulePortRegistry: PortRegistry<FoundryModule>;
  },
  container: ServiceContainer
): Result<void, string> {
  const portRegistrationErrors: string[] = [];

  // Register all v13 port factories with the DI container (VOR PortRegistry-Registrierungen)
  // Using factory functions to inject Foundry APIs for better testability
  const gamePortResult = container.registerFactory(
    foundryV13GamePortToken,
    createFoundryV13GamePort,
    ServiceLifecycle.SINGLETON,
    [] // No dependencies
  );
  if (isErr(gamePortResult)) {
    portRegistrationErrors.push(`FoundryGame: ${gamePortResult.error.message}`);
  }

  const hooksPortResult = container.registerFactory(
    foundryV13HooksPortToken,
    createFoundryV13HooksPort,
    ServiceLifecycle.SINGLETON,
    [] // No dependencies
  );
  if (isErr(hooksPortResult)) {
    portRegistrationErrors.push(`FoundryHooks: ${hooksPortResult.error.message}`);
  }

  // FoundryV13DocumentPort doesn't use Foundry APIs directly, so it can stay as class registration
  container.registerClass(
    foundryV13DocumentPortToken,
    FoundryV13DocumentPort,
    ServiceLifecycle.SINGLETON
  );

  const uiPortResult = container.registerFactory(
    foundryV13UIPortToken,
    createFoundryV13UIPort,
    ServiceLifecycle.SINGLETON,
    [] // No dependencies
  );
  if (isErr(uiPortResult)) {
    portRegistrationErrors.push(`FoundryUI: ${uiPortResult.error.message}`);
  }

  const settingsPortResult = container.registerFactory(
    foundryV13SettingsPortToken,
    createFoundryV13SettingsPort,
    ServiceLifecycle.SINGLETON,
    [] // No dependencies
  );
  if (isErr(settingsPortResult)) {
    portRegistrationErrors.push(`FoundrySettings: ${settingsPortResult.error.message}`);
  }

  const i18nPortResult = container.registerFactory(
    foundryV13I18nPortToken,
    createFoundryV13I18nPort,
    ServiceLifecycle.SINGLETON,
    [] // No dependencies
  );
  if (isErr(i18nPortResult)) {
    portRegistrationErrors.push(`FoundryI18n: ${i18nPortResult.error.message}`);
  }

  container.registerValue(foundryV13ModulePortToken, createFoundryV13ModulePort());

  // Register FoundryGame port token in registry
  registerPortToRegistry(
    registries.gamePortRegistry,
    13,
    foundryV13GamePortToken,
    "FoundryGame",
    portRegistrationErrors
  );

  // Register FoundryHooks port token in registry
  registerPortToRegistry(
    registries.hooksPortRegistry,
    13,
    foundryV13HooksPortToken,
    "FoundryHooks",
    portRegistrationErrors
  );

  // Register FoundryDocument port token in registry
  registerPortToRegistry(
    registries.documentPortRegistry,
    13,
    foundryV13DocumentPortToken,
    "FoundryDocument",
    portRegistrationErrors
  );

  // Register FoundryUI port token in registry
  registerPortToRegistry(
    registries.uiPortRegistry,
    13,
    foundryV13UIPortToken,
    "FoundryUI",
    portRegistrationErrors
  );

  // Register FoundrySettings port token in registry
  registerPortToRegistry(
    registries.settingsPortRegistry,
    13,
    foundryV13SettingsPortToken,
    "FoundrySettings",
    portRegistrationErrors
  );

  // Register FoundryI18n port token in registry
  registerPortToRegistry(
    registries.i18nPortRegistry,
    13,
    foundryV13I18nPortToken,
    "FoundryI18n",
    portRegistrationErrors
  );

  // Register FoundryModule port token in registry
  registerPortToRegistry(
    registries.modulePortRegistry,
    13,
    foundryV13ModulePortToken,
    "FoundryModule",
    portRegistrationErrors
  );

  // Check for registration errors
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }

  return ok(undefined);
}
