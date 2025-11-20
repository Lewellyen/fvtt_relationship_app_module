import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import {
  notificationCenterToken,
  journalVisibilityServiceToken,
  i18nFacadeToken,
} from "@/infrastructure/shared/tokens";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundrySettingsToken,
  foundryJournalFacadeToken,
} from "@/infrastructure/shared/tokens";
import type { ModuleApiTokens } from "@/framework/core/api/module-api";

/**
 * Creates the well-known API tokens collection.
 *
 * All internal tokens are marked as API-safe for external consumption.
 * This factory is called during API initialization phase.
 *
 * @returns Type-safe token collection for external modules
 */
export function createApiTokens(): ModuleApiTokens {
  return {
    notificationCenterToken: markAsApiSafe(notificationCenterToken),
    journalVisibilityServiceToken: markAsApiSafe(journalVisibilityServiceToken),
    foundryGameToken: markAsApiSafe(foundryGameToken),
    foundryHooksToken: markAsApiSafe(foundryHooksToken),
    foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
    foundryUIToken: markAsApiSafe(foundryUIToken),
    foundrySettingsToken: markAsApiSafe(foundrySettingsToken),
    i18nFacadeToken: markAsApiSafe(i18nFacadeToken),
    foundryJournalFacadeToken: markAsApiSafe(foundryJournalFacadeToken),
  };
}
