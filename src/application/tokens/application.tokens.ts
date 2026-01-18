/**
 * Application Service Tokens for Dependency Injection.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types mehr!
 * Token-Generics werden erst beim resolve() aufgelöst.
 * Dies verhindert zirkuläre Dependencies zwischen Tokens und Services.
 *
 * These tokens define injection points for Application layer services.
 */
import { createUnsafeInjectionToken } from "@/application/di/unsafe-token-factory";

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalVisibilityServiceToken = createUnsafeInjectionToken("JournalVisibilityService");

/**
 * Injection token for the JournalVisibilityConfig.
 *
 * Configuration object for JournalVisibilityService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalVisibilityConfigToken = createUnsafeInjectionToken("JournalVisibilityConfig");

/**
 * DI Token for HideJournalContextMenuHandler.
 *
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const hideJournalContextMenuHandlerToken = createUnsafeInjectionToken(
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
export const journalContextMenuHandlersToken = createUnsafeInjectionToken(
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
export const journalDirectoryProcessorToken = createUnsafeInjectionToken(
  "JournalDirectoryProcessor"
);

/**
 * Injection token for the RuntimeConfigSync.
 *
 * Handles synchronization between Foundry Settings and RuntimeConfigService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const runtimeConfigSyncToken = createUnsafeInjectionToken("RuntimeConfigSync");

/**
 * Injection token for the RuntimeConfigSettingsSync.
 *
 * Encapsulates RuntimeConfig synchronization for Settings registration.
 * Separated from ModuleSettingsRegistrar to follow Single Responsibility Principle.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const runtimeConfigSettingsSyncToken = createUnsafeInjectionToken(
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
export const settingRegistrationErrorMapperToken = createUnsafeInjectionToken(
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
export const settingDefinitionRegistryToken = createUnsafeInjectionToken(
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
export const runtimeConfigBindingRegistryToken = createUnsafeInjectionToken(
  "RuntimeConfigBindingRegistry"
);

/**
 * Injection token for the ModuleSettingsRegistrar.
 *
 * Registers module settings during bootstrap.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const moduleSettingsRegistrarToken = createUnsafeInjectionToken("ModuleSettingsRegistrar");

/**
 * Injection token for the ModuleHealthService.
 *
 * Provides aggregated health status for the module.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const moduleHealthServiceToken = createUnsafeInjectionToken("ModuleHealthService");

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
export const batchUpdateContextServiceToken = createUnsafeInjectionToken(
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
export const journalDirectoryRerenderSchedulerToken = createUnsafeInjectionToken(
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
export const eventRegistrarRegistryToken = createUnsafeInjectionToken("EventRegistrarRegistry");

/**
 * Injection token for the JournalOverviewService.
 *
 * Service for retrieving all journals with their visibility status.
 * Combines data from PlatformJournalCollectionPort and JournalVisibilityService.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const journalOverviewServiceToken = createUnsafeInjectionToken("JournalOverviewService");

/**
 * Injection token for the MigrationService.
 *
 * Service for schema migration of relationship node and graph data.
 * Handles sequential migration with backup and rollback support.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const migrationServiceToken = createUnsafeInjectionToken("MigrationService");

/**
 * Injection token for the NodeDataService.
 *
 * Service for loading, saving, and validating relationship node data.
 * Includes schema validation and migration integration.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const nodeDataServiceToken = createUnsafeInjectionToken("NodeDataService");

/**
 * Injection token for the GraphDataService.
 *
 * Service for loading, saving, and validating relationship graph data.
 * Includes schema validation and migration integration.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const graphDataServiceToken = createUnsafeInjectionToken("GraphDataService");

/**
 * Injection token for the CreateNodePageUseCase.
 *
 * Use case for creating new relationship node pages.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const createNodePageUseCaseToken = createUnsafeInjectionToken("CreateNodePageUseCase");

/**
 * Injection token for the CreateGraphPageUseCase.
 *
 * Use case for creating new relationship graph pages.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const createGraphPageUseCaseToken = createUnsafeInjectionToken("CreateGraphPageUseCase");

/**
 * Injection token for the AddNodeToGraphUseCase.
 *
 * Use case for adding a node to a graph.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const addNodeToGraphUseCaseToken = createUnsafeInjectionToken("AddNodeToGraphUseCase");

/**
 * Injection token for the RemoveNodeFromGraphUseCase.
 *
 * Use case for removing a node from a graph.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const removeNodeFromGraphUseCaseToken = createUnsafeInjectionToken(
  "RemoveNodeFromGraphUseCase"
);

/**
 * Injection token for the UpsertEdgeUseCase.
 *
 * Use case for upserting (insert or update) an edge in a graph.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const upsertEdgeUseCaseToken = createUnsafeInjectionToken("UpsertEdgeUseCase");

/**
 * Injection token for the RemoveEdgeUseCase.
 *
 * Use case for removing an edge from a graph.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 */
export const removeEdgeUseCaseToken = createUnsafeInjectionToken("RemoveEdgeUseCase");
