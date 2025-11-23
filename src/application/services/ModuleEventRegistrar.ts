import type { EventRegistrar } from "@/application/use-cases/event-registrar.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { disposeHooks } from "@/infrastructure/shared/utils/dispose-hooks";
import {
  notificationCenterToken,
  invalidateJournalCacheOnChangeUseCaseToken,
  processJournalDirectoryOnRenderUseCaseToken,
  triggerJournalDirectoryReRenderUseCaseToken,
  registerContextMenuUseCaseToken,
} from "@/infrastructure/shared/tokens";

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
    registerJournalContextMenu: EventRegistrar,
    private readonly notificationCenter: NotificationCenter
  ) {
    this.eventRegistrars = [
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender,
      registerJournalContextMenu,
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
        this.notificationCenter.error("Failed to register event listener", error, {
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
    registerContextMenuUseCaseToken,
    notificationCenterToken,
  ] as const;

  constructor(
    processJournalDirectoryOnRender: EventRegistrar,
    invalidateJournalCacheOnChange: EventRegistrar,
    triggerJournalDirectoryReRender: EventRegistrar,
    registerJournalContextMenu: EventRegistrar,
    notificationCenter: NotificationCenter
  ) {
    super(
      processJournalDirectoryOnRender,
      invalidateJournalCacheOnChange,
      triggerJournalDirectoryReRender,
      registerJournalContextMenu,
      notificationCenter
    );
  }
}
