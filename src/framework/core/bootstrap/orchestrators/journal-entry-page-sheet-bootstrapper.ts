/**
 * Orchestrator for registering JournalEntryPage Sheets and DataModels during bootstrap.
 *
 * Responsibilities:
 * - Register DataModels with CONFIG.JournalEntryPage.dataModels
 * - Register Sheets with DocumentSheetConfig
 */

import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { platformJournalEntryPageSheetRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import type { PlatformJournalEntryPageSheetRegistrationPort } from "@/domain/ports/bootstrap/platform-journal-entry-page-sheet-registration-port.interface";

/**
 * JournalEntryPageSheetBootstrapper.
 * Handles registration of Sheets and DataModels for relationship page types.
 */
export class JournalEntryPageSheetBootstrapper {
  /**
   * Registers all JournalEntryPage Sheets and DataModels.
   *
   * @returns Result indicating success (no errors expected, Foundry API handles errors internally)
   */
  static registerSheetsAndDataModels(container: PlatformContainerPort): Result<void, string> {
    const portResult = container.resolveWithError<PlatformJournalEntryPageSheetRegistrationPort>(
      platformJournalEntryPageSheetRegistrationPortToken
    );
    if (!portResult.ok) {
      return ok(undefined); // optional feature
    }

    const port = portResult.value;
    return port.registerSheetsAndDataModels();
  }
}
