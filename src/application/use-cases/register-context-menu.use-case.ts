import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { JournalContextMenuHandler } from "@/application/handlers/journal-context-menu-handler.interface";
import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";
import type { ContextMenuRegistrationPort } from "@/domain/ports/context-menu-registration-port.interface";
import type { Logger } from "@/domain/ports/logger-port.interface";
import {
  contextMenuRegistrationPortToken,
  journalContextMenuHandlersToken,
} from "@/application/tokens";
import { loggerToken } from "@/infrastructure/shared/tokens";

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
 *   [hideJournalHandler, otherHandler]
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
    private readonly handlers: JournalContextMenuHandler[],
    private readonly logger: Logger
  ) {}

  /**
   * Register callback for context menu events.
   * All handlers are called for each context menu event.
   * Errors in individual handlers are caught and logged, but don't stop other handlers.
   */
  register(): Result<void, Error> {
    // Create callback that calls all handlers with error isolation
    this.callback = (event: JournalContextMenuEvent) => {
      // Rufe alle Handler auf mit Fehler-Isolation
      for (const handler of this.handlers) {
        try {
          handler.handle(event);
        } catch (error) {
          // Log error but continue with next handler
          const handlerError = error instanceof Error ? error : new Error(String(error));
          this.logger.warn(`Context menu handler failed: ${handlerError.message}`, {
            error: handlerError,
            handler: handler.constructor.name,
          });
          // Continue with next handler - don't let one handler failure stop the chain
        }
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
    journalContextMenuHandlersToken,
    loggerToken,
  ] as const;

  constructor(
    contextMenuRegistration: ContextMenuRegistrationPort,
    handlers: JournalContextMenuHandler[],
    logger: Logger
  ) {
    super(contextMenuRegistration, handlers, logger);
  }
}
