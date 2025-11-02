import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import { ok, err } from "@/utils/result";

/**
 * v13 implementation of FoundryUI interface.
 * Encapsulates Foundry v13-specific UI manipulation.
 */
export class FoundryUIPortV13 implements FoundryUI {
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, string> {
    const element = html.querySelector(
      `li.directory-item[data-entry-id="${journalId}"]`
    ) as HTMLElement | null;

    if (!element) {
      return err(`Could not find element for journal entry: ${journalName} (${journalId})`);
    }

    element.remove();
    return ok(undefined);
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, string> {
    const element = container.querySelector(selector) as HTMLElement | null;
    return ok(element);
  }
}
