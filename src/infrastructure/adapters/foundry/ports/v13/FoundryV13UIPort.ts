import type { Result } from "@/domain/types/result";
import type { FoundryUI, FoundryNotificationOptions } from "../../interfaces/FoundryUI";
import type { FoundryError } from "../../errors/FoundryErrors";
import type {
  IFoundryUIAPI,
  IFoundryGameJournalAPI,
  IFoundryDocumentAPI,
} from "../../api/foundry-api.interface";
import { ok, err } from "@/domain/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { sanitizeId } from "../../validation/schemas";

/**
 * v13 implementation of FoundryUI interface.
 * Encapsulates Foundry v13-specific UI manipulation.
 *
 * Uses dependency injection for Foundry APIs to improve testability.
 */
export class FoundryV13UIPort implements FoundryUI {
  #disposed = false;

  constructor(
    private readonly foundryUIAPI: IFoundryUIAPI,
    private readonly foundryGameJournalAPI: IFoundryGameJournalAPI,
    private readonly foundryDocumentAPI: IFoundryDocumentAPI
  ) {}

  removeJournalDirectoryEntry(
    directoryId: string,
    journalId: string,
    journalName: string
  ): Result<void, FoundryError> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot remove journal directory entry on disposed port")
      );
    }

    // Get directory element internally (DIP-compliant: Application layer doesn't need HTMLElement)
    const elementResult = this.getDirectoryElement(directoryId);
    if (!elementResult.ok) {
      return err(elementResult.error);
    }

    const html = elementResult.value;
    if (!html) {
      return err(
        createFoundryError(
          "NOT_FOUND",
          `Directory element not found for directory: ${directoryId}`,
          { directoryId, journalId, journalName }
        )
      );
    }

    // Sanitize ID to prevent CSS injection
    const safeId = sanitizeId(journalId);

    // Support both selectors: Foundry v13 uses data-document-id, older versions used data-entry-id
    // This finds the <li> element that represents the journal in the sidebar list (directory entry)
    const element = html.querySelector(
      `li.directory-item[data-document-id="${safeId}"], li.directory-item[data-entry-id="${safeId}"]`
    ) as HTMLElement | null;

    if (!element) {
      return err(
        createFoundryError(
          "NOT_FOUND",
          `Could not find directory entry for journal: ${journalName}`,
          { journalName, journalId: safeId }
        )
      );
    }

    try {
      element.remove();
      return ok(undefined);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to remove element from DOM",
          { journalName, journalId: safeId },
          error
        )
      );
    }
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot find element on disposed port"));
    }
    // Use container's querySelector directly (not injected API, as container is passed as parameter)
    const element = container.querySelector(selector) as HTMLElement | null;
    return ok(element);
  }

  notify(
    message: string,
    type: "info" | "warning" | "error",
    options?: FoundryNotificationOptions
  ): Result<void, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot show notification on disposed port"));
    }
    if (!this.foundryUIAPI?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }

    try {
      switch (type) {
        case "info":
          this.foundryUIAPI.notifications.info(message, options);
          break;
        case "warning":
          this.foundryUIAPI.notifications.warn(message, options);
          break;
        case "error":
          this.foundryUIAPI.notifications.error(message, options);
          break;
      }
      return ok(undefined);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to show notification",
          { message, type },
          error
        )
      );
    }
  }

  getDirectoryElement(directoryId: string): Result<HTMLElement | null, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot get directory element on disposed port"));
    }

    try {
      // For Foundry, directoryId is typically "journal"
      // The journal directory element is found via #journal selector
      if (directoryId === "journal") {
        const element = this.foundryDocumentAPI.querySelector("#journal") as HTMLElement | null;
        return ok(element);
      }

      // For other directory IDs, return null (not found)
      return ok(null);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          "Failed to get directory element",
          { directoryId },
          error
        )
      );
    }
  }

  rerenderJournalDirectory(): Result<boolean, FoundryError> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot rerender journal directory on disposed port")
      );
    }

    try {
      const journalElement = this.foundryDocumentAPI.querySelector("#journal");
      if (!journalElement) {
        return ok(false);
      }

      // Foundry v13: Use game.journal.directory.render() directly
      // ui.sidebar.tabs.journal is not accessible via public API in v13
      let rendered = false;
      if (this.foundryGameJournalAPI.directory?.render) {
        this.foundryGameJournalAPI.directory.render();
        rendered = true;
      }

      return ok(rendered);
    } catch (error) {
      return err(
        createFoundryError("OPERATION_FAILED", "Failed to re-render journal directory", {}, error)
      );
    }
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}

/**
 * Factory function to create FoundryV13UIPort instance for production use.
 * Injects real Foundry UI and game APIs.
 *
 * @returns FoundryV13UIPort instance
 */
export function createFoundryV13UIPort(): FoundryV13UIPort {
  if (typeof ui === "undefined" || !ui?.notifications) {
    throw new Error("Foundry UI API not available");
  }

  if (typeof game === "undefined" || !game?.journal) {
    throw new Error("Foundry game API not available");
  }

  const uiAPI: IFoundryUIAPI = {
    notifications: {
      info: (message: string, options?: FoundryNotificationOptions) => {
        if (ui.notifications) {
          ui.notifications.info(message, options);
        }
      },
      warn: (message: string, options?: FoundryNotificationOptions) => {
        if (ui.notifications) {
          ui.notifications.warn(message, options);
        }
      },
      error: (message: string, options?: FoundryNotificationOptions) => {
        if (ui.notifications) {
          ui.notifications.error(message, options);
        }
      },
    },
  };

  // Note: Foundry v13's ui.sidebar.tabs.journal is not accessible via public API
  // The rerenderJournalDirectory() method uses game.journal.directory.render() as fallback

  return new FoundryV13UIPort(
    uiAPI,
    {
      contents: Array.from(game.journal.contents),
      get: (id: string) => game.journal.get(id),
      ...(game.journal.directory && game.journal.directory.render
        ? {
            directory: {
              render: () => {
                game.journal.directory?.render();
              },
            },
          }
        : {}),
    },
    {
      querySelector: (selector: string) => document.querySelector(selector),
    }
  );
}
