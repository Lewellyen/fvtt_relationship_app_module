import type { Result } from "@/domain/types/result";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { BatchUpdateContextService } from "@/application/services/BatchUpdateContextService";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import {
  platformJournalEventPortToken,
  platformJournalDirectoryUiPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { batchUpdateContextServiceToken } from "@/application/tokens/application.tokens";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";

/**
 * Use-Case: Trigger journal directory re-render when hidden flag changes.
 *
 * Fully platform-agnostic through PlatformJournalEventPort and PlatformUIPort.
 *
 * Uses BatchUpdateContextService to skip re-renders during batch updates,
 * optimizing performance when multiple journals are updated at once.
 *
 * @example
 * ```typescript
 * const useCase = new TriggerJournalDirectoryReRenderUseCase(
 *   journalEventPort,
 *   platformUI,
 *   notifications,
 *   batchContext
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class TriggerJournalDirectoryReRenderUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: PlatformJournalEventPort,
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly notifications: NotificationPublisherPort,
    private readonly batchContext: BatchUpdateContextService
  ) {}

  /**
   * Register event listener for journal update events.
   */
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalUpdated((event) => {
      // Prüfe, ob hidden flag geändert wurde
      // Flags werden in Foundry unter einem Scope gespeichert: flags[moduleId][flagKey]
      const moduleId = MODULE_METADATA.ID;
      const flagKey = DOMAIN_FLAGS.HIDDEN;

      const moduleFlags = event.changes.flags?.[moduleId];
      if (moduleFlags && typeof moduleFlags === "object" && flagKey in moduleFlags) {
        // Skip re-render if this journal is part of a batch update
        // The batch operation will trigger a single re-render at the end
        if (this.batchContext.isInBatch(event.journalId)) {
          this.notifications.debug(
            "Skipping journal directory re-render during batch update",
            { journalId: event.journalId },
            { channels: ["ConsoleChannel"] }
          );
          return;
        }

        this.triggerReRender(event.journalId);
      }
    });

    if (result.ok) {
      this.registrationId = result.value;
      return ok(undefined);
    } else {
      return err(new Error(result.error.message));
    }
  }

  /**
   * Trigger journal directory re-render.
   */
  private triggerReRender(journalId: string): void {
    const result = this.journalDirectoryUI.rerenderJournalDirectory();

    if (!result.ok) {
      this.notifications.warn(
        "Failed to re-render journal directory after hidden flag change",
        result.error,
        { channels: ["ConsoleChannel"] }
      );
      return;
    }

    if (result.value) {
      this.notifications.debug(
        "Triggered journal directory re-render after hidden flag change",
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }

  /**
   * Cleanup: Unregister event listener.
   */
  dispose(): void {
    if (this.registrationId !== undefined) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = undefined;
    }
  }
}

/**
 * DI-enabled wrapper for TriggerJournalDirectoryReRenderUseCase.
 */
export class DITriggerJournalDirectoryReRenderUseCase extends TriggerJournalDirectoryReRenderUseCase {
  static dependencies = [
    platformJournalEventPortToken,
    platformJournalDirectoryUiPortToken,
    notificationPublisherPortToken,
    batchUpdateContextServiceToken,
  ] as const;

  constructor(
    journalEvents: PlatformJournalEventPort,
    journalDirectoryUI: PlatformJournalDirectoryUiPort,
    notifications: NotificationPublisherPort,
    batchContext: BatchUpdateContextService
  ) {
    super(journalEvents, journalDirectoryUI, notifications, batchContext);
  }
}
