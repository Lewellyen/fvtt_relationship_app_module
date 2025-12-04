import type { Result } from "@/domain/types/result";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";
import {
  platformJournalEventPortToken,
  platformNotificationPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Use-Case: Process journal directory when it's rendered.
 *
 * Platform-agnostic - works with any PlatformJournalEventPort implementation.
 *
 * @example
 * ```typescript
 * const useCase = new ProcessJournalDirectoryOnRenderUseCase(
 *   journalEventPort,
 *   journalVisibilityService,
 *   notifications
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class ProcessJournalDirectoryOnRenderUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: PlatformJournalEventPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly notifications: PlatformNotificationPort
  ) {}

  /**
   * Register event listener for directory render events.
   */
  register(): Result<void, Error> {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      this.notifications.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp },
        { channels: ["ConsoleChannel"] }
      );

      const processResult = this.journalVisibility.processJournalDirectory(event.htmlElement);

      if (!processResult.ok) {
        this.notifications.error("Failed to process journal directory", processResult.error, {
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
    platformJournalEventPortToken,
    journalVisibilityServiceToken,
    platformNotificationPortToken,
  ] as const;

  constructor(
    journalEvents: PlatformJournalEventPort,
    journalVisibility: JournalVisibilityService,
    notifications: PlatformNotificationPort
  ) {
    super(journalEvents, journalVisibility, notifications);
  }
}
