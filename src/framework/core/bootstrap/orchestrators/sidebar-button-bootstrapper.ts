import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { windowFactoryToken } from "@/application/windows/tokens/window.tokens";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";
import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";

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

      // Find container for buttons (reusable for both buttons)
      const actionButtons = html.querySelector(".header-actions.action-buttons");
      const directoryHeader = html.querySelector(".directory-header");

      // Add "Show All Hidden Journals" button
      const existingButton = html.querySelector(".show-all-hidden-journals-button");
      if (!existingButton) {
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
        if (actionButtons) {
          actionButtons.appendChild(button);
        } else if (directoryHeader) {
          directoryHeader.appendChild(button);
        } else {
          // Last resort: add to top of sidebar
          html.insertBefore(button, html.firstChild);
        }
      }

      // Add Journal Overview button (independent of show-all button)
      const existingOverviewButton = html.querySelector(".journal-overview-button");
      if (!existingOverviewButton) {
        // Resolve WindowFactory for opening the overview window
        const windowFactoryResult = container.resolveWithError(windowFactoryToken);
        if (!windowFactoryResult.ok) {
          // WindowFactory not available - log warning but don't fail silently
          // This can happen if the hook fires before WindowFactory is registered
          console.warn(
            "[Journal Overview] WindowFactory not available:",
            windowFactoryResult.error.message
          );
          return;
        }

        const windowFactory = castResolvedService<IWindowFactory>(windowFactoryResult.value);

        // Create overview button
        const overviewButton = document.createElement("button");
        overviewButton.className = "journal-overview-button";
        overviewButton.type = "button";
        overviewButton.title = "Journal-Übersicht anzeigen";
        overviewButton.innerHTML = '<i class="fas fa-list"></i> Übersicht';

        // Add click handler
        overviewButton.addEventListener("click", async () => {
          const result = await windowFactory.createWindow("journal-overview");
          if (result.ok) {
            await result.value.show();
          } else {
            // Error notification could be shown here if needed
            console.error("Failed to open journal overview window:", result.error);
          }
        });

        // Add overview button next to the "show all" button
        // Use the same container logic as the show-all button
        if (actionButtons) {
          actionButtons.appendChild(overviewButton);
        } else if (directoryHeader) {
          directoryHeader.appendChild(overviewButton);
        } else {
          // Last resort: add to top of sidebar
          html.insertBefore(overviewButton, html.firstChild);
        }
      }
    });

    if (!hookRegistrationResult.ok) {
      return err(`Failed to register sidebar button hook: ${hookRegistrationResult.error.message}`);
    }

    return ok(undefined);
  }
}
