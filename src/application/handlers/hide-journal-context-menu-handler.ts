import type { JournalContextMenuHandler } from "./journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import {
  journalRepositoryToken,
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
    private readonly journalRepository: JournalRepository,
    private readonly platformUI: PlatformUIPort,
    private readonly notificationCenter: NotificationService
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
    const flagResult = this.journalRepository.getFlag(
      journalId,
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn nicht versteckt
    if (flagResult.ok && flagResult.value !== true) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (_li: HTMLElement) => {
          // Journal verstecken
          const hideResult = await this.journalRepository.setFlag(
            journalId,
            MODULE_CONSTANTS.MODULE.ID,
            MODULE_CONSTANTS.FLAGS.HIDDEN,
            true
          );

          if (hideResult.ok) {
            // Hole Journal-Eintrag über Repository, um den Namen zu bekommen
            const journalEntryResult = this.journalRepository.getById(journalId);
            const journalName =
              journalEntryResult.ok && journalEntryResult.value
                ? (journalEntryResult.value.name ?? journalId)
                : journalId; // Fallback auf ID, falls Name nicht verfügbar

            // Notification mit Journal-Namen (für UI)
            const notifyResult = this.platformUI.notify(
              `Journal "${journalName}" wurde ausgeblendet`,
              "info"
            );

            if (!notifyResult.ok) {
              this.notificationCenter.warn(
                "Failed to show notification after hiding journal",
                notifyResult.error,
                { channels: ["ConsoleChannel"] }
              );
            }

            // Log mit Journal-ID (für Debugging)
            this.notificationCenter.debug(
              `Journal ${journalId} (${journalName}) hidden via context menu`,
              { journalId, journalName },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notificationCenter.error(
              `Failed to hide journal ${journalId}`,
              { code: hideResult.error.code, message: hideResult.error.message },
              {
                channels: ["ConsoleChannel", "UINotificationChannel"],
              }
            );
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
    journalRepositoryToken,
    platformUIPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalRepository: JournalRepository,
    platformUI: PlatformUIPort,
    notificationCenter: NotificationService
  ) {
    super(journalRepository, platformUI, notificationCenter);
  }
}
