import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import { notificationCenterToken } from "@/application/tokens/notifications/notification-center.token";
import {
  journalVisibilityServiceToken,
  journalDirectoryProcessorToken,
  graphDataServiceToken,
  nodeDataServiceToken,
} from "@/application/tokens/application.tokens";
import { i18nFacadeToken } from "@/infrastructure/shared/tokens/i18n/i18n-facade.token";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { foundryJournalFacadeToken } from "@/infrastructure/shared/tokens/foundry/foundry-journal-facade.token";
import { foundryUtilsToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils.token";
import { foundryUtilsUuidToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-uuid.token";
import { foundryUtilsObjectToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-object.token";
import { foundryUtilsHtmlToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-html.token";
import { foundryUtilsAsyncToken } from "@/infrastructure/shared/tokens/foundry/foundry-utils-async.token";
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
    journalDirectoryProcessorToken: markAsApiSafe(journalDirectoryProcessorToken),
    foundryGameToken: markAsApiSafe(foundryGameToken),
    foundryHooksToken: markAsApiSafe(foundryHooksToken),
    foundryDocumentToken: markAsApiSafe(foundryDocumentToken),
    foundryUIToken: markAsApiSafe(foundryUIToken),
    foundrySettingsToken: markAsApiSafe(foundrySettingsToken),
    i18nFacadeToken: markAsApiSafe(i18nFacadeToken),
    foundryJournalFacadeToken: markAsApiSafe(foundryJournalFacadeToken),
    graphDataServiceToken: markAsApiSafe(graphDataServiceToken),
    nodeDataServiceToken: markAsApiSafe(nodeDataServiceToken),
    foundryUtilsToken: markAsApiSafe(foundryUtilsToken),
    foundryUtilsUuidToken: markAsApiSafe(foundryUtilsUuidToken),
    foundryUtilsObjectToken: markAsApiSafe(foundryUtilsObjectToken),
    foundryUtilsHtmlToken: markAsApiSafe(foundryUtilsHtmlToken),
    foundryUtilsAsyncToken: markAsApiSafe(foundryUtilsAsyncToken),
  };
}
