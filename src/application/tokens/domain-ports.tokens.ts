/**
 * Domain Port Tokens for Dependency Injection.
 *
 * These tokens define injection points for domain port interfaces,
 * keeping the Application layer decoupled from Infrastructure-specific implementations.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { PlatformUINotificationPort } from "@/domain/ports/platform-ui-notification-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformMetricsSnapshotPort } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";

/**
 * DI Token for PlatformNotificationPort.
 *
 * Platform-agnostic notification port.
 */
export const platformNotificationPortToken = createInjectionToken<PlatformNotificationPort>(
  "PlatformNotificationPort"
);

/**
 * DI Token for PlatformCachePort.
 *
 * Platform-agnostic cache port.
 */
export const platformCachePortToken = createInjectionToken<PlatformCachePort>("PlatformCachePort");

/**
 * DI Token for PlatformI18nPort.
 *
 * Platform-agnostic i18n port.
 */
export const platformI18nPortToken = createInjectionToken<PlatformI18nPort>("PlatformI18nPort");

/**
 * DI Token for PlatformUIPort.
 *
 * Platform-agnostic UI operations port (convenience interface combining PlatformJournalDirectoryUiPort and PlatformUINotificationPort).
 * Use specific ports (platformJournalDirectoryUiPortToken, platformUINotificationPortToken) when only one capability is needed.
 */
export const platformUIPortToken = createInjectionToken<PlatformUIPort>("PlatformUIPort");

/**
 * DI Token for PlatformJournalDirectoryUiPort.
 *
 * Platform-agnostic port for journal directory DOM operations.
 * Use this when only DOM manipulation is needed, not notifications.
 */
export const platformJournalDirectoryUiPortToken =
  createInjectionToken<PlatformJournalDirectoryUiPort>("PlatformJournalDirectoryUiPort");

/**
 * DI Token for PlatformUINotificationPort.
 *
 * Platform-agnostic port for user notifications.
 * Use this when only notifications are needed, not DOM manipulation.
 */
export const platformUINotificationPortToken = createInjectionToken<PlatformUINotificationPort>(
  "PlatformUINotificationPort"
);

/**
 * DI Token for PlatformSettingsPort.
 *
 * Platform-agnostic settings port.
 */
export const platformSettingsPortToken =
  createInjectionToken<PlatformSettingsPort>("PlatformSettingsPort");

/**
 * DI Token for PlatformJournalEventPort.
 *
 * Platform-agnostic journal event port.
 */
export const platformJournalEventPortToken = createInjectionToken<PlatformJournalEventPort>(
  "PlatformJournalEventPort"
);

/**
 * DI Token for PlatformJournalCollectionPort.
 *
 * Provides read-only access to journal entry collections.
 */
export const platformJournalCollectionPortToken =
  createInjectionToken<PlatformJournalCollectionPort>("PlatformJournalCollectionPort");

/**
 * DI Token for PlatformJournalRepository.
 *
 * Provides full CRUD access to journal entries with batch operations and flag management.
 */
export const platformJournalRepositoryToken = createInjectionToken<PlatformJournalRepository>(
  "PlatformJournalRepository"
);

/**
 * DI Token for PlatformContextMenuRegistrationPort.
 *
 * Platform-agnostic port for registering context menu callbacks.
 */
export const platformContextMenuRegistrationPortToken =
  createInjectionToken<PlatformContextMenuRegistrationPort>("PlatformContextMenuRegistrationPort");

/**
 * DI Token for PlatformValidationPort.
 *
 * Platform-agnostic validation port.
 */
export const platformValidationPortToken =
  createInjectionToken<PlatformValidationPort>("PlatformValidationPort");

/**
 * DI Token for PlatformLoggingPort.
 *
 * Platform-agnostic logging port.
 */
export const platformLoggingPortToken =
  createInjectionToken<PlatformLoggingPort>("PlatformLoggingPort");

/**
 * DI Token for PlatformMetricsSnapshotPort.
 *
 * Platform-agnostic metrics snapshot port.
 */
export const platformMetricsSnapshotPortToken = createInjectionToken<PlatformMetricsSnapshotPort>(
  "PlatformMetricsSnapshotPort"
);

/**
 * DI Token for PlatformContainerPort.
 *
 * Platform-agnostic container port for service resolution and validation state.
 */
export const platformContainerPortToken =
  createInjectionToken<PlatformContainerPort>("PlatformContainerPort");
