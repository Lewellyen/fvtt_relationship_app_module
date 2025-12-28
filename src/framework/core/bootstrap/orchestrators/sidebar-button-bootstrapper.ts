import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";

/**
 * Orchestrator for registering sidebar button during bootstrap.
 *
 * Responsibilities:
 * - Resolve ShowAllHiddenJournalsUseCase
 * - Register renderSidebarTab hook
 * - Add button to journal sidebar that calls the use-case
 */
export class SidebarButtonBootstrapper {
  /**
   * Registers sidebar button for journal tab.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static registerSidebarButton(container: PlatformContainerPort): Result<void, string> {
    const useCaseResult = container.resolveWithError(showAllHiddenJournalsUseCaseToken);
    if (!useCaseResult.ok) {
      // Sidebar button is optional - return error so orchestrator can log warning
      return err(
        `ShowAllHiddenJournalsUseCase could not be resolved: ${useCaseResult.error.message}`
      );
    }

    const useCase = castResolvedService<ShowAllHiddenJournalsUseCase>(useCaseResult.value);

    const hooksResult = container.resolveWithError(foundryHooksToken);
    if (!hooksResult.ok) {
      return err(`FoundryHooksPort could not be resolved: ${hooksResult.error.message}`);
    }

    const hooks = castResolvedService<FoundryHooksPort>(hooksResult.value);

    // Register renderJournalDirectory hook (same hook as ProcessJournalDirectoryOnRenderUseCase uses)
    // This is a Foundry-specific hook, so we use FoundryHooksPort
    // The button handler has full control over DI (normal case, not edge case)
    // NOTE: renderJournalDirectory is specifically for the journal directory,
    // so we don't need to check tabName - this hook only fires for journal directory
    const hookRegistrationResult = hooks.on("renderJournalDirectory", (...args: unknown[]) => {
      // Type-safe extraction of hook parameters
      if (args.length < 2) {
        return;
      }
      const htmlArg = args[1];

      // Type guard for html parameter
      if (!(htmlArg instanceof HTMLElement)) {
        return;
      }

      const html = htmlArg;

      // Check if button already exists (prevent duplicates on re-render)
      const existingButton = html.querySelector(".show-all-hidden-journals-button");
      if (existingButton) {
        return;
      }

      // Create button element
      const button = document.createElement("button");
      button.className = "show-all-hidden-journals-button";
      button.type = "button";
      button.title = "Alle versteckten Journale wieder einblenden";
      button.innerHTML = '<i class="fas fa-eye"></i> Alle Journale einblenden';

      // Add click handler
      button.addEventListener("click", async () => {
        const result = await useCase.execute();
        if (result.ok) {
          // Success notification is already shown by the use-case
          // No additional action needed
        } else {
          // Error notification is already shown by the use-case
          // No additional action needed
        }
      });

      // Add button to action-buttons container in directory header
      const actionButtons = html.querySelector(".header-actions.action-buttons");
      if (actionButtons) {
        actionButtons.appendChild(button);
      } else {
        // Fallback: try directory-header if action-buttons not found
        const directoryHeader = html.querySelector(".directory-header");
        if (directoryHeader) {
          directoryHeader.appendChild(button);
        } else {
          // Last resort: add to top of sidebar
          html.insertBefore(button, html.firstChild);
        }
      }
    });

    if (!hookRegistrationResult.ok) {
      return err(`Failed to register sidebar button hook: ${hookRegistrationResult.error.message}`);
    }

    return ok(undefined);
  }
}
