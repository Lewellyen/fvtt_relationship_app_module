import type { Result } from "@/domain/types/result";
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { EventRegistrationId } from "@/domain/ports/events/platform-event-port.interface";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { EventRegistrar } from "./event-registrar.interface";
import {
  journalEventPortToken,
  hideJournalContextMenuHandlerToken,
} from "@/infrastructure/shared/tokens";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";

/**
 * Use-Case: Register custom context menu entries for journal entries.
 *
 * Orchestrates multiple handlers that can add menu items.
 * Platform-agnostic - works with any JournalEventPort implementation.
 *
 * @example
 * ```typescript
 * const useCase = new RegisterContextMenuUseCase(
 *   journalEvents,
 *   hideJournalHandler
 * );
 *
 * useCase.register();  // Start listening
 * useCase.dispose();   // Stop listening
 * ```
 */
export class RegisterContextMenuUseCase implements EventRegistrar {
  private registrationId: EventRegistrationId | undefined;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly hideJournalHandler: HideJournalContextMenuHandler
  ) {}

  /**
   * Register event listener for context menu events.
   * All handlers are called for each context menu event.
   */
  register(): Result<void, Error> {
    const handlers: JournalContextMenuHandler[] = [this.hideJournalHandler];

    const result = this.journalEvents.onJournalContextMenu((event) => {
      // Rufe alle Handler auf
      for (const handler of handlers) {
        handler.handle(event);
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
 * DI-enabled wrapper for RegisterContextMenuUseCase.
 * Resolves handlers from container.
 */
export class DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  static dependencies = [journalEventPortToken, hideJournalContextMenuHandlerToken] as const;

  constructor(journalEvents: JournalEventPort, hideJournalHandler: HideJournalContextMenuHandler) {
    super(journalEvents, hideJournalHandler);
  }
}
