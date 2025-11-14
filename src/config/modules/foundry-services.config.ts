import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryJournalFacadeToken,
} from "@/foundry/foundrytokens";
import { journalVisibilityServiceToken } from "@/tokens/tokenindex";
import { DIFoundryGameService } from "@/foundry/services/FoundryGameService";
import { DIFoundryHooksService } from "@/foundry/services/FoundryHooksService";
import { DIFoundryDocumentService } from "@/foundry/services/FoundryDocumentService";
import { DIFoundryUIService } from "@/foundry/services/FoundryUIService";
import { DIFoundrySettingsService } from "@/foundry/services/FoundrySettingsService";
import { DIFoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade";
import { DIJournalVisibilityService } from "@/services/JournalVisibilityService";

/**
 * Registers Foundry service wrappers.
 *
 * Services registered:
 * - FoundryGameService (singleton)
 * - FoundryHooksService (singleton)
 * - FoundryDocumentService (singleton)
 * - FoundryUIService (singleton)
 * - FoundrySettingsService (singleton)
 * - FoundryJournalFacade (singleton)
 * - JournalVisibilityService (singleton)
 *
 * All services use port-based adapter pattern for Foundry version compatibility.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerFoundryServices(container: ServiceContainer): Result<void, string> {
  // Register FoundryGameService
  const gameServiceResult = container.registerClass(
    foundryGameToken,
    DIFoundryGameService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(gameServiceResult)) {
    return err(`Failed to register FoundryGame service: ${gameServiceResult.error.message}`);
  }

  // Register FoundryHooksService
  const hooksServiceResult = container.registerClass(
    foundryHooksToken,
    DIFoundryHooksService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(hooksServiceResult)) {
    return err(`Failed to register FoundryHooks service: ${hooksServiceResult.error.message}`);
  }

  // Register FoundryDocumentService
  const documentServiceResult = container.registerClass(
    foundryDocumentToken,
    DIFoundryDocumentService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(documentServiceResult)) {
    return err(
      `Failed to register FoundryDocument service: ${documentServiceResult.error.message}`
    );
  }

  // Register FoundryUIService
  const uiServiceResult = container.registerClass(
    foundryUIToken,
    DIFoundryUIService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(uiServiceResult)) {
    return err(`Failed to register FoundryUI service: ${uiServiceResult.error.message}`);
  }

  // Register FoundrySettingsService
  const settingsServiceResult = container.registerClass(
    foundrySettingsToken,
    DIFoundrySettingsService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsServiceResult)) {
    return err(
      `Failed to register FoundrySettings service: ${settingsServiceResult.error.message}`
    );
  }

  // Register FoundryJournalFacade
  // Combines Game, Document, UI for journal operations
  // Must be registered BEFORE JournalVisibilityService which depends on it
  const journalFacadeResult = container.registerClass(
    foundryJournalFacadeToken,
    DIFoundryJournalFacade,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(journalFacadeResult)) {
    return err(`Failed to register FoundryJournalFacade: ${journalFacadeResult.error.message}`);
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

  return ok(undefined);
}
