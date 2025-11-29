import type { Result } from "@/domain/types/result";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { ContextMenuRegistrationPort } from "@/domain/ports/context-menu-registration-port.interface";
import {
  contextMenuRegistrationPortToken,
  hideJournalContextMenuHandlerToken,
} from "@/application/tokens";
import { ok } from "@/domain/utils/result";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";

/**
 * Use-Case: Register custom context menu entries for journal entries.
 *
 * Orchestrates multiple handlers that can add menu items.
 * Registers callbacks with the ContextMenuRegistrationPort.
 *
 * NOTE: This is NOT an EventRegistrar. The libWrapper is registered separately
 * during init, and this use-case only manages callback registration.
 *
 * @example
 * ```typescript
 * const useCase = new RegisterContextMenuUseCase(
 *   contextMenuRegistration,
 *   hideJournalHandler
 * );
 *
 * useCase.register();  // Register callbacks
 * useCase.dispose();   // Unregister callbacks
 * ```
 */
export class RegisterContextMenuUseCase {
  private callback: ((event: JournalContextMenuEvent) => void) | undefined;

  constructor(
    private readonly contextMenuRegistration: ContextMenuRegistrationPort,
    private readonly hideJournalHandler: HideJournalContextMenuHandler
  ) {}

  /**
   * Register callback for context menu events.
   * All handlers are called for each context menu event.
   */
  register(): Result<void, Error> {
    const handlers: JournalContextMenuHandler[] = [this.hideJournalHandler];

    // Create callback that calls all handlers
    this.callback = (event: JournalContextMenuEvent) => {
      // Rufe alle Handler auf
      for (const handler of handlers) {
        handler.handle(event);
      }
    };

    this.contextMenuRegistration.addCallback(this.callback);
    return ok(undefined);
  }

  /**
   * Cleanup: Unregister callback.
   */
  dispose(): void {
    if (this.callback !== undefined) {
      this.contextMenuRegistration.removeCallback(this.callback);
      this.callback = undefined;
    }
  }
}

/**
 * DI-enabled wrapper for RegisterContextMenuUseCase.
 * Resolves dependencies from container.
 */
export class DIRegisterContextMenuUseCase extends RegisterContextMenuUseCase {
  static dependencies = [
    contextMenuRegistrationPortToken,
    hideJournalContextMenuHandlerToken,
  ] as const;

  constructor(
    contextMenuRegistration: ContextMenuRegistrationPort,
    hideJournalHandler: HideJournalContextMenuHandler
  ) {
    super(contextMenuRegistration, hideJournalHandler);
  }
}
