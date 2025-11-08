import { ServiceContainer } from "@/di_infrastructure/container";
import {
  loggerToken,
  journalVisibilityServiceToken,
  metricsCollectorToken,
  foundryI18nToken,
  localI18nToken,
  i18nFacadeToken,
  environmentConfigToken,
  moduleHealthServiceToken,
} from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { JournalVisibilityService } from "@/services/JournalVisibilityService";
import { MetricsCollector } from "@/observability/metrics-collector";
import { ModuleHealthService } from "@/core/module-health-service";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { ok, err, isErr } from "@/utils/result";
import type { Result } from "@/types/result";
import type { Logger } from "@/interfaces/logger";
import { ENV } from "@/config/environment";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryI18nPortRegistryToken,
  portSelectorToken,
  foundryGamePortRegistryToken,
  foundryHooksPortRegistryToken,
  foundryDocumentPortRegistryToken,
  foundryUIPortRegistryToken,
  foundrySettingsPortRegistryToken,
} from "@/foundry/foundrytokens";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { FoundryGameService } from "@/foundry/services/FoundryGameService";
import { FoundryHooksService } from "@/foundry/services/FoundryHooksService";
import { FoundryDocumentService } from "@/foundry/services/FoundryDocumentService";
import { FoundryUIService } from "@/foundry/services/FoundryUIService";
import { FoundrySettingsService } from "@/foundry/services/FoundrySettingsService";
import { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import { LocalI18nService } from "@/services/LocalI18nService";
import { I18nFacadeService } from "@/services/I18nFacadeService";
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
 *
 * @template T - The port type
 * @param registry - The port registry to register to
 * @param version - The Foundry version this port supports
 * @param factory - Factory function that creates the port instance
 * @param portName - Name of the port (for error messages)
 * @param errors - Array to collect error messages
 */
function registerPortToRegistry<T>(
  registry: PortRegistry<T>,
  version: number,
  factory: () => T,
  portName: string,
  errors: string[]
): void {
  const result = registry.register(version, factory);
  /* c8 ignore start -- Defensive: Port registration can only fail if version is duplicate, which is controlled by hardcoded port registrations */
  if (isErr(result)) {
    errors.push(`${portName} v${version}: ${result.error}`);
  }
  /* c8 ignore stop */
}

/**
 * Configures all dependency injection mappings for the application.
 * This is the central place where tokens are connected to their factories.
 *
 * Also registers fallback factories for critical services that should always be available
 * even if container resolution fails.
 *
 * @param container - The service container to configure
 * @returns Result indicating success or configuration errors
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.createRoot();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const logger = container.resolve(loggerToken); // Direct resolution with fallback
 * }
 * ```
 */
/**
 * Registers fallback factories for critical services.
 */
function registerFallbacks(container: ServiceContainer): void {
  container.registerFallback<Logger>(loggerToken, () => new ConsoleLoggerService());
}

/**
 * Registers core infrastructure services (EnvironmentConfig, MetricsCollector, Logger, ModuleHealthService).
 *
 * CRITICAL INITIALIZATION ORDER:
 * 1. EnvironmentConfig (no dependencies) - needed by MetricsCollector and PortSelector
 * 2. MetricsCollector (deps: [environmentConfigToken]) - needed by ServiceResolver and PortSelector
 * 3. Logger (no dependencies) - needed by PortSelector and all services
 * 4. ModuleHealthService (deps: [container, metricsCollectorToken]) - special case with container self-reference
 * 5. PortSelector (deps: [metricsCollectorToken, loggerToken, environmentConfigToken]) - auto-resolved after all
 *
 * This order ensures no circular dependencies and that Logger is available
 * for all console.* replacements in PortSelector and other services.
 */
function registerCoreServices(container: ServiceContainer): Result<void, string> {
  // Register EnvironmentConfig (needed by MetricsCollector and PortSelector)
  const envResult = container.registerValue(environmentConfigToken, ENV);

  /* c8 ignore start -- Defensive: Value registration can only fail if token is duplicate */
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register MetricsCollector (needed early for ServiceResolver and PortSelector)
  const metricsResult = container.registerClass(
    metricsCollectorToken,
    MetricsCollector,
    ServiceLifecycle.SINGLETON
  );

  /* c8 ignore start -- Defensive: MetricsCollector has no dependencies and cannot fail registration */
  if (isErr(metricsResult)) {
    return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register logger (needed by PortSelector and all services for structured logging)
  const loggerResult = container.registerClass(
    loggerToken,
    ConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(loggerResult)) {
    return err(`Failed to register logger: ${loggerResult.error.message}`);
  }

  // Register ModuleHealthService with factory (special case: needs container reference)
  const healthResult = container.registerFactory(
    moduleHealthServiceToken,
    () => {
      const metricsResult = container.resolveWithError(metricsCollectorToken);
      /* c8 ignore start -- Defensive: MetricsCollector is always registered at this point */
      if (!metricsResult.ok) {
        throw new Error("MetricsCollector not available for ModuleHealthService");
      }
      /* c8 ignore stop */
      return new ModuleHealthService(container, metricsResult.value);
    },
    ServiceLifecycle.SINGLETON,
    [metricsCollectorToken]
  );

  /* c8 ignore start -- Defensive: Factory registration can only fail if token is duplicate */
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }
  /* c8 ignore stop */

  return ok(undefined);
}

/**
 * Registers Ports to PortRegistries.
 * Returns the created registries for further processing.
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

  const gamePortRegistry = new PortRegistry<FoundryGame>();
  registerPortToRegistry(
    gamePortRegistry,
    13,
    () => new FoundryGamePortV13(),
    "FoundryGame",
    portRegistrationErrors
  );

  const hooksPortRegistry = new PortRegistry<FoundryHooks>();
  registerPortToRegistry(
    hooksPortRegistry,
    13,
    () => new FoundryHooksPortV13(),
    "FoundryHooks",
    portRegistrationErrors
  );

  const documentPortRegistry = new PortRegistry<FoundryDocument>();
  registerPortToRegistry(
    documentPortRegistry,
    13,
    () => new FoundryDocumentPortV13(),
    "FoundryDocument",
    portRegistrationErrors
  );

  const uiPortRegistry = new PortRegistry<FoundryUI>();
  registerPortToRegistry(
    uiPortRegistry,
    13,
    () => new FoundryUIPortV13(),
    "FoundryUI",
    portRegistrationErrors
  );

  const settingsPortRegistry = new PortRegistry<FoundrySettings>();
  registerPortToRegistry(
    settingsPortRegistry,
    13,
    () => new FoundrySettingsPortV13(),
    "FoundrySettings",
    portRegistrationErrors
  );

  const i18nPortRegistry = new PortRegistry<FoundryI18n>();
  registerPortToRegistry(
    i18nPortRegistry,
    13,
    () => new FoundryI18nPortV13(),
    "FoundryI18n",
    portRegistrationErrors
  );

  // Return early if any port registration failed
  /* c8 ignore start -- Port registration errors already tested individually; aggregation is defensive */
  if (portRegistrationErrors.length > 0) {
    return err(`Port registration failed: ${portRegistrationErrors.join("; ")}`);
  }
  /* c8 ignore stop */

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
 * Registers PortSelector and PortRegistries in the container.
 */
function registerPortInfrastructure(container: ServiceContainer): Result<void, string> {
  // Register PortSelector
  const portSelectorResult = container.registerClass(
    portSelectorToken,
    PortSelector,
    ServiceLifecycle.SINGLETON
  );

  /* c8 ignore start -- Defensive: Class registration can only fail if token is duplicate or container is in invalid state, which cannot happen during normal bootstrap */
  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }
  /* c8 ignore stop */

  // Create port registries
  const portsResult = createPortRegistries();
  /* c8 ignore next -- Error propagation: createPortRegistries failure tested in sub-function */
  if (isErr(portsResult)) return portsResult;

  const {
    gamePortRegistry,
    hooksPortRegistry,
    documentPortRegistry,
    uiPortRegistry,
    settingsPortRegistry,
    i18nPortRegistry,
  } = portsResult.value;

  const gameRegistryResult = container.registerValue(
    foundryGamePortRegistryToken,
    gamePortRegistry
  );
  if (isErr(gameRegistryResult)) {
    return err(`Failed to register FoundryGame PortRegistry: ${gameRegistryResult.error.message}`);
  }

  const hooksRegistryResult = container.registerValue(
    foundryHooksPortRegistryToken,
    hooksPortRegistry
  );
  /* c8 ignore start -- Defensive: Value registration can only fail if token is duplicate or container is in invalid state, which cannot happen during normal bootstrap */
  if (isErr(hooksRegistryResult)) {
    return err(
      `Failed to register FoundryHooks PortRegistry: ${hooksRegistryResult.error.message}`
    );
  }
  /* c8 ignore stop */

  const documentRegistryResult = container.registerValue(
    foundryDocumentPortRegistryToken,
    documentPortRegistry
  );
  /* c8 ignore start -- Defensive: Value registration can only fail if token is duplicate or container is in invalid state, which cannot happen during normal bootstrap */
  if (isErr(documentRegistryResult)) {
    return err(
      `Failed to register FoundryDocument PortRegistry: ${documentRegistryResult.error.message}`
    );
  }
  /* c8 ignore stop */

  const uiRegistryResult = container.registerValue(foundryUIPortRegistryToken, uiPortRegistry);
  /* c8 ignore start -- Defensive: Value registration can only fail if token is duplicate or container is in invalid state, which cannot happen during normal bootstrap */
  if (isErr(uiRegistryResult)) {
    return err(`Failed to register FoundryUI PortRegistry: ${uiRegistryResult.error.message}`);
  }
  /* c8 ignore stop */

  const settingsRegistryResult = container.registerValue(
    foundrySettingsPortRegistryToken,
    settingsPortRegistry
  );
  if (isErr(settingsRegistryResult)) {
    return err(
      `Failed to register FoundrySettings PortRegistry: ${settingsRegistryResult.error.message}`
    );
  }

  const i18nRegistryResult = container.registerValue(
    foundryI18nPortRegistryToken,
    i18nPortRegistry
  );
  /* c8 ignore start -- Defensive: PortRegistry value registration cannot fail; tested in other registry registrations */
  if (isErr(i18nRegistryResult)) {
    return err(`Failed to register FoundryI18n PortRegistry: ${i18nRegistryResult.error.message}`);
  }
  /* c8 ignore stop */

  return ok(undefined);
}

/**
 * Registers Foundry service wrappers.
 */
function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // Register Foundry Services using registerClass (with static dependencies)
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    FoundryGameService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }

  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    FoundryHooksService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }

  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    FoundryDocumentService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }

  const uiServiceResult = container.registerClass(
    foundryUIToken,
    FoundryUIService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }

  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    FoundrySettingsService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
  }

  const journalVisibilityResult = container.registerClass(
    journalVisibilityServiceToken,
    JournalVisibilityService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(journalVisibilityResult)) {
    return err(
      `Failed to register JournalVisibility service: ${journalVisibilityResult.error.message}`
    );
  }

  return ok(undefined);
}

/**
 * Registers i18n services (Foundry, Local, and Facade).
 */
function registerI18nServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryI18nService
  const foundryI18nResult = container.registerClass(
    foundryI18nToken,
    FoundryI18nService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration can only fail if token is duplicate or dependencies are invalid */
  if (isErr(foundryI18nResult)) {
    return err(`Failed to register FoundryI18nService: ${foundryI18nResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register LocalI18nService
  const localI18nResult = container.registerClass(
    localI18nToken,
    LocalI18nService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration can only fail if token is duplicate or dependencies are invalid */
  if (isErr(localI18nResult)) {
    return err(`Failed to register LocalI18nService: ${localI18nResult.error.message}`);
  }
  /* c8 ignore stop */

  // Register I18nFacadeService
  const facadeResult = container.registerClass(
    i18nFacadeToken,
    I18nFacadeService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration can only fail if token is duplicate or dependencies are invalid */
  if (isErr(facadeResult)) {
    return err(`Failed to register I18nFacadeService: ${facadeResult.error.message}`);
  }
  /* c8 ignore stop */

  return ok(undefined);
}

/**
 * Validates the container configuration.
 */
function validateContainer(container: ServiceContainer): Result<void, string> {
  const validateResult = container.validate();
  /* c8 ignore start -- Defensive: Validation can only fail if dependencies are missing or circular, which cannot happen with hardcoded dependency graph */
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  /* c8 ignore stop */
  return ok(undefined);
}

/**
 * Configures logger with environment settings.
 */
function configureLogger(container: ServiceContainer): void {
  const resolvedLoggerResult = container.resolveWithError(loggerToken);
  if (resolvedLoggerResult.ok) {
    const loggerInstance = resolvedLoggerResult.value;
    if (loggerInstance.setMinLevel) {
      loggerInstance.setMinLevel(ENV.logLevel);
    }
  }
}

/**
 * Main configuration orchestrator.
 * Configures all dependencies, registries, and services in the container.
 *
 * @param container - The DI container to configure
 * @returns Result indicating success or error with details
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.createRoot();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const logger = container.resolve(loggerToken);
 * }
 * ```
 */
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  registerFallbacks(container);

  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;

  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;

  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;

  const i18nServicesResult = registerI18nServices(container);
  /* c8 ignore next -- Error propagation: registerI18nServices failure tested in sub-function */
  if (isErr(i18nServicesResult)) return i18nServicesResult;

  const validationResult = validateContainer(container);
  /* c8 ignore next -- Error propagation: validateContainer failure tested in sub-function */
  if (isErr(validationResult)) return validationResult;

  configureLogger(container);

  return ok(undefined);
}
