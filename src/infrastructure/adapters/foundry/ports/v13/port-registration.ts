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
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import { FoundryV13GamePort } from "./FoundryV13GamePort";
import { FoundryV13HooksPort } from "./FoundryV13HooksPort";
import { FoundryV13DocumentPort } from "./FoundryV13DocumentPort";
import { FoundryV13UIPort } from "./FoundryV13UIPort";
import { FoundryV13SettingsPort } from "./FoundryV13SettingsPort";
import { FoundryV13I18nPort } from "./FoundryV13I18nPort";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  foundryV13GamePortToken,
  foundryV13HooksPortToken,
  foundryV13DocumentPortToken,
  foundryV13UIPortToken,
  foundryV13SettingsPortToken,
  foundryV13I18nPortToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";

/**
 * Helper function for port registration.
 * Reduces duplication when registering multiple ports.
 */
function registerPortToRegistry<T extends ServiceType>(
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
  },
  container: ServiceContainer
): Result<void, string> {
  const portRegistrationErrors: string[] = [];

  // Register all v13 port classes with the DI container (VOR PortRegistry-Registrierungen)
  container.registerClass(foundryV13GamePortToken, FoundryV13GamePort, ServiceLifecycle.SINGLETON);
  container.registerClass(
    foundryV13HooksPortToken,
    FoundryV13HooksPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(
    foundryV13DocumentPortToken,
    FoundryV13DocumentPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(foundryV13UIPortToken, FoundryV13UIPort, ServiceLifecycle.SINGLETON);
  container.registerClass(
    foundryV13SettingsPortToken,
    FoundryV13SettingsPort,
    ServiceLifecycle.SINGLETON
  );
  container.registerClass(foundryV13I18nPortToken, FoundryV13I18nPort, ServiceLifecycle.SINGLETON);

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

  // Check for registration errors
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }

  return ok(undefined);
}
