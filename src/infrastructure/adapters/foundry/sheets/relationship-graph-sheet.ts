/**
 * Foundry Sheet for relationship graph pages.
 * Stub implementation for Phase 1 (full implementation in Phase 4).
 *
 * This sheet extends JournalEntryPageHandlebarsSheet and provides the UI
 * for editing/viewing JournalEntryPage documents with type relationship_app_graph.
 * WindowSystemBridgeMixin will be added in Phase 4.
 */

/**
 * RelationshipGraphSheet for JournalEntryPage documents.
 * Stub implementation - full implementation in Phase 4.
 */
export default class RelationshipGraphSheet
  extends foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet
{
  /**
   * Default options for the sheet.
   */
  static override DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "journal-entry-relationship-graph",
    classes: ["journal-entry-page", "relationship-graph"],
    width: 800,
    height: 600,
    resizable: true,
  };
}
