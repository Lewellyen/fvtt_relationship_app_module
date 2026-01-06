/**
 * Application Service Tokens for Dependency Injection.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types mehr!
 * Token-Generics werden erst beim resolve() aufgelöst.
 * Dies verhindert zirkuläre Dependencies zwischen Tokens und Services.
 *
 * These tokens define injection points for Application layer services.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/application/utils/token-factory";

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalVisibilityServiceToken = createInjectionToken<any>("JournalVisibilityService");

/**
 * Injection token for the JournalVisibilityConfig.
 *
 * Configuration object for JournalVisibilityService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalVisibilityConfigToken = createInjectionToken<any>("JournalVisibilityConfig");

/**
 * DI Token for HideJournalContextMenuHandler.
 *
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const hideJournalContextMenuHandlerToken = createInjectionToken<any>(
  "HideJournalContextMenuHandler"
);

/**
 * DI Token for array of JournalContextMenuHandler instances.
 *
 * Allows multiple handlers to be registered and composed via DI.
 * Handlers are executed in the order they appear in the array.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalContextMenuHandlersToken = createInjectionToken<any>(
  "JournalContextMenuHandlers"
);

/**
 * Injection token for the JournalDirectoryProcessor.
 *
 * Processes journal directory DOM to hide flagged entries.
 * Handles DOM manipulation and UI coordination.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalDirectoryProcessorToken = createInjectionToken<any>(
  "JournalDirectoryProcessor"
);

/**
 * Injection token for the RuntimeConfigSync.
 *
 * Handles synchronization between Foundry Settings and RuntimeConfigService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const runtimeConfigSyncToken = createInjectionToken<any>("RuntimeConfigSync");

/**
 * Injection token for the RuntimeConfigSettingsSync.
 *
 * Encapsulates RuntimeConfig synchronization for Settings registration.
 * Separated from ModuleSettingsRegistrar to follow Single Responsibility Principle.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const runtimeConfigSettingsSyncToken = createInjectionToken<any>(
  "RuntimeConfigSettingsSync"
);

/**
 * Injection token for the SettingRegistrationErrorMapper.
 *
 * Maps DomainSettingsError to notification format.
 * Single Responsibility: Only handles error format conversion and notification.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const settingRegistrationErrorMapperToken = createInjectionToken<any>(
  "SettingRegistrationErrorMapper"
);

/**
 * Injection token for the SettingDefinitionRegistry.
 *
 * Registry that provides setting definitions for registration.
 * Enables Open/Closed Principle: new settings can be added via registry extension
 * without modifying ModuleSettingsRegistrar.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const settingDefinitionRegistryToken = createInjectionToken<any>(
  "SettingDefinitionRegistry"
);

/**
 * Injection token for the RuntimeConfigBindingRegistry.
 *
 * Registry that provides runtime config bindings for settings.
 * Enables Open/Closed Principle: new bindings can be added via registry extension
 * without modifying ModuleSettingsRegistrar.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const runtimeConfigBindingRegistryToken = createInjectionToken<any>(
  "RuntimeConfigBindingRegistry"
);

/**
 * Injection token for the BatchUpdateContextService.
 *
 * Service for tracking journal IDs during batch update operations.
 * Allows use-cases to mark multiple journal IDs as part of a batch operation,
 * which can be checked by event handlers to optimize behavior (e.g., skip individual re-renders).
 *
 * @deprecated This service is being replaced by JournalDirectoryRerenderScheduler
 * which uses debounce/coalesce instead of batch tracking.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const batchUpdateContextServiceToken = createInjectionToken<any>(
  "BatchUpdateContextService"
);

/**
 * Injection token for the JournalDirectoryRerenderScheduler.
 *
 * Service for scheduling journal directory re-renders with debounce/coalesce.
 * Collects multiple re-render requests and executes a single re-render
 * after a delay of inactivity (debounce).
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalDirectoryRerenderSchedulerToken = createInjectionToken<any>(
  "JournalDirectoryRerenderScheduler"
);

/**
 * Injection token for the EventRegistrarRegistry.
 *
 * Registry that provides event registrars for registration.
 * Enables Open/Closed Principle: new event registrars can be added via registry extension
 * without modifying ModuleEventRegistrar.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const eventRegistrarRegistryToken = createInjectionToken<any>("EventRegistrarRegistry");

/**
 * Injection token for the JournalOverviewService.
 *
 * Service for retrieving all journals with their visibility status.
 * Combines data from PlatformJournalCollectionPort and JournalVisibilityService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalOverviewServiceToken = createInjectionToken<any>("JournalOverviewService");
