import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/infrastructure/shared/utils/result";
import {
  journalEventPortToken,
  platformUIPortToken,
  notificationCenterToken,
} from "@/infrastructure/shared/tokens";

/**
 * Use-Case: Trigger journal directory re-render when hidden flag changes.
 *
 * Fully platform-agnostic through JournalEventPort and PlatformUIPort.
 *
 * @example
 * ```typescript
 * const useCase = new TriggerJournalDirectoryReRenderUseCase(
 *   journalEventPort,
 *   platformUI,
 *   notificationCenter
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class TriggerJournalDirectoryReRenderUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly platformUI: PlatformUIPort,
    private readonly notificationCenter: NotificationCenter
  ) {}

  /**
   * Register event listener for journal update events.
   */
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalUpdated((event) => {
      // Only trigger re-render if hidden flag changed
      if (event.changes.flags?.["hidden"] !== undefined) {
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
    const result = this.platformUI.rerenderJournalDirectory();

    if (!result.ok) {
      this.notificationCenter.warn(
        "Failed to re-render journal directory after hidden flag change",
        result.error,
        { channels: ["ConsoleChannel"] }
      );
      return;
    }

    if (result.value) {
      this.notificationCenter.debug(
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
    journalEventPortToken,
    platformUIPortToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    platformUI: PlatformUIPort,
    notificationCenter: NotificationCenter
  ) {
    super(journalEvents, platformUI, notificationCenter);
  }
}
