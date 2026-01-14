/**
 * Foundry Sheet for relationship graph pages.
 * Full implementation for Phase 4.
 *
 * This sheet extends JournalEntryPageHandlebarsSheet via JournalEntryPageWindowSystemBridgeMixin
 * and provides the UI for editing/viewing JournalEntryPage documents with type relationship_app_graph.
 * Features:
 * - Cytoscape-Integration für Graph-Visualisierung
 * - Dual Editor (UI Tab + JSON Tab)
 * - Autosave (Layout + Structure)
 */

import { JournalEntryPageWindowSystemBridgeMixin } from "@/infrastructure/ui/window-system/JournalEntryPageWindowSystemBridgeMixin";
import GraphSheetView from "@/infrastructure/ui/svelte/GraphSheetView.svelte";

/**
 * Base Sheet-Klasse mit JournalEntryPageWindowSystemBridgeMixin
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Base class name uses PascalCase convention
const GraphSheetBase = JournalEntryPageWindowSystemBridgeMixin(
  foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
  {
    definitionId: "relationship-graph-sheet",
    component: {
      type: "svelte",
      component: GraphSheetView,
    },
    title: "Beziehungsgraph",
  },
  "fvtt_relationship_app_module"
);

/**
 * RelationshipGraphSheet for JournalEntryPage documents.
 * Full implementation with Window-System + DI-Services.
 */
export default class RelationshipGraphSheet extends GraphSheetBase {
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

  /**
   * EDIT_PARTS - Definiert die Template-Parts für den Edit-Modus
   */
  static EDIT_PARTS = (() => {
    const baseSheet = foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet;
    const parts: Record<
      string,
      foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart
    > =
      // @ts-expect-error TS2339 - EDIT_PARTS may not exist in base class type definition but exists at runtime
      (baseSheet.EDIT_PARTS ?? {}) as Record<
        string,
        foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart
      >;
    const { header, footer, ...rest } = parts;
    return {
      header,
      content: {
        template:
          "modules/fvtt_relationship_app_module/templates/journal/parts/graph-content-edit.hbs",
      },
      ...rest,
      footer,
    };
  })();

  /**
   * VIEW_PARTS - Definiert die Template-Parts für den View-Modus
   */
  static VIEW_PARTS = (() => {
    const baseSheet = foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet;
    const parts: Record<
      string,
      foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart
    > =
      // @ts-expect-error TS2339 - VIEW_PARTS may not exist in base class type definition but exists at runtime
      (baseSheet.VIEW_PARTS ?? {}) as Record<
        string,
        foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart
      >;
    return {
      ...parts,
      content: {
        template:
          "modules/fvtt_relationship_app_module/templates/journal/parts/graph-content-view.hbs",
      },
    };
  })();
}
