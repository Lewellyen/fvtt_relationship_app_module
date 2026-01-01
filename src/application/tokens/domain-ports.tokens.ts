/**
 * Domain Port Tokens for Dependency Injection.
 *
 * These tokens define injection points for domain port interfaces,
 * keeping the Application layer decoupled from Infrastructure-specific implementations.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { NotificationChannelRegistryPort } from "@/domain/ports/notifications/notification-channel-registry-port.interface";
import type { CacheReaderPort } from "@/domain/ports/cache/cache-reader-port.interface";
import type { CacheWriterPort } from "@/domain/ports/cache/cache-writer-port.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { CacheStatsPort } from "@/domain/ports/cache/cache-stats-port.interface";
import type { CacheComputePort } from "@/domain/ports/cache/cache-compute-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { PlatformUINotificationPort } from "@/domain/ports/platform-ui-notification-port.interface";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { PlatformJournalUiEventPort } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformMetricsSnapshotPort } from "@/domain/ports/platform-metrics-snapshot-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { PlatformModuleReadyPort } from "@/domain/ports/platform-module-ready-port.interface";
import type { PlatformChannelPort } from "@/domain/ports/notifications/platform-channel-port.interface";
import type { PlatformUINotificationChannelPort } from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { PlatformConsoleChannelPort } from "@/domain/ports/notifications/platform-console-channel-port.interface";
import type { PlatformUIAvailabilityPort } from "@/domain/ports/platform-ui-availability-port.interface";

/**
 * DI Token for PlatformNotificationPort.
 *
 * Platform-agnostic notification port (combines NotificationPublisherPort and NotificationChannelRegistryPort).
 * Use this when you need both notification publishing and channel management.
 *
 * For notification publishing only, use notificationPublisherPortToken.
 * For channel management only, use notificationChannelRegistryPortToken.
 */
export const platformNotificationPortToken = createInjectionToken<PlatformNotificationPort>(
  "PlatformNotificationPort"
);

/**
 * DI Token for NotificationPublisherPort.
 *
 * Platform-agnostic port for publishing notifications (debug, info, warn, error).
 * Use this when you only need to send notifications and don't need channel management.
 *
 * Follows Interface Segregation Principle (ISP) by providing only notification publishing methods.
 */
export const notificationPublisherPortToken = createInjectionToken<NotificationPublisherPort>(
  "NotificationPublisherPort"
);

/**
 * DI Token for NotificationChannelRegistryPort.
 *
 * Platform-agnostic port for managing notification channels (addChannel, removeChannel, getChannelNames).
 * Use this when you only need to manage channels and don't need to send notifications.
 *
 * Follows Interface Segregation Principle (ISP) by providing only channel management methods.
 */
export const notificationChannelRegistryPortToken =
  createInjectionToken<NotificationChannelRegistryPort>("NotificationChannelRegistryPort");

/**
 * DI Token for CacheReaderPort.
 *
 * Platform-agnostic cache read operations port.
 * Use this when you only need to read from cache (get, has, getMetadata).
 */
export const cacheReaderPortToken = createInjectionToken<CacheReaderPort>("CacheReaderPort");

/**
 * DI Token for CacheWriterPort.
 *
 * Platform-agnostic cache write operations port.
 * Use this when you only need to write to cache (set, delete, clear).
 */
export const cacheWriterPortToken = createInjectionToken<CacheWriterPort>("CacheWriterPort");

/**
 * DI Token for CacheInvalidationPort.
 *
 * Platform-agnostic cache invalidation port.
 * Use this when you only need to invalidate cache entries (invalidateWhere).
 */
export const cacheInvalidationPortToken =
  createInjectionToken<CacheInvalidationPort>("CacheInvalidationPort");

/**
 * DI Token for CacheStatsPort.
 *
 * Platform-agnostic cache statistics port.
 * Use this when you only need cache statistics (getStatistics, size, isEnabled).
 */
export const cacheStatsPortToken = createInjectionToken<CacheStatsPort>("CacheStatsPort");

/**
 * DI Token for CacheComputePort.
 *
 * Platform-agnostic cache compute port.
 * Use this when you only need the get-or-set pattern (getOrSet).
 */
export const cacheComputePortToken = createInjectionToken<CacheComputePort>("CacheComputePort");

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
 * Platform-agnostic journal lifecycle event port (created, updated, deleted).
 * For UI-specific events (directory render, context menu), use platformJournalUiEventPortToken.
 */
export const platformJournalEventPortToken = createInjectionToken<PlatformJournalEventPort>(
  "PlatformJournalEventPort"
);

/**
 * DI Token for PlatformJournalUiEventPort.
 *
 * Platform-agnostic journal UI event port (directory render, context menu).
 * Separated from PlatformJournalEventPort to maintain DIP compliance (no DOM types in domain).
 */
export const platformJournalUiEventPortToken = createInjectionToken<PlatformJournalUiEventPort>(
  "PlatformJournalUiEventPort"
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

/**
 * DI Token for PlatformSettingsRegistrationPort.
 *
 * Domain-neutral settings port that doesn't expose Valibot schemas.
 * Uses validator functions instead of schemas for type safety.
 *
 * This port is preferred over PlatformSettingsPort when the caller
 * doesn't need Valibot schema validation (e.g., in application layer).
 */
export const platformSettingsRegistrationPortToken =
  createInjectionToken<PlatformSettingsRegistrationPort>("PlatformSettingsRegistrationPort");

/**
 * DI Token for PlatformModuleReadyPort.
 *
 * Platform-agnostic port for managing module ready state.
 * Used to set module.ready = true when bootstrap is complete.
 */
export const platformModuleReadyPortToken =
  createInjectionToken<PlatformModuleReadyPort>("PlatformModuleReadyPort");

/**
 * DI Token for PlatformChannelPort.
 *
 * Platform-agnostic port for notification channels.
 * Base interface for all channel types.
 */
export const platformChannelPortToken =
  createInjectionToken<PlatformChannelPort>("PlatformChannelPort");

/**
 * DI Token for PlatformUINotificationChannelPort.
 *
 * Platform-agnostic port for UI notification channels.
 * Specialized channel port for user interface notifications.
 */
export const platformUINotificationChannelPortToken =
  createInjectionToken<PlatformUINotificationChannelPort>("PlatformUINotificationChannelPort");

/**
 * DI Token for PlatformConsoleChannelPort.
 *
 * Platform-agnostic port for console logging channels.
 * Specialized channel port for console output.
 */
export const platformConsoleChannelPortToken = createInjectionToken<PlatformConsoleChannelPort>(
  "PlatformConsoleChannelPort"
);

/**
 * DI Token for PlatformUIAvailabilityPort.
 *
 * Platform-agnostic port for checking UI availability.
 */
export const platformUIAvailabilityPortToken = createInjectionToken<PlatformUIAvailabilityPort>(
  "PlatformUIAvailabilityPort"
);
