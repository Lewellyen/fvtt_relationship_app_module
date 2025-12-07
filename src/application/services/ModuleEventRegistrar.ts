import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { disposeHooks } from "@/application/utils/dispose-hooks";
import { platformNotificationPortToken } from "@/application/tokens/domain-ports.tokens";
import {
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
} from "@/application/tokens/event.tokens";

/**
 * ModuleEventRegistrar
 *
 * Manages registration of all platform-agnostic event listeners using Strategy Pattern.
 * Each event listener is implemented as a separate EventRegistrar class.
 *
 * **Design Benefits:**
 * - Easy to add new event listeners without modifying this class
 * - Each event listener can be tested in isolation
 * - Clear separation of concerns
 * - Full DI architecture: Event listeners injected as dependencies
 * - Platform-agnostic: Works with any event system (Foundry, Roll20, etc.)
 */
export class ModuleEventRegistrar {
  private eventRegistrars: EventRegistrar[];

  constructor(
    processJournalDirectoryOnRender: EventRegistrar,
    invalidateJournalCacheOnChange: EventRegistrar,
    triggerJournalDirectoryReRender: EventRegistrar,
    private readonly notifications: PlatformNotificationPort
  ) {
    this.eventRegistrars = [
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender,
    ];
  }

  /**
   * Registers all event listeners.
   *
   * NOTE: Container parameter removed - event listeners receive all dependencies via constructor injection.
   */
  registerAll(): Result<void, Error[]> {
    const errors: Error[] = [];

    for (const registrar of this.eventRegistrars) {
      const result = registrar.register();
      if (!result.ok) {
        // Convert string error to structured format
        const error = {
          code: "EVENT_REGISTRATION_FAILED" as const,
          message: result.error.message,
        };
        // Bootstrap error - log to console only (no UI notification)
        this.notifications.error("Failed to register event listener", error, {
          channels: ["ConsoleChannel"],
        });
        errors.push(result.error);
      }
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok(undefined);
  }

  /**
   * Dispose all event listeners.
   * Called when the module is disabled or reloaded.
   */
  disposeAll(): void {
    disposeHooks(this.eventRegistrars);
  }
}

export class DIModuleEventRegistrar extends ModuleEventRegistrar {
  static dependencies = [
    processJournalDirectoryOnRenderUseCaseToken,
    invalidateJournalCacheOnChangeUseCaseToken,
    triggerJournalDirectoryReRenderUseCaseToken,
    platformNotificationPortToken,
  ] as const;

  constructor(
    processJournalDirectoryOnRender: EventRegistrar,
    invalidateJournalCacheOnChange: EventRegistrar,
    triggerJournalDirectoryReRender: EventRegistrar,
    notifications: PlatformNotificationPort
  ) {
    super(
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender,
      notifications
    );
  }
}
