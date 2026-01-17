import { markAsApiSafe } from "@/infrastructure/di/types/utilities/api-safe-token";
import {
  platformContainerPortToken,
  platformLoggingPortToken,
  platformMetricsSnapshotPortToken,
  platformSettingsPortToken,
  platformSettingsRegistrationPortToken,
  platformI18nPortToken,
  platformNotificationPortToken,
  platformUIPortToken,
  platformJournalDirectoryUiPortToken,
  platformJournalCollectionPortToken,
  platformUINotificationPortToken,
  platformValidationPortToken,
  platformContextMenuRegistrationPortToken,
  platformUuidUtilsPortToken,
  platformObjectUtilsPortToken,
  platformHtmlUtilsPortToken,
  platformAsyncUtilsPortToken,
} from "@/application/tokens/domain-ports.tokens";
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
    platformContainerPortToken: markAsApiSafe(platformContainerPortToken),
    platformLoggingPortToken: markAsApiSafe(platformLoggingPortToken),
    platformMetricsSnapshotPortToken: markAsApiSafe(platformMetricsSnapshotPortToken),
    platformSettingsPortToken: markAsApiSafe(platformSettingsPortToken),
    platformSettingsRegistrationPortToken: markAsApiSafe(platformSettingsRegistrationPortToken),
    platformI18nPortToken: markAsApiSafe(platformI18nPortToken),
    platformNotificationPortToken: markAsApiSafe(platformNotificationPortToken),
    platformUIPortToken: markAsApiSafe(platformUIPortToken),
    platformJournalDirectoryUiPortToken: markAsApiSafe(platformJournalDirectoryUiPortToken),
    platformJournalCollectionPortToken: markAsApiSafe(platformJournalCollectionPortToken),
    platformUINotificationPortToken: markAsApiSafe(platformUINotificationPortToken),
    platformValidationPortToken: markAsApiSafe(platformValidationPortToken),
    platformContextMenuRegistrationPortToken: markAsApiSafe(
      platformContextMenuRegistrationPortToken
    ),
    platformUuidUtilsPortToken: markAsApiSafe(platformUuidUtilsPortToken),
    platformObjectUtilsPortToken: markAsApiSafe(platformObjectUtilsPortToken),
    platformHtmlUtilsPortToken: markAsApiSafe(platformHtmlUtilsPortToken),
    platformAsyncUtilsPortToken: markAsApiSafe(platformAsyncUtilsPortToken),
  };
}
