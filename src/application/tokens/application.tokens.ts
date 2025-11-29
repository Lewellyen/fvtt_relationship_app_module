/**
 * Application Service Tokens for Dependency Injection.
 *
 * These tokens define injection points for Application layer services.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";

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
