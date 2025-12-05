import type { Result } from "@/domain/types/result";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformUIError } from "@/domain/ports/errors/platform-ui-error.interface";
import type { FoundryUI } from "../interfaces/FoundryUI";
import { ok, err } from "@/domain/utils/result";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry.tokens";

/**
 * Foundry-specific implementation of PlatformUIPort.
 *
 * Adapts FoundryUI (Foundry-specific) to PlatformUIPort (platform-agnostic).
 * This allows domain/application layers to depend only on PlatformUIPort.
 */
export class FoundryUIAdapter implements PlatformUIPort {
  constructor(private readonly foundryUI: FoundryUI) {}

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, PlatformUIError> {
    const result = this.foundryUI.removeJournalElement(journalId, journalName, html);
    if (!result.ok) {
      return err({
        code: "DOM_MANIPULATION_FAILED",
        message: `Failed to remove journal element '${journalName}' (${journalId}): ${result.error.message}`,
        operation: "removeJournalElement",
        details: { journalId, journalName, cause: result.error },
      });
    }
    return ok(undefined);
  }

  rerenderJournalDirectory(): Result<boolean, PlatformUIError> {
    const result = this.foundryUI.rerenderJournalDirectory();
    if (!result.ok) {
      return err({
        code: "RERENDER_FAILED",
        message: `Failed to re-render journal directory: ${result.error.message}`,
        operation: "rerenderJournalDirectory",
        details: { cause: result.error },
      });
    }
    return ok(result.value);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError> {
    const result = this.foundryUI.notify(message, type);
    if (!result.ok) {
      return err({
        code: result.error.code,
        message: result.error.message,
        operation: "notify",
        details: { cause: result.error },
      });
    }
    return ok(undefined);
  }
}

/**
 * DI-enabled wrapper for FoundryUIAdapter.
 */
export class DIFoundryUIAdapter extends FoundryUIAdapter {
  static dependencies = [foundryUIToken] as const;

  constructor(foundryUI: FoundryUI) {
    super(foundryUI);
  }
}
