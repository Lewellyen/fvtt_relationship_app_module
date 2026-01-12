/**
 * Orchestrator for registering JournalEntryPage Sheets and DataModels during bootstrap.
 *
 * Responsibilities:
 * - Register DataModels with CONFIG.JournalEntryPage.dataModels
 * - Register Sheets with DocumentSheetConfig
 */

import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { JOURNAL_PAGE_SHEET_TYPE } from "@/application/constants/app-constants";
import { RelationshipNodeDataModel } from "@/infrastructure/adapters/foundry/data-models/relationship-node-data-model";
import { RelationshipGraphDataModel } from "@/infrastructure/adapters/foundry/data-models/relationship-graph-data-model";
import RelationshipNodeSheet from "@/infrastructure/adapters/foundry/sheets/relationship-node-sheet";
import RelationshipGraphSheet from "@/infrastructure/adapters/foundry/sheets/relationship-graph-sheet";

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
  static registerSheetsAndDataModels(): Result<void, string> {
    // Register DataModels
    Object.assign(CONFIG.JournalEntryPage.dataModels, {
      [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE]: RelationshipNodeDataModel,
      [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH]: RelationshipGraphDataModel,
    });

    // Register Sheets
    const DOCUMENT_SHEET_CONFIG = foundry.applications.apps.DocumentSheetConfig;

    // Register Relationship Node Sheet
    DOCUMENT_SHEET_CONFIG.registerSheet(
      JournalEntryPage,
      MODULE_METADATA.ID,
      RelationshipNodeSheet,
      {
        types: [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE],
        makeDefault: true,
        label: () => {
          return (
            game?.i18n?.localize("TYPES.JournalEntryPage.relationship_app_node") ||
            "Beziehungsknoten"
          );
        },
      }
    );

    // Register Relationship Graph Sheet
    DOCUMENT_SHEET_CONFIG.registerSheet(
      JournalEntryPage,
      MODULE_METADATA.ID,
      RelationshipGraphSheet,
      {
        types: [JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH],
        makeDefault: true,
        label: () => {
          return (
            game?.i18n?.localize("TYPES.JournalEntryPage.relationship_app_graph") ||
            "Beziehungsgraph"
          );
        },
      }
    );

    return ok(undefined);
  }
}
