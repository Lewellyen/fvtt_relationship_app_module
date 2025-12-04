import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import { journalContextMenuLibWrapperServiceToken } from "@/infrastructure/shared/tokens/foundry.tokens";
import { registerContextMenuUseCaseToken } from "@/infrastructure/shared/tokens/event.tokens";
import {
  castJournalContextMenuLibWrapperService,
  castRegisterContextMenuUseCase,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";

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
   * @param container - ContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static registerContextMenu(container: ContainerPort): Result<void, string> {
    const contextMenuLibWrapperResult = container.resolveWithError(
      journalContextMenuLibWrapperServiceToken
    );
    if (!contextMenuLibWrapperResult.ok) {
      // Context menu is optional - return error so orchestrator can log warning
      return err(
        `JournalContextMenuLibWrapperService could not be resolved: ${contextMenuLibWrapperResult.error.message}`
      );
    }

    const contextMenuLibWrapper = castJournalContextMenuLibWrapperService(
      contextMenuLibWrapperResult.value
    );
    const registerResult = contextMenuLibWrapper.register();
    if (!registerResult.ok) {
      // Registration failure - return error so orchestrator can log warning
      return err(`Context menu libWrapper registration failed: ${registerResult.error.message}`);
    }

    // Register context menu callbacks (after libWrapper is registered)
    const contextMenuUseCaseResult = container.resolveWithError(registerContextMenuUseCaseToken);
    if (!contextMenuUseCaseResult.ok) {
      // Use case resolution failure - return error so orchestrator can log warning
      return err(
        `RegisterContextMenuUseCase could not be resolved: ${contextMenuUseCaseResult.error.message}`
      );
    }

    const contextMenuUseCase = castRegisterContextMenuUseCase(contextMenuUseCaseResult.value);
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
