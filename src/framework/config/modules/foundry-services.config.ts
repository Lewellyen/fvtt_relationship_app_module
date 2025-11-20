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
import { DIFoundryGameService } from "@/infrastructure/adapters/foundry/services/FoundryGameService";
import { DIFoundryHooksService } from "@/infrastructure/adapters/foundry/services/FoundryHooksService";
import { DIFoundryDocumentService } from "@/infrastructure/adapters/foundry/services/FoundryDocumentService";
import { DIFoundryUIService } from "@/infrastructure/adapters/foundry/services/FoundryUIService";
import { DIFoundrySettingsService } from "@/infrastructure/adapters/foundry/services/FoundrySettingsService";
import { DIFoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade";
import { DIFoundryJournalVisibilityAdapter } from "@/infrastructure/adapters/foundry/domain-adapters/journal-visibility-adapter";
import { DIJournalVisibilityService } from "@/application/services/JournalVisibilityService";

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
 * - FoundryJournalVisibilityAdapter (singleton) - must be registered before JournalVisibilityService
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
  // Implements JournalVisibilityPort for Foundry platform
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

  return ok(undefined);
}
