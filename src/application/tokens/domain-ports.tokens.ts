/**
 * Domain Port Tokens for Dependency Injection.
 *
 * These tokens define injection points for domain port interfaces,
 * keeping the Application layer decoupled from Infrastructure-specific implementations.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { NotificationPort } from "@/domain/ports/notification-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { ContextMenuRegistrationPort } from "@/domain/ports/context-menu-registration-port.interface";

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
 * Platform-agnostic UI operations port (convenience interface combining JournalDirectoryUiPort and NotificationPort).
 * Use specific ports (journalDirectoryUiPortToken, notificationPortToken) when only one capability is needed.
 */
export const platformUIPortToken = createInjectionToken<PlatformUIPort>("PlatformUIPort");

/**
 * DI Token for JournalDirectoryUiPort.
 *
 * Platform-agnostic port for journal directory DOM operations.
 * Use this when only DOM manipulation is needed, not notifications.
 */
export const journalDirectoryUiPortToken =
  createInjectionToken<JournalDirectoryUiPort>("JournalDirectoryUiPort");

/**
 * DI Token for NotificationPort.
 *
 * Platform-agnostic port for user notifications.
 * Use this when only notifications are needed, not DOM manipulation.
 */
export const notificationPortToken = createInjectionToken<NotificationPort>("NotificationPort");

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
 * DI Token for JournalCollectionPort.
 *
 * Provides read-only access to journal entry collections.
 */
export const journalCollectionPortToken =
  createInjectionToken<JournalCollectionPort>("JournalCollectionPort");

/**
 * DI Token for JournalRepository.
 *
 * Provides full CRUD access to journal entries with batch operations and flag management.
 */
export const journalRepositoryToken = createInjectionToken<JournalRepository>("JournalRepository");

/**
 * DI Token for ContextMenuRegistrationPort.
 *
 * Platform-agnostic port for registering context menu callbacks.
 */
export const contextMenuRegistrationPortToken = createInjectionToken<ContextMenuRegistrationPort>(
  "ContextMenuRegistrationPort"
);
