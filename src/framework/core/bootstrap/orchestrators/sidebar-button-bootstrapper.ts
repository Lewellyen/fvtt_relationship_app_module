import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { showAllHiddenJournalsUseCaseToken } from "@/application/tokens/event.tokens";
import { windowFactoryToken } from "@/application/windows/tokens/window.tokens";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import type { ShowAllHiddenJournalsUseCase } from "@/application/use-cases/show-all-hidden-journals.use-case";
import type { IWindowFactory } from "@/domain/windows/ports/window-factory-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { canUserSeeJournalDirectoryButtons } from "@/application/utils/journal-directory-button-permissions";
import { platformJournalDirectoryButtonsPortToken } from "@/application/tokens/domain-ports.tokens";
import type { PlatformJournalDirectoryButtonsPort } from "@/domain/ports/bootstrap/platform-journal-directory-buttons-port.interface";

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
    const useCaseResult = container.resolveWithError<ShowAllHiddenJournalsUseCase>(
      showAllHiddenJournalsUseCaseToken
    );
    if (!useCaseResult.ok) {
      // Sidebar button is optional - return error so orchestrator can log warning
      return err(
        `ShowAllHiddenJournalsUseCase could not be resolved: ${useCaseResult.error.message}`
      );
    }

    const useCase = useCaseResult.value;
    const settingsResult = container.resolveWithError<PlatformSettingsRegistrationPort>(
      platformSettingsRegistrationPortToken
    );
    if (!settingsResult.ok) {
      return err(
        `PlatformSettingsRegistrationPort could not be resolved: ${settingsResult.error.message}`
      );
    }
    const settings = settingsResult.value;

    const windowFactoryResult = container.resolveWithError<IWindowFactory>(windowFactoryToken);
    if (!windowFactoryResult.ok) {
      return err(`WindowFactory could not be resolved: ${windowFactoryResult.error.message}`);
    }
    const windowFactory = windowFactoryResult.value;

    const buttonsPortResult = container.resolveWithError<PlatformJournalDirectoryButtonsPort>(
      platformJournalDirectoryButtonsPortToken
    );
    if (!buttonsPortResult.ok) {
      return err(
        `PlatformJournalDirectoryButtonsPort could not be resolved: ${buttonsPortResult.error.message}`
      );
    }
    const buttonsPort = buttonsPortResult.value;

    const registerResult = buttonsPort.registerButtons({
      shouldShowButtons: (userRole?: number) =>
        canUserSeeJournalDirectoryButtons(
          settings,
          userRole === undefined ? undefined : { role: userRole }
        ),
      onShowAllHiddenJournalsClick: async () => {
        await useCase.execute();
      },
      onOpenJournalOverviewClick: async () => {
        const result = await windowFactory.createWindow("journal-overview");
        if (result.ok) {
          await result.value.show();
        }
      },
      showAllButton: {
        title: "Alle versteckten Journale wieder einblenden",
        labelHtml: '<i class="fas fa-eye"></i> Alle Journale einblenden',
        cssClass: "show-all-hidden-journals-button",
      },
      overviewButton: {
        title: "Journal-Übersicht anzeigen",
        labelHtml: '<i class="fas fa-list"></i> Übersicht',
        cssClass: "journal-overview-button",
      },
    });

    if (!registerResult.ok) {
      return err(`Failed to register journal directory buttons: ${registerResult.error}`);
    }

    return ok(undefined);
  }
}
