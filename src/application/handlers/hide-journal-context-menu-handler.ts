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

    // WICHTIG: Prüfung auf existingItem entfernt!
    // Grund: JournalContextMenuLibWrapperService entfernt bereits alte Einträge,
    // aber wir müssen trotzdem einen neuen Eintrag mit der korrekten journalId erstellen.
    // Die Prüfung würde verhindern, dass wir einen neuen Eintrag mit korrekter ID erstellen,
    // wenn bereits ein alter Eintrag mit falscher ID existiert.

    // Prüfe, ob Journal bereits versteckt ist
    const flagResult = this.journalRepository.getFlag(
      journalId,
      MODULE_METADATA.ID,
      DOMAIN_FLAGS.HIDDEN
    );

    // Nur hinzufügen, wenn nicht versteckt
    if (flagResult.ok && flagResult.value !== true) {
      // Speichere journalId aus Event für Validierung im Callback
      const eventJournalId = journalId;

      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (journalIdParam: string) => {
          // Validierung: Prüfe, ob journalIdParam mit Event-journalId übereinstimmt
          if (journalIdParam !== eventJournalId) {
            this.notifications.error(
              `Journal ID mismatch in context menu callback: expected ${eventJournalId}, got ${journalIdParam}`,
              {
                code: "JOURNAL_ID_MISMATCH",
                message: `Expected journalId ${eventJournalId} but received ${journalIdParam}`,
                details: {
                  expectedJournalId: eventJournalId,
                  receivedJournalId: journalIdParam,
                },
              },
              { channels: ["ConsoleChannel"] }
            );
            return;
          }

          // Journal verstecken - verwende journalIdParam (vom System übergeben) statt Closure-Variable
          // journalIdParam enthält die korrekte Journal-ID für diesen spezifischen Callback
          const hideResult = await this.journalRepository.setFlag(
            journalIdParam,
            MODULE_METADATA.ID,
            DOMAIN_FLAGS.HIDDEN,
            true
          );

          if (hideResult.ok) {
            // Hole Journal-Eintrag über Repository, um den Namen zu bekommen
            const journalEntryResult = this.journalRepository.getById(journalIdParam);
            const journalName =
              journalEntryResult.ok && journalEntryResult.value
                ? (journalEntryResult.value.name ?? journalIdParam)
                : journalIdParam; // Fallback auf ID, falls Name nicht verfügbar

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
              `Journal ${journalIdParam} (${journalName}) hidden via context menu`,
              { journalId: journalIdParam, journalName },
              { channels: ["ConsoleChannel"] }
            );
          } else {
            this.notifications.error(
              `Failed to hide journal ${journalIdParam}`,
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
