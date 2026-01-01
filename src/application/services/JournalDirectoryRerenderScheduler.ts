import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { debounce } from "@/application/utils/debounce";
import {
  platformJournalDirectoryUiPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Service for scheduling journal directory re-renders with debounce/coalesce.
 *
 * Collects multiple re-render requests and executes a single re-render
 * after a delay of inactivity (debounce).
 *
 * **Design:**
 * - Uses debounce to coalesce multiple requests into one
 * - Works locally on each client (no multi-client synchronization needed)
 * - Automatically handles rapid updates (batch or individual)
 *
 * @example
 * ```typescript
 * const scheduler = new JournalDirectoryRerenderScheduler(
 *   journalDirectoryUI,
 *   notifications
 * );
 *
 * // Multiple rapid requests
 * scheduler.requestRerender();
 * scheduler.requestRerender();
 * scheduler.requestRerender();
 * // → Only one re-render after 100ms of inactivity
 * ```
 */
export class JournalDirectoryRerenderScheduler {
  private readonly debouncedRerender: (() => void) & { cancel: () => void };
  private readonly delayMs: number = 100; // 100ms debounce delay

  constructor(
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly notifications: NotificationPublisherPort
  ) {
    // Create debounced re-render function
    this.debouncedRerender = debounce(() => {
      this.executeRerender();
    }, this.delayMs);
  }

  /**
   * Request a journal directory re-render.
   *
   * Multiple rapid calls will be coalesced into a single re-render
   * after the debounce delay (100ms).
   */
  requestRerender(): void {
    this.debouncedRerender();
  }

  /**
   * Execute the actual re-render.
   */
  private executeRerender(): void {
    const result = this.journalDirectoryUI.rerenderJournalDirectory();

    if (!result.ok) {
      this.notifications.warn("Failed to re-render journal directory", result.error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    if (result.value) {
      this.notifications.debug(
        "Triggered journal directory re-render (debounced)",
        {},
        { channels: ["ConsoleChannel"] }
      );
    }
  }

  /**
   * Cancel any pending re-render.
   *
   * Useful for cleanup or when re-render is no longer needed.
   */
  cancelPending(): void {
    this.debouncedRerender.cancel();
  }
}

/**
 * DI-enabled wrapper for JournalDirectoryRerenderScheduler.
 */
export class DIJournalDirectoryRerenderScheduler extends JournalDirectoryRerenderScheduler {
  static dependencies = [
    platformJournalDirectoryUiPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalDirectoryUI: PlatformJournalDirectoryUiPort,
    notifications: NotificationPublisherPort
  ) {
    super(journalDirectoryUI, notifications);
  }
}
