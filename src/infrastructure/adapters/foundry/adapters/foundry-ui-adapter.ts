import type { Result } from "@/domain/types/result";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import type { PlatformUIError } from "@/domain/ports/errors/platform-ui-error.interface";
import type { FoundryUI } from "../interfaces/FoundryUI";
import { ok, err } from "@/domain/utils/result";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";

/**
 * Foundry-specific implementation of PlatformUIPort.
 *
 * Adapts FoundryUI (Foundry-specific) to PlatformUIPort (platform-agnostic).
 * This allows domain/application layers to depend only on PlatformUIPort.
 */
export class FoundryUIAdapter implements PlatformUIPort {
  constructor(private readonly foundryUI: FoundryUI) {}

  removeJournalDirectoryEntry(
    directoryId: string,
    journalId: string,
    journalName: string
  ): Result<void, PlatformUIError> {
    const result = this.foundryUI.removeJournalDirectoryEntry(directoryId, journalId, journalName);
    if (!result.ok) {
      return err({
        code: "DOM_MANIPULATION_FAILED",
        message: `Failed to remove journal directory entry '${journalName}' (${journalId}) from directory '${directoryId}': ${result.error.message}`,
        operation: "removeJournalDirectoryEntry",
        details: { directoryId, journalId, journalName, cause: result.error },
      });
    }
    return ok(undefined);
  }

  getDirectoryElement(directoryId: string): Result<HTMLElement | null, PlatformUIError> {
    const result = this.foundryUI.getDirectoryElement(directoryId);
    if (!result.ok) {
      return err({
        code: "DOM_ACCESS_FAILED",
        message: `Failed to get directory element for '${directoryId}': ${result.error.message}`,
        operation: "getDirectoryElement",
        details: { directoryId, cause: result.error },
      });
    }
    return ok(result.value);
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
