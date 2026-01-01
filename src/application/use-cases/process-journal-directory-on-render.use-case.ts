import type { Result } from "@/domain/types/result";
import type { PlatformJournalUiEventPort } from "@/domain/ports/events/platform-journal-ui-event-port.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { JournalDirectoryProcessor } from "@/application/services/JournalDirectoryProcessor";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import {
  journalVisibilityServiceToken,
  journalDirectoryProcessorToken,
} from "@/application/tokens/application.tokens";
import {
  platformJournalUiEventPortToken,
  platformJournalDirectoryUiPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Use-Case: Process journal directory when it's rendered.
 *
 * Platform-agnostic - works with any PlatformJournalUiEventPort implementation.
 *
 * Orchestrates the flow:
 * 1. JournalVisibilityService retrieves hidden entries (business logic)
 * 2. JournalDirectoryProcessor processes directory via port (DIP-compliant, no HTMLElement)
 *
 * @example
 * ```typescript
 * const useCase = new ProcessJournalDirectoryOnRenderUseCase(
 *   journalUiEvents,
 *   journalDirectoryUI,
 *   journalVisibilityService,
 *   directoryProcessor,
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
    private readonly journalUiEvents: PlatformJournalUiEventPort,
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly directoryProcessor: JournalDirectoryProcessor,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Register event listener for directory render events.
   */
  register(): Result<void, Error> {
    const result = this.journalUiEvents.onJournalDirectoryRendered((event) => {
      this.notifications.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp, directoryId: event.directoryId },
        { channels: ["ConsoleChannel"] }
      );

      // 1. Get hidden entries (business logic)
      const hiddenResult = this.journalVisibility.getHiddenJournalEntries();
      if (!hiddenResult.ok) {
        this.notifications.error("Failed to get hidden entries", hiddenResult.error, {
          channels: ["ConsoleChannel"],
        });
        return;
      }

      // 2. Process directory via port (DIP-compliant: no HTMLElement in Application layer)
      const processResult = this.directoryProcessor.processDirectory(
        event.directoryId,
        hiddenResult.value
      );

      if (!processResult.ok) {
        this.notifications.error("Failed to process directory", processResult.error, {
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
      this.journalUiEvents.unregisterListener(this.registrationId);
      this.registrationId = undefined;
    }
  }
}

/**
 * DI-enabled wrapper for ProcessJournalDirectoryOnRenderUseCase.
 */
export class DIProcessJournalDirectoryOnRenderUseCase extends ProcessJournalDirectoryOnRenderUseCase {
  static dependencies = [
    platformJournalUiEventPortToken,
    platformJournalDirectoryUiPortToken,
    journalVisibilityServiceToken,
    journalDirectoryProcessorToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalUiEvents: PlatformJournalUiEventPort,
    journalDirectoryUI: PlatformJournalDirectoryUiPort,
    journalVisibility: JournalVisibilityService,
    directoryProcessor: JournalDirectoryProcessor,
    notifications: NotificationPublisherPort
  ) {
    super(
      journalUiEvents,
      journalDirectoryUI,
      journalVisibility,
      directoryProcessor,
      notifications
    );
  }
}
