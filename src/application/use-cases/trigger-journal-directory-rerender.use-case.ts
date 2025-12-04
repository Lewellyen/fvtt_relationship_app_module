import type { Result } from "@/domain/types/result";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import {
  platformJournalEventPortToken,
  journalDirectoryUiPortToken,
  platformNotificationPortToken,
} from "@/application/tokens";
import { DOMAIN_FLAGS } from "@/domain/constants/domain-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";

/**
 * Use-Case: Trigger journal directory re-render when hidden flag changes.
 *
 * Fully platform-agnostic through PlatformJournalEventPort and PlatformUIPort.
 *
 * @example
 * ```typescript
 * const useCase = new TriggerJournalDirectoryReRenderUseCase(
 *   journalEventPort,
 *   platformUI,
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
    private readonly journalDirectoryUI: JournalDirectoryUiPort,
    private readonly notifications: PlatformNotificationPort
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
    journalDirectoryUiPortToken,
    platformNotificationPortToken,
  ] as const;

  constructor(
    journalEvents: PlatformJournalEventPort,
    journalDirectoryUI: JournalDirectoryUiPort,
    notifications: PlatformNotificationPort
  ) {
    super(journalEvents, journalDirectoryUI, notifications);
  }
}
