import type { Result } from "@/domain/types/result";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { JournalContextMenuLibWrapperService } from "@/infrastructure/adapters/foundry/services/JournalContextMenuLibWrapperService";
import {
  journalContextMenuLibWrapperServiceToken,
  hideJournalContextMenuHandlerToken,
} from "@/infrastructure/shared/tokens";
import { ok } from "@/infrastructure/shared/utils/result";
import type { HideJournalContextMenuHandler } from "@/application/handlers/hide-journal-context-menu-handler";

/**
 * Use-Case: Register custom context menu entries for journal entries.
 *
 * Orchestrates multiple handlers that can add menu items.
 * Registers callbacks with the JournalContextMenuLibWrapperService.
 *
 * NOTE: This is NOT an EventRegistrar. The libWrapper is registered separately
 * during init, and this use-case only manages callback registration.
 *
 * @example
 * ```typescript
 * const useCase = new RegisterContextMenuUseCase(
 *   contextMenuLibWrapperService,
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
    private readonly contextMenuLibWrapperService: JournalContextMenuLibWrapperService,
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

    this.contextMenuLibWrapperService.addCallback(this.callback);
    return ok(undefined);
  }

  /**
   * Cleanup: Unregister callback.
   */
  dispose(): void {
    if (this.callback !== undefined) {
      this.contextMenuLibWrapperService.removeCallback(this.callback);
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
    journalContextMenuLibWrapperServiceToken,
    hideJournalContextMenuHandlerToken,
  ] as const;

  constructor(
    contextMenuLibWrapperService: JournalContextMenuLibWrapperService,
    hideJournalHandler: HideJournalContextMenuHandler
  ) {
    super(contextMenuLibWrapperService, hideJournalHandler);
  }
}
