import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  portSelectorToken,
  foundryGamePortRegistryToken,
  foundryHooksPortRegistryToken,
  foundryDocumentPortRegistryToken,
  foundryUIPortRegistryToken,
  foundrySettingsPortRegistryToken,
  foundryI18nPortRegistryToken,
} from "@/foundry/foundrytokens";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { FoundryGamePortV13 } from "@/foundry/ports/v13/FoundryGamePort";
import { FoundryHooksPortV13 } from "@/foundry/ports/v13/FoundryHooksPort";
import { FoundryDocumentPortV13 } from "@/foundry/ports/v13/FoundryDocumentPort";
import { FoundryUIPortV13 } from "@/foundry/ports/v13/FoundryUIPort";
import { FoundrySettingsPortV13 } from "@/foundry/ports/v13/FoundrySettingsPort";
import { FoundryI18nPortV13 } from "@/foundry/ports/v13/FoundryI18nPort";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";

/**
 * Helper function for port registration.
 * Reduces duplication when registering multiple ports.
 */
function registerPortToRegistry<T>(
  registry: PortRegistry<T>,
  version: number,
  factory: () => T,
  portName: string,
  errors: string[]
): void {
  const result = registry.register(version, factory);
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
}

/**
 * Creates and registers all port implementations to their respective registries.
 * Returns the populated registries for container registration.
 */
function createPortRegistries(): Result<
  {
    gamePortRegistry: PortRegistry<FoundryGame>;
    hooksPortRegistry: PortRegistry<FoundryHooks>;
    documentPortRegistry: PortRegistry<FoundryDocument>;
    uiPortRegistry: PortRegistry<FoundryUI>;
    settingsPortRegistry: PortRegistry<FoundrySettings>;
    i18nPortRegistry: PortRegistry<FoundryI18n>;
  },
  string
> {
  const portRegistrationErrors: string[] = [];

  // Create and populate FoundryGame registry
  const gamePortRegistry = new PortRegistry<FoundryGame>();
  registerPortToRegistry(
    gamePortRegistry,
    13,
    () => new FoundryGamePortV13(),
    "FoundryGame",
    portRegistrationErrors
  );

  // Create and populate FoundryHooks registry
  const hooksPortRegistry = new PortRegistry<FoundryHooks>();
  registerPortToRegistry(
    hooksPortRegistry,
    13,
    () => new FoundryHooksPortV13(),
    "FoundryHooks",
    portRegistrationErrors
  );

  // Create and populate FoundryDocument registry
  const documentPortRegistry = new PortRegistry<FoundryDocument>();
  registerPortToRegistry(
    documentPortRegistry,
    13,
    () => new FoundryDocumentPortV13(),
    "FoundryDocument",
    portRegistrationErrors
  );

  // Create and populate FoundryUI registry
  const uiPortRegistry = new PortRegistry<FoundryUI>();
  registerPortToRegistry(
    uiPortRegistry,
    13,
    () => new FoundryUIPortV13(),
    "FoundryUI",
    portRegistrationErrors
  );

  // Create and populate FoundrySettings registry
  const settingsPortRegistry = new PortRegistry<FoundrySettings>();
  registerPortToRegistry(
    settingsPortRegistry,
    13,
    () => new FoundrySettingsPortV13(),
    "FoundrySettings",
    portRegistrationErrors
  );

  // Create and populate FoundryI18n registry
  const i18nPortRegistry = new PortRegistry<FoundryI18n>();
  registerPortToRegistry(
    i18nPortRegistry,
    13,
    () => new FoundryI18nPortV13(),
    "FoundryI18n",
    portRegistrationErrors
  );

  // Check for registration errors
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }

  return ok({
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
  });
}

/**
 * Registers port infrastructure root services.
 *
 * Services registered:
 * - PortSelector (singleton, with EventEmitter and ObservabilityRegistry dependencies)
 *
 * OBSERVABILITY: PortSelector self-registers with ObservabilityRegistry for automatic
 * event observation (logging/metrics). No manual wiring needed.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerPortInfrastructure(container: ServiceContainer): Result<void, string> {
  // Register PortSelector
  // Dependencies: [portSelectionEventEmitterToken, observabilityRegistryToken]
  const portSelectorResult = container.registerClass(
    portSelectorToken,
    PortSelector,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }

  // Note: Observability handled via self-registration pattern
  // PortSelector registers itself at ObservabilityRegistry in constructor
  // No manual wiring needed here

  return ok(undefined);
}

/**
 * Registers Foundry port registries (sub-container values).
 *
 * Each registry is pre-populated with versioned factories and stored as a singleton value.
 *
 * @param container - The service container to register registries in
 * @returns Result indicating success or error with details
 */
export function registerPortRegistries(container: ServiceContainer): Result<void, string> {
  const portsResult = createPortRegistries();
  if (isErr(portsResult)) return portsResult;

  const {
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
  } = portsResult.value;

  // Register FoundryGame PortRegistry
  const gameRegistryResult = container.registerValue(
    foundryGamePortRegistryToken,
    gamePortRegistry
  );
  if (isErr(gameRegistryResult)) {
    return err(`Failed to register FoundryGame PortRegistry: ${gameRegistryResult.error.message}`);
  }

  // Register FoundryHooks PortRegistry
  const hooksRegistryResult = container.registerValue(
    foundryHooksPortRegistryToken,
    hooksPortRegistry
  );
  if (isErr(hooksRegistryResult)) {
    return err(
      `Failed to register FoundryHooks PortRegistry: ${hooksRegistryResult.error.message}`
    );
  }

  // Register FoundryDocument PortRegistry
  const documentRegistryResult = container.registerValue(
    foundryDocumentPortRegistryToken,
    documentPortRegistry
  );
  if (isErr(documentRegistryResult)) {
    return err(
      `Failed to register FoundryDocument PortRegistry: ${documentRegistryResult.error.message}`
    );
  }

  // Register FoundryUI PortRegistry
  const uiRegistryResult = container.registerValue(foundryUIPortRegistryToken, uiPortRegistry);
  if (isErr(uiRegistryResult)) {
    return err(`Failed to register FoundryUI PortRegistry: ${uiRegistryResult.error.message}`);
  }

  // Register FoundrySettings PortRegistry
  const settingsRegistryResult = container.registerValue(
    foundrySettingsPortRegistryToken,
    settingsPortRegistry
  );
  if (isErr(settingsRegistryResult)) {
    return err(
      `Failed to register FoundrySettings PortRegistry: ${settingsRegistryResult.error.message}`
    );
  }

  // Register FoundryI18n PortRegistry
  const i18nRegistryResult = container.registerValue(
    foundryI18nPortRegistryToken,
    i18nPortRegistry
  );
  if (isErr(i18nRegistryResult)) {
    return err(`Failed to register FoundryI18n PortRegistry: ${i18nRegistryResult.error.message}`);
  }

  return ok(undefined);
}
