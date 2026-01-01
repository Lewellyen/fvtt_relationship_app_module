import type { Result } from "@/domain/types/result";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import {
  platformJournalEventPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { journalDirectoryRerenderSchedulerToken } from "@/application/tokens/application.tokens";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";

/**
 * Use-Case: Trigger journal directory re-render when hidden flag changes.
 *
 * Fully platform-agnostic through PlatformJournalEventPort.
 *
 * Uses JournalDirectoryRerenderScheduler to debounce/coalesce multiple re-render requests,
 * optimizing performance when multiple journals are updated at once.
 *
 * @example
 * ```typescript
 * const useCase = new TriggerJournalDirectoryReRenderUseCase(
 *   journalEventPort,
 *   scheduler,
 *   notifications
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
    private readonly scheduler: JournalDirectoryRerenderScheduler,
    private readonly notifications: NotificationPublisherPort
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
        // Request re-render via scheduler (debounced/coalesced)
        this.scheduler.requestRerender();
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
    journalDirectoryRerenderSchedulerToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalEvents: PlatformJournalEventPort,
    scheduler: JournalDirectoryRerenderScheduler,
    notifications: NotificationPublisherPort
  ) {
    super(journalEvents, scheduler, notifications);
  }
}
