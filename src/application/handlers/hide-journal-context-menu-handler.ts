import type { JournalContextMenuHandler } from "./journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";
import type { JournalVisibilityPort } from "@/domain/ports/journal-visibility-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import {
  journalVisibilityPortToken,
  platformUIPortToken,
  notificationCenterToken,
} from "@/infrastructure/shared/tokens";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

/**
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 *
 * This handler checks if a journal is already hidden and only adds the menu item
 * if the journal is not hidden. When clicked, it sets the HIDDEN flag and shows a notification.
 */
export class HideJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalVisibility: JournalVisibilityPort,
    private readonly platformUI: PlatformUIPort,
    private readonly notificationCenter: NotificationCenter
  ) {}

  handle(event: JournalContextMenuEvent): void {
    // Extrahiere Journal-ID aus HTML-Element
    const journalId = this.extractJournalId(event.htmlElement);

    if (!journalId) {
      return; // Kein Journal-Eintrag
    }

    // Prüfe, ob unser MenuItem bereits existiert
    const existingItem = event.options.find((item) => item.name === "Journal ausblenden");

    if (existingItem) {
      return; // Bereits hinzugefügt
    }

    // Prüfe, ob Journal bereits versteckt ist
    const flagResult = this.journalVisibility.getEntryFlag(
      { id: journalId, name: null },
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn nicht versteckt
    if (flagResult.ok && flagResult.value !== true) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (_li: HTMLElement) => {
          // Journal verstecken
          const hideResult = await this.journalVisibility.setEntryFlag(
            { id: journalId, name: null },
            MODULE_CONSTANTS.FLAGS.HIDDEN,
            true
          );

          if (hideResult.ok) {
            const notifyResult = this.platformUI.notify(
              `Journal "${journalId}" wurde ausgeblendet`,
              "info"
            );

            if (!notifyResult.ok) {
              this.notificationCenter.warn(
                "Failed to show notification after hiding journal",
                notifyResult.error,
                { channels: ["ConsoleChannel"] }
              );
            }

            this.notificationCenter.debug(
              `Journal ${journalId} hidden via context menu`,
              { journalId },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notificationCenter.error(`Failed to hide journal ${journalId}`, hideResult.error, {
              channels: ["ConsoleChannel", "UINotificationChannel"],
            });
          }
        },
      });
    }
  }

  /**
   * Extract journal ID from an HTML element.
   */
  private extractJournalId(element: HTMLElement): string | null {
    // Foundry v13 uses data-document-id, older versions used data-entry-id
    const documentId = element.getAttribute("data-document-id");
    if (documentId) return documentId;

    const entryId = element.getAttribute("data-entry-id");
    if (entryId) return entryId;

    return null;
  }
}

/**
 * DI-enabled wrapper for HideJournalContextMenuHandler.
 */
export class DIHideJournalContextMenuHandler extends HideJournalContextMenuHandler {
  static dependencies = [
    journalVisibilityPortToken,
    platformUIPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalVisibility: JournalVisibilityPort,
    platformUI: PlatformUIPort,
    notificationCenter: NotificationCenter
  ) {
    super(journalVisibility, platformUI, notificationCenter);
  }
}
