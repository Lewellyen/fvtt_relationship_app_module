import type { JournalContextMenuHandler } from "./journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import {
  platformJournalRepositoryToken,
  platformUIPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";

/**
 * Handler that adds "Journal ausblenden" menu item to journal context menus.
 *
 * This handler checks if a journal is already hidden and only adds the menu item
 * if the journal is not hidden. When clicked, it sets the HIDDEN flag and shows a notification.
 */
export class HideJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalRepository: PlatformJournalRepository,
    private readonly platformUI: PlatformUIPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  handle(event: JournalContextMenuEvent): void {
    // Journal-ID ist bereits im Event enthalten (DIP-compliant)
    const journalId = event.journalId;

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
      MODULE_METADATA.ID,
      DOMAIN_FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn nicht versteckt
    if (flagResult.ok && flagResult.value !== true) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (_journalId: string) => {
          // Journal verstecken
          const hideResult = await this.journalRepository.setFlag(
            journalId,
            MODULE_METADATA.ID,
            DOMAIN_FLAGS.HIDDEN,
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
              this.notifications.warn(
                "Failed to show notification after hiding journal",
                notifyResult.error,
                { channels: ["ConsoleChannel"] }
              );
            }

            // Log mit Journal-ID (für Debugging)
            this.notifications.debug(
              `Journal ${journalId} (${journalName}) hidden via context menu`,
              { journalId, journalName },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notifications.error(
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
}

/**
 * DI-enabled wrapper for HideJournalContextMenuHandler.
 */
export class DIHideJournalContextMenuHandler extends HideJournalContextMenuHandler {
  static dependencies = [
    platformJournalRepositoryToken,
    platformUIPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalRepository: PlatformJournalRepository,
    platformUI: PlatformUIPort,
    notifications: NotificationPublisherPort
  ) {
    super(journalRepository, platformUI, notifications);
  }
}
