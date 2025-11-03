import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { ok, err } from "@/utils/result";
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

    const element = html.querySelector(
      `li.directory-item[data-entry-id="${safeId}"]`
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

    element.remove();
    return ok(undefined);
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError> {
    const element = container.querySelector(selector) as HTMLElement | null;
    return ok(element);
  }
}
