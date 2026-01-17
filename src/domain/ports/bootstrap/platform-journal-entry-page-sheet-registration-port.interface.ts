import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for registering JournalEntryPage sheets and data models.
 *
 * Foundry mapping:
 * - CONFIG.JournalEntryPage.dataModels
 * - foundry.applications.apps.DocumentSheetConfig.registerSheet(...)
 */
export interface PlatformJournalEntryPageSheetRegistrationPort {
  registerSheetsAndDataModels(): Result<void, string>;
}
