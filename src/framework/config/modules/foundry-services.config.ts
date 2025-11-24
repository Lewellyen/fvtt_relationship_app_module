import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryJournalFacadeToken,
} from "@/infrastructure/shared/tokens";
import {
  journalVisibilityServiceToken,
  journalVisibilityPortToken,
} from "@/infrastructure/shared/tokens";
import { DIFoundryGamePort } from "@/infrastructure/adapters/foundry/services/FoundryGamePort";
import { DIFoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import { DIFoundryDocumentPort } from "@/infrastructure/adapters/foundry/services/FoundryDocumentPort";
import { DIFoundryUIPort } from "@/infrastructure/adapters/foundry/services/FoundryUIPort";
import { DIFoundrySettingsPort } from "@/infrastructure/adapters/foundry/services/FoundrySettingsPort";
import { DIFoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade";
import { DIFoundryJournalVisibilityAdapter } from "@/infrastructure/adapters/foundry/domain-adapters/journal-visibility-adapter";
import { DIJournalVisibilityService } from "@/application/services/JournalVisibilityService";
import { DIFoundryLibWrapperService } from "@/infrastructure/adapters/foundry/services/FoundryLibWrapperService";
import { DIJournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import {
  libWrapperServiceToken,
  journalContextMenuLibWrapperServiceToken,
} from "@/infrastructure/shared/tokens";

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
 * - FoundryJournalVisibilityAdapter (singleton) - must be registered before JournalVisibilityService
 * - JournalVisibilityService (singleton)
 * - FoundryLibWrapperService (singleton) - Facade for libWrapper
 * - JournalContextMenuLibWrapperService (singleton) - Manages libWrapper for journal context menu
 *
 * All services use port-based adapter pattern for Foundry version compatibility.
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

  // Register FoundryJournalFacade
  // Combines Game, Document, UI for journal operations
  // Must be registered BEFORE FoundryJournalVisibilityAdapter which depends on it
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    DIFoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
  }

  // Register FoundryJournalVisibilityAdapter
  // Implements PlatformJournalVisibilityPort for Foundry platform
  // Must be registered BEFORE JournalVisibilityService which depends on it
  const adapterResult = container.registerClass(
    journalVisibilityPortToken,
    DIFoundryJournalVisibilityAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(adapterResult)) {
    return err(`Failed to register JournalVisibilityAdapter: ${adapterResult.error.message}`);
  }

  // Register JournalVisibilityService
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

  return ok(undefined);
}
