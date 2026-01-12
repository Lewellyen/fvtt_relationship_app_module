import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { JournalEntryPageSheetBootstrapper } from "../orchestrators/journal-entry-page-sheet-bootstrapper";

/**
 * Init phase for JournalEntryPage Sheet and DataModel registration.
 */
export class JournalEntryPageSheetInitPhase implements InitPhase {
  readonly id = "journal-entry-page-sheet-registration";
  readonly priority = 5; // After settings (4), before other UI components
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE; // Sheets can fail without breaking the module

  execute(
    _ctx: InitPhaseContext
  ): ReturnType<typeof JournalEntryPageSheetBootstrapper.registerSheetsAndDataModels> {
    // Context not used - registration has no dependencies
    return JournalEntryPageSheetBootstrapper.registerSheetsAndDataModels();
  }
}
