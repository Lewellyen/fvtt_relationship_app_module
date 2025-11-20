import type { Result } from "@/domain/types/result";
import type { FoundryUI, FoundryNotificationOptions } from "../../interfaces/FoundryUI";
import type { FoundryError } from "../../errors/FoundryErrors";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { sanitizeId } from "../../validation/schemas";

/**
 * v13 implementation of FoundryUI interface.
 * Encapsulates Foundry v13-specific UI manipulation.
 */
export class FoundryUIPortV13 implements FoundryUI {
  #disposed = false;

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, FoundryError> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot remove journal element on disposed port"));
    }
    // Sanitize ID to prevent CSS injection
    const safeId = sanitizeId(journalId);

    // Support both selectors: Foundry v13 uses data-document-id, older versions used data-entry-id
    const element = html.querySelector(
      `li.directory-item[data-document-id="${safeId}"], li.directory-item[data-entry-id="${safeId}"]`
    ) as HTMLElement | null;

    if (!element) {
      return err(
        createFoundryError(
          "NOT_FOUND",
          `Could not find element for journal entry: ${journalName}`,
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
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }

    try {
      switch (type) {
        case "info":
          ui.notifications.info(message, options);
          break;
        case "warning":
          ui.notifications.warn(message, options);
          break;
        case "error":
          ui.notifications.error(message, options);
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

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}
