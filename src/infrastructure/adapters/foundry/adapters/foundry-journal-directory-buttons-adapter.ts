import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type {
  JournalDirectoryButtonsConfig,
  PlatformJournalDirectoryButtonsPort,
} from "@/domain/ports/bootstrap/platform-journal-directory-buttons-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import type { FoundryError } from "../errors/FoundryErrors";
import type { FoundryHooksPort } from "../services/FoundryHooksPort";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";

function formatFoundryError(e: FoundryError): string {
  return `${e.code}: ${e.message}`;
}

/**
 * Foundry implementation for PlatformJournalDirectoryButtonsPort.
 *
 * Hooks into Foundry's \"renderJournalDirectory\" and injects buttons into the directory header.
 */
export class FoundryJournalDirectoryButtonsAdapter implements PlatformJournalDirectoryButtonsPort {
  private registered = false;

  constructor(
    private readonly hooks: FoundryHooksPort,
    private readonly logger: Logger
  ) {}

  registerButtons(config: JournalDirectoryButtonsConfig): Result<void, string> {
    if (this.registered) {
      return ok(undefined);
    }

    const hookResult = this.hooks.on("renderJournalDirectory", (...args: unknown[]) => {
      if (args.length < 2) return;
      const htmlArg = args[1];
      if (!(htmlArg instanceof HTMLElement)) return;

      const userRole: number | undefined =
        typeof game !== "undefined" ? game.user?.role : undefined;

      if (!config.shouldShowButtons(userRole)) {
        return;
      }

      const html = htmlArg;
      const actionButtons = html.querySelector(".header-actions.action-buttons");
      const directoryHeader = html.querySelector(".directory-header");

      // Show-all button
      if (!html.querySelector(`.${config.showAllButton.cssClass}`)) {
        const button = document.createElement("button");
        button.className = config.showAllButton.cssClass;
        button.type = "button";
        button.title = config.showAllButton.title;
        button.innerHTML = config.showAllButton.labelHtml;
        button.addEventListener("click", () => {
          void config.onShowAllHiddenJournalsClick().catch((error: unknown) => {
            this.logger.error("Show-all-hidden-journals button handler failed", { error });
          });
        });

        if (actionButtons) {
          actionButtons.appendChild(button);
        } else if (directoryHeader) {
          directoryHeader.appendChild(button);
        } else {
          html.insertBefore(button, html.firstChild);
        }
      }

      // Overview button
      if (!html.querySelector(`.${config.overviewButton.cssClass}`)) {
        const button = document.createElement("button");
        button.className = config.overviewButton.cssClass;
        button.type = "button";
        button.title = config.overviewButton.title;
        button.innerHTML = config.overviewButton.labelHtml;
        button.addEventListener("click", () => {
          void config.onOpenJournalOverviewClick().catch((error: unknown) => {
            this.logger.error("Journal-overview button handler failed", { error });
          });
        });

        if (actionButtons) {
          actionButtons.appendChild(button);
        } else if (directoryHeader) {
          directoryHeader.appendChild(button);
        } else {
          html.insertBefore(button, html.firstChild);
        }
      }
    });

    if (!hookResult.ok) {
      return err(
        `Failed to register renderJournalDirectory hook: ${formatFoundryError(hookResult.error)}`
      );
    }

    this.registered = true;
    return ok(undefined);
  }
}

export class DIFoundryJournalDirectoryButtonsAdapter extends FoundryJournalDirectoryButtonsAdapter {
  static dependencies = [foundryHooksToken, loggerToken] as const;

  constructor(hooks: FoundryHooksPort, logger: Logger) {
    super(hooks, logger);
  }
}
