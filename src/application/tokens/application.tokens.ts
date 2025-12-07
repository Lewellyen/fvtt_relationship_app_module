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
