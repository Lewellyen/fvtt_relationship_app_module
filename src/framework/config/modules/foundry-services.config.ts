import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { foundryJournalFacadeToken } from "@/infrastructure/shared/tokens/foundry/foundry-journal-facade.token";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import {
  journalVisibilityServiceToken,
  journalDirectoryProcessorToken,
} from "@/application/tokens/application.tokens";
import { DIFoundryGamePort } from "@/infrastructure/adapters/foundry/services/FoundryGamePort";
import { DIFoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { DIFoundryDocumentPort } from "@/infrastructure/adapters/foundry/services/FoundryDocumentPort";
import { DIFoundryUIPort } from "@/infrastructure/adapters/foundry/services/FoundryUIPort";
import { DIFoundrySettingsPort } from "@/infrastructure/adapters/foundry/services/FoundrySettingsPort";
import { DIFoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade";
import { DIJournalVisibilityService } from "@/application/services/JournalVisibilityService";
import { DIJournalDirectoryProcessor } from "@/application/services/JournalDirectoryProcessor";
import { DIFoundryLibWrapperService } from "@/infrastructure/adapters/foundry/services/FoundryLibWrapperService";
import { DIJournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import { DIFoundrySettingsRegistrationAdapter } from "@/infrastructure/adapters/foundry/settings-adapters/foundry-settings-registration-adapter";
import { libWrapperServiceToken } from "@/infrastructure/shared/tokens/foundry/lib-wrapper-service.token";
import { journalContextMenuLibWrapperServiceToken } from "@/infrastructure/shared/tokens/foundry/journal-context-menu-lib-wrapper-service.token";
import { platformContextMenuRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import { createFoundryUtilsPort } from "@/infrastructure/adapters/foundry/services/FoundryUtilsPort";
import { foundryUtilsToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils.token";
import { foundryUtilsUuidToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-uuid.token";
import { foundryUtilsObjectToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-object.token";
import { foundryUtilsHtmlToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-html.token";
import { foundryUtilsAsyncToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-async.token";

/**
 * Registers Foundry service wrappers.
 *
 * Services registered:
 * - FoundryGamePort (singleton)
 * - FoundryHooksPort (singleton)
 * - FoundryDocumentPort (singleton)
 * - FoundryUIPort (singleton)
 * - FoundrySettingsPort (singleton)
 * - FoundryJournalFacade (singleton)
 * - JournalVisibilityService (singleton)
 * - JournalDirectoryProcessor (singleton) - Processes journal directory DOM
 * - FoundryLibWrapperService (singleton) - Facade for libWrapper
 * - JournalContextMenuLibWrapperService (singleton) - Manages libWrapper for journal context menu
 * - FoundryUtilsPort (singleton) - Wrapper for Foundry utils API (UUID, Object, HTML, Async)
 *
 * All services use port-based adapter pattern for Foundry version compatibility.
 * FoundryUtilsPort does not use Port-Adapter-Pattern since Utils are stable across versions.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryGamePort
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    DIFoundryGamePort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }

  // Register FoundryHooksPort
  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    DIFoundryHooksPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }

  // Register FoundryDocumentPort
  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    DIFoundryDocumentPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }

  // Register FoundryUIPort
  const uiServiceResult = container.registerClass(
    foundryUIToken,
    DIFoundryUIPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }

  // Register FoundrySettingsPort
  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    DIFoundrySettingsPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
  }

  // Register PlatformSettingsRegistrationPort (domain-neutral adapter)
  // Uses FoundrySettingsPort internally but exposes domain-neutral interface
  const settingsRegistrationResult = container.registerClass(
    platformSettingsRegistrationPortToken,
    DIFoundrySettingsRegistrationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrationResult)) {
    return err(
      `Failed to register PlatformSettingsRegistrationPort: ${settingsRegistrationResult.error.message}`
    );
  }

  // Register FoundryJournalFacade
  // Combines Game, Document, UI for journal operations
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    DIFoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
  }

  // Register JournalVisibilityService
  // Uses PlatformJournalCollectionPort and PlatformJournalRepository (registered in entity-ports.config.ts)
  const journalVisibilityResult = container.registerClass(
    journalVisibilityServiceToken,
    DIJournalVisibilityService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalVisibilityResult)) {
    return err(
      `Failed to register JournalVisibility service: ${journalVisibilityResult.error.message}`
    );
  }

  // Register JournalDirectoryProcessor
  // Processes journal directory DOM to hide flagged entries
  const journalDirectoryProcessorResult = container.registerClass(
    journalDirectoryProcessorToken,
    DIJournalDirectoryProcessor,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalDirectoryProcessorResult)) {
    return err(
      `Failed to register JournalDirectoryProcessor: ${journalDirectoryProcessorResult.error.message}`
    );
  }

  // Register FoundryLibWrapperService
  const libWrapperServiceResult = container.registerClass(
    libWrapperServiceToken,
    DIFoundryLibWrapperService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(libWrapperServiceResult)) {
    return err(`Failed to register LibWrapperService: ${libWrapperServiceResult.error.message}`);
  }

  // Register JournalContextMenuLibWrapperService
  const contextMenuLibWrapperResult = container.registerClass(
    journalContextMenuLibWrapperServiceToken,
    DIJournalContextMenuLibWrapperService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(contextMenuLibWrapperResult)) {
    return err(
      `Failed to register JournalContextMenuLibWrapperService: ${contextMenuLibWrapperResult.error.message}`
    );
  }

  // Register PlatformContextMenuRegistrationPort (alias to JournalContextMenuLibWrapperService)
  // This provides the domain-neutral port interface for context menu registration
  const contextMenuPortResult = container.registerAlias(
    platformContextMenuRegistrationPortToken,
    journalContextMenuLibWrapperServiceToken
  );
  if (isErr(contextMenuPortResult)) {
    return err(
      `Failed to register PlatformContextMenuRegistrationPort: ${contextMenuPortResult.error.message}`
    );
  }

  // Register FoundryUtilsPort (Composition Interface)
  // Provides all Foundry utils functionality (UUID, Object, HTML, Async)
  // Uses factory function to create instance with real Foundry API
  const utilsResult = container.registerFactory(
    foundryUtilsToken,
    () => createFoundryUtilsPort(),
    ServiceLifecycle.SINGLETON,
    []
  );
  if (isErr(utilsResult)) {
    return err(`Failed to register FoundryUtils service: ${utilsResult.error.message}`);
  }

  // Register aliases for specific ports (ISP-konform)
  // Clients can inject only the port they need instead of the full FoundryUtils
  const uuidAliasResult = container.registerAlias(foundryUtilsUuidToken, foundryUtilsToken);
  if (isErr(uuidAliasResult)) {
    return err(`Failed to register FoundryUtilsUuid alias: ${uuidAliasResult.error.message}`);
  }

  const objectAliasResult = container.registerAlias(foundryUtilsObjectToken, foundryUtilsToken);
  if (isErr(objectAliasResult)) {
    return err(`Failed to register FoundryUtilsObject alias: ${objectAliasResult.error.message}`);
  }

  const htmlAliasResult = container.registerAlias(foundryUtilsHtmlToken, foundryUtilsToken);
  if (isErr(htmlAliasResult)) {
    return err(`Failed to register FoundryUtilsHtml alias: ${htmlAliasResult.error.message}`);
  }

  const asyncAliasResult = container.registerAlias(foundryUtilsAsyncToken, foundryUtilsToken);
  if (isErr(asyncAliasResult)) {
    return err(`Failed to register FoundryUtilsAsync alias: ${asyncAliasResult.error.message}`);
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "FoundryServices",
  priority: 80,
  execute: registerFoundryServices,
});
