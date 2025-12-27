import type { Result } from "@/domain/types/result";
import type { PlatformJournalEventPort } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import { ok, err } from "@/domain/utils/result";
import {
  platformJournalEventPortToken,
  cacheInvalidationPortToken,
  platformNotificationPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { getFirstArrayElement } from "@/application/utils/array-utils";

/**
 * Use-Case: Invalidate journal cache when journal entries change.
 *
 * Platform-agnostic - works with any PlatformJournalEventPort implementation.
 *
 * @example
 * ```typescript
 * const useCase = new InvalidateJournalCacheOnChangeUseCase(
 *   journalEventPort,
 *   cache,
 *   notifications
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();  // Stop listening
 * ```
 */
export class InvalidateJournalCacheOnChangeUseCase implements EventRegistrar {
  private registrationIds: EventRegistrationId[] = [];

  constructor(
    private readonly journalEvents: PlatformJournalEventPort,
    private readonly cache: CacheInvalidationPort,
    private readonly notifications: PlatformNotificationPort
  ) {}

  /**
   * Register event listeners for journal change events.
   */
  register(): Result<void, Error> {
    // Register for all journal change events
    const results = [
      this.journalEvents.onJournalCreated((event) => {
        this.invalidateCache("created", event.journalId);
      }),
      this.journalEvents.onJournalUpdated((event) => {
        this.invalidateCache("updated", event.journalId);

        // Check if hidden flag changed
        if (event.changes.flags?.["hidden"] !== undefined) {
          this.triggerUIUpdate(event.journalId);
        }
      }),
      this.journalEvents.onJournalDeleted((event) => {
        this.invalidateCache("deleted", event.journalId);
      }),
    ];

    // Collect registration IDs for cleanup
    const errors: Error[] = [];
    for (const result of results) {
      if (result.ok) {
        this.registrationIds.push(result.value);
      } else {
        const error = new Error(
          `Failed to register journal event listener: ${result.error.message}`
        );
        errors.push(error);
        this.notifications.error(
          "Failed to register journal event listener",
          {
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    }

    if (errors.length > 0) {
      // Roll back any registered listeners
      this.dispose();
      // Return first error - errors array is non-empty, so getFirstArrayElement is safe
      return err(getFirstArrayElement(errors));
    }

    return ok(undefined);
  }

  /**
   * Invalidate cache entries related to journals.
   */
  private invalidateCache(reason: string, journalId: string): void {
    const removed = this.cache.invalidateWhere((meta) => meta.tags.includes("journal:hidden"));

    if (removed > 0) {
      this.notifications.debug(
        `Invalidated ${removed} journal cache entries (${reason})`,
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }

  /**
   * Trigger UI update when journal visibility changes.
   */
  private triggerUIUpdate(journalId: string): void {
    this.notifications.debug(
      "Journal hidden flag changed, UI update needed",
      { journalId },
      { channels: ["ConsoleChannel"] }
    );
  }

  /**
   * Cleanup: Unregister all event listeners.
   */
  dispose(): void {
    for (const id of this.registrationIds) {
      this.journalEvents.unregisterListener(id);
    }
    this.registrationIds = [];
  }
}

/**
 * DI-enabled wrapper for InvalidateJournalCacheOnChangeUseCase.
 */
export class DIInvalidateJournalCacheOnChangeUseCase extends InvalidateJournalCacheOnChangeUseCase {
  static dependencies = [
    platformJournalEventPortToken,
    cacheInvalidationPortToken,
    platformNotificationPortToken,
  ] as const;

  constructor(
    journalEvents: PlatformJournalEventPort,
    cache: CacheInvalidationPort,
    notifications: PlatformNotificationPort
  ) {
    super(journalEvents, cache, notifications);
  }
}
