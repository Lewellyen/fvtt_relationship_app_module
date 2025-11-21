import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/infrastructure/shared/utils/result";
import {
  journalEventPortToken,
  journalVisibilityServiceToken,
  notificationCenterToken,
} from "@/infrastructure/shared/tokens";

/**
 * Use-Case: Process journal directory when it's rendered.
 *
 * Platform-agnostic - works with any JournalEventPort implementation.
 *
 * @example
 * ```typescript
 * const useCase = new ProcessJournalDirectoryOnRenderUseCase(
 *   journalEventPort,
 *   journalVisibilityService,
 *   notificationCenter
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class ProcessJournalDirectoryOnRenderUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly notificationCenter: NotificationCenter
  ) {}

  /**
   * Register event listener for directory render events.
   */
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      this.notificationCenter.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp },
        { channels: ["ConsoleChannel"] }
      );

      const processResult = this.journalVisibility.processJournalDirectory(event.htmlElement);

      if (!processResult.ok) {
        this.notificationCenter.error("Failed to process journal directory", processResult.error, {
          channels: ["ConsoleChannel"],
        });
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
 * DI-enabled wrapper for ProcessJournalDirectoryOnRenderUseCase.
 */
export class DIProcessJournalDirectoryOnRenderUseCase extends ProcessJournalDirectoryOnRenderUseCase {
  static dependencies = [
    journalEventPortToken,
    journalVisibilityServiceToken,
    notificationCenterToken,
  ] as const;

  constructor(
    journalEvents: JournalEventPort,
    journalVisibility: JournalVisibilityService,
    notificationCenter: NotificationCenter
  ) {
    super(journalEvents, journalVisibility, notificationCenter);
  }
}
