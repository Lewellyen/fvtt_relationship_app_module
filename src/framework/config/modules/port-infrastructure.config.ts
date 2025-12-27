import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryGamePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-game-port-registry.token";
import { foundryHooksPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks-port-registry.token";
import { foundryDocumentPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-document-port-registry.token";
import { foundryUIPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui-port-registry.token";
import { foundrySettingsPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings-port-registry.token";
import { foundryI18nPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-i18n-port-registry.token";
import { foundryModulePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-module-port-registry.token";
import {
  platformUIPortToken,
  platformValidationPortToken,
  platformLoggingPortToken,
  platformMetricsSnapshotPortToken,
  platformJournalDirectoryUiPortToken,
  platformUINotificationPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { DIPortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import { DIFoundryVersionDetector } from "@/infrastructure/adapters/foundry/versioning/foundry-version-detector";
import { foundryVersionDetectorToken } from "@/infrastructure/shared/tokens/foundry/foundry-version-detector.token";
import { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import { registerV13Ports } from "@/infrastructure/adapters/foundry/ports/v13/port-registration";
import { DIFoundryUIAdapter } from "@/infrastructure/adapters/foundry/adapters/foundry-ui-adapter";
import { DIValibotValidationAdapter } from "@/infrastructure/validation/di-valibot-validation-adapter";
import { DIMetricsSnapshotAdapter } from "@/infrastructure/observability/di-metrics-snapshot-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";
import type { FoundryModule } from "@/infrastructure/adapters/foundry/interfaces/FoundryModule";

/**
 * Creates and registers all port implementations to their respective registries.
 * Returns the populated registries for container registration.
 *
 * This function is version-agnostic and delegates to version-specific registration
 * functions (e.g., registerV13Ports) to populate the registries.
 *
 * @param container - Service container for dependency injection (passed to port registration functions)
 */
function createPortRegistries(container: ServiceContainer): Result<
  {
    gamePortRegistry: PortRegistry<FoundryGame>;
    hooksPortRegistry: PortRegistry<FoundryHooks>;
    documentPortRegistry: PortRegistry<FoundryDocument>;
    uiPortRegistry: PortRegistry<FoundryUI>;
    settingsPortRegistry: PortRegistry<FoundrySettings>;
    i18nPortRegistry: PortRegistry<FoundryI18n>;
    modulePortRegistry: PortRegistry<FoundryModule>;
  },
  string
> {
  // Create empty port registries
  const gamePortRegistry = new PortRegistry<FoundryGame>();
  const hooksPortRegistry = new PortRegistry<FoundryHooks>();
  const documentPortRegistry = new PortRegistry<FoundryDocument>();
  const uiPortRegistry = new PortRegistry<FoundryUI>();
  const settingsPortRegistry = new PortRegistry<FoundrySettings>();
  const i18nPortRegistry = new PortRegistry<FoundryI18n>();
  const modulePortRegistry = new PortRegistry<FoundryModule>();

  // Register v13 ports (version-specific registration is delegated to v13 layer)
  // Container is passed to allow future ports to use DI, even though current v13 ports don't need it
  const v13RegistrationResult = registerV13Ports(
    {
      gamePortRegistry,
      hooksPortRegistry,
      documentPortRegistry,
      uiPortRegistry,
      settingsPortRegistry,
      i18nPortRegistry,
      modulePortRegistry,
    },
    container
  );

  if (isErr(v13RegistrationResult)) {
    return v13RegistrationResult;
  }

  // Future: Add calls to registerV14Ports(), registerV15Ports(), etc. here
  // Each version registers itself into the same registries

  return ok({
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
    modulePortRegistry,
  });
}

/**
 * Registers port infrastructure root services.
 *
 * Services registered:
 * - FoundryVersionDetector (singleton, no dependencies)
 * - PortSelector (singleton, with FoundryVersionDetector, EventEmitter, ObservabilityRegistry, and ServiceContainer dependencies)
 * - PlatformUIPort (singleton, via FoundryUIAdapter)
 *
 * OBSERVABILITY: PortSelector self-registers with ObservabilityRegistry for automatic
 * event observation (logging/metrics). No manual wiring needed.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerPortInfrastructure(container: ServiceContainer): Result<void, string> {
  // Register FoundryVersionDetector (must be registered before PortSelector)
  const versionDetectorResult = container.registerClass(
    foundryVersionDetectorToken,
    DIFoundryVersionDetector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(versionDetectorResult)) {
    return err(`Failed to register FoundryVersionDetector: ${versionDetectorResult.error.message}`);
  }

  // Register PortSelector
  // Dependencies: [foundryVersionDetectorToken, portSelectionEventEmitterToken, observabilityRegistryToken, serviceContainerToken]
  const portSelectorResult = container.registerClass(
    portSelectorToken,
    DIPortSelector,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }

  // Register PlatformUIPort (Foundry implementation via adapter)
  const platformUIPortResult = container.registerClass(
    platformUIPortToken,
    DIFoundryUIAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(platformUIPortResult)) {
    return err(`Failed to register PlatformUIPort: ${platformUIPortResult.error.message}`);
  }

  // Register specialized ports as aliases to PlatformUIPort
  // This allows services to depend on minimal interfaces (ISP)
  const journalDirectoryUiAliasResult = container.registerAlias(
    platformJournalDirectoryUiPortToken,
    platformUIPortToken
  );
  if (isErr(journalDirectoryUiAliasResult)) {
    return err(
      `Failed to register PlatformJournalDirectoryUiPort alias: ${journalDirectoryUiAliasResult.error.message}`
    );
  }

  const uiNotificationAliasResult = container.registerAlias(
    platformUINotificationPortToken,
    platformUIPortToken
  );
  if (isErr(uiNotificationAliasResult)) {
    return err(
      `Failed to register UINotificationPort alias: ${uiNotificationAliasResult.error.message}`
    );
  }

  // Register PlatformValidationPort (Valibot implementation via adapter)
  const platformValidationPortResult = container.registerClass(
    platformValidationPortToken,
    DIValibotValidationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(platformValidationPortResult)) {
    return err(
      `Failed to register PlatformValidationPort: ${platformValidationPortResult.error.message}`
    );
  }

  // Register PlatformLoggingPort as alias to loggerToken
  // Logger is already a type alias for PlatformLoggingPort, so we can use an alias
  // This allows Application Layer to use platformLoggingPortToken while Infrastructure
  // continues to use loggerToken (backward compatibility)
  const loggingPortAliasResult = container.registerAlias(platformLoggingPortToken, loggerToken);
  if (isErr(loggingPortAliasResult)) {
    return err(
      `Failed to register PlatformLoggingPort alias: ${loggingPortAliasResult.error.message}`
    );
  }

  // Register PlatformMetricsSnapshotPort (adapter wrapping MetricsCollector)
  const metricsSnapshotPortResult = container.registerClass(
    platformMetricsSnapshotPortToken,
    DIMetricsSnapshotAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsSnapshotPortResult)) {
    return err(
      `Failed to register PlatformMetricsSnapshotPort: ${metricsSnapshotPortResult.error.message}`
    );
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
  const portsResult = createPortRegistries(container);
  if (isErr(portsResult)) return portsResult;

  const {
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
    modulePortRegistry,
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

  // Register FoundryModule PortRegistry
  const moduleRegistryResult = container.registerValue(
    foundryModulePortRegistryToken,
    modulePortRegistry
  );
  if (isErr(moduleRegistryResult)) {
    return err(
      `Failed to register FoundryModule PortRegistry: ${moduleRegistryResult.error.message}`
    );
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "PortInfrastructure",
  priority: 60,
  execute: registerPortInfrastructure,
});
// Note: registerPortRegistries is registered in dependencyconfig.ts as SubcontainerValues (internal step)
