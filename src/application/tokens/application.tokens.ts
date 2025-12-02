/**
 * Application Service Tokens for Dependency Injection.
 *
 * These tokens define injection points for Application layer services.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 */
export const journalVisibilityServiceToken = createInjectionToken<JournalVisibilityService>(
  "JournalVisibilityService"
);

/**
 * Injection token for the JournalVisibilityConfig.
 *
 * Configuration object for JournalVisibilityService.
 */
export const journalVisibilityConfigToken =
  createInjectionToken<JournalVisibilityConfig>("JournalVisibilityConfig");

/**
 * DI Token for HideJournalContextMenuHandler.
 *
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 */
export const hideJournalContextMenuHandlerToken =
  createInjectionToken<HideJournalContextMenuHandler>("HideJournalContextMenuHandler");

/**
 * DI Token for array of JournalContextMenuHandler instances.
 *
 * Allows multiple handlers to be registered and composed via DI.
 * Handlers are executed in the order they appear in the array.
 */
export const journalContextMenuHandlersToken = createInjectionToken<JournalContextMenuHandler[]>(
  "JournalContextMenuHandlers"
);
