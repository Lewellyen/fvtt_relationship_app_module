import { ServiceContainer, registerFallback } from "@/di_infrastructure/container";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { ok, err, isErr } from "@/utils/result";
import type { Result } from "@/types/result";
import type { Logger } from "@/interfaces/logger";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  portSelectorToken,
  foundryGamePortRegistryToken,
  foundryHooksPortRegistryToken,
  foundryDocumentPortRegistryToken,
  foundryUIPortRegistryToken,
} from "@/foundry/foundrytokens";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { FoundryGameService } from "@/foundry/services/FoundryGameService";
import { FoundryHooksService } from "@/foundry/services/FoundryHooksService";
import { FoundryDocumentService } from "@/foundry/services/FoundryDocumentService";
import { FoundryUIService } from "@/foundry/services/FoundryUIService";
import { FoundryGamePortV13 } from "@/foundry/ports/v13/FoundryGamePort";
import { FoundryHooksPortV13 } from "@/foundry/ports/v13/FoundryHooksPort";
import { FoundryDocumentPortV13 } from "@/foundry/ports/v13/FoundryDocumentPort";
import { FoundryUIPortV13 } from "@/foundry/ports/v13/FoundryUIPort";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";

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
 * const container = new ServiceContainer();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const logger = container.resolve(loggerToken); // Direct resolution with fallback
 * }
 * ```
 */
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  // Register fallback factories for services that should always be available
  registerFallback<Logger>(loggerToken, () => new ConsoleLoggerService());

  // Register logger
  const loggerResult = container.registerClass(
    loggerToken,
    ConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(loggerResult)) {
    return err(`Failed to register logger: ${loggerResult.error.message}`);
  }

  // Register PortSelector as singleton
  const portSelectorResult = container.registerFactory(
    portSelectorToken,
    () => new PortSelector(),
    ServiceLifecycle.SINGLETON,
    []
  );

  if (isErr(portSelectorResult)) {
    return err(`Failed to register PortSelector: ${portSelectorResult.error.message}`);
  }

  // Register PortRegistries
  const gamePortRegistry = new PortRegistry<FoundryGame>();
  gamePortRegistry.register(13, () => new FoundryGamePortV13());

  const hooksPortRegistry = new PortRegistry<FoundryHooks>();
  hooksPortRegistry.register(13, () => new FoundryHooksPortV13());

  const documentPortRegistry = new PortRegistry<FoundryDocument>();
  documentPortRegistry.register(13, () => new FoundryDocumentPortV13());

  const uiPortRegistry = new PortRegistry<FoundryUI>();
  uiPortRegistry.register(13, () => new FoundryUIPortV13());

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
  if (isErr(hooksRegistryResult)) {
    return err(
      `Failed to register FoundryHooks PortRegistry: ${hooksRegistryResult.error.message}`
    );
  }

  const documentRegistryResult = container.registerValue(
    foundryDocumentPortRegistryToken,
    documentPortRegistry
  );
  if (isErr(documentRegistryResult)) {
    return err(
      `Failed to register FoundryDocument PortRegistry: ${documentRegistryResult.error.message}`
    );
  }

  const uiRegistryResult = container.registerValue(foundryUIPortRegistryToken, uiPortRegistry);
  if (isErr(uiRegistryResult)) {
    return err(`Failed to register FoundryUI PortRegistry: ${uiRegistryResult.error.message}`);
  }

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

  // Phase 2: Validate
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }

  return ok(undefined);
}
