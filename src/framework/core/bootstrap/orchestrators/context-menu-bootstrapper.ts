import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { registerContextMenuUseCaseToken } from "@/application/tokens/event.tokens";
import { platformContextMenuRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import type { PlatformContextMenuRegistrationPort } from "@/domain/ports/platform-context-menu-registration-port.interface";
import type { RegisterContextMenuUseCase } from "@/application/use-cases/register-context-menu.use-case";

/**
 * Orchestrator for registering context menu during bootstrap.
 *
 * Responsibilities:
 * - Resolve JournalContextMenuLibWrapperService
 * - Register libWrapper hook
 * - Register context menu callbacks
 */
export class ContextMenuBootstrapper {
  /**
   * Registers context menu libWrapper and callbacks.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static registerContextMenu(container: PlatformContainerPort): Result<void, string> {
    const contextMenuPortResult = container.resolveWithError<PlatformContextMenuRegistrationPort>(
      platformContextMenuRegistrationPortToken
    );
    if (!contextMenuPortResult.ok) {
      return err(
        `PlatformContextMenuRegistrationPort could not be resolved: ${contextMenuPortResult.error.message}`
      );
    }

    const contextMenuPort = contextMenuPortResult.value;

    const registerResult = contextMenuPort.register();
    if (!registerResult.ok) {
      // Registration failure - return error so orchestrator can log warning
      return err(`Context menu registration failed: ${registerResult.error}`);
    }

    // Register context menu callbacks (after libWrapper is registered)
    const contextMenuUseCaseResult = container.resolveWithError<RegisterContextMenuUseCase>(
      registerContextMenuUseCaseToken
    );
    if (!contextMenuUseCaseResult.ok) {
      // Use case resolution failure - return error so orchestrator can log warning
      return err(
        `RegisterContextMenuUseCase could not be resolved: ${contextMenuUseCaseResult.error.message}`
      );
    }

    const contextMenuUseCase = contextMenuUseCaseResult.value;
    const callbackRegisterResult = contextMenuUseCase.register();
    if (!callbackRegisterResult.ok) {
      // Callback registration failure - return error so orchestrator can log warning
      return err(
        `Context menu callback registration failed: ${callbackRegisterResult.error.message}`
      );
    }

    return ok(undefined);
  }
}
