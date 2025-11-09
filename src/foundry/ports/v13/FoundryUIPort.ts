import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { ok, err } from "@/utils/functional/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { sanitizeId } from "@/foundry/validation/schemas";

/**
 * v13 implementation of FoundryUI interface.
 * Encapsulates Foundry v13-specific UI manipulation.
 */
export class FoundryUIPortV13 implements FoundryUI {
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, FoundryError> {
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
    const element = container.querySelector(selector) as HTMLElement | null;
    return ok(element);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, FoundryError> {
    if (typeof ui === "undefined" || !ui?.notifications) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry UI notifications not available"));
    }

    try {
      switch (type) {
        case "info":
          ui.notifications.info(message);
          break;
        case "warning":
          ui.notifications.warn(message);
          break;
        case "error":
          ui.notifications.error(message);
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
}
