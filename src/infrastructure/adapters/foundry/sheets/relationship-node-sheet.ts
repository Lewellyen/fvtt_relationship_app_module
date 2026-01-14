/**
 * Foundry Sheet for relationship node pages.
 * Full implementation for Phase 4.
 *
 * This sheet extends JournalEntryPageHandlebarsSheet via JournalEntryPageWindowSystemBridgeMixin
 * and provides the UI for editing/viewing JournalEntryPage documents with type relationship_app_node.
 * Features:
 * - Form-UI für Node-Daten bearbeiten
 * - Descriptions (Public/Hidden/GM)
 * - Reveal-Settings (Public/Hidden)
 * - Effects (optional)
 * - Linked Entity UUID
 * - Form-Validation
 * - Autosave (optional)
 */

import { JournalEntryPageWindowSystemBridgeMixin } from "@/infrastructure/ui/window-system/JournalEntryPageWindowSystemBridgeMixin";
import NodeSheetView from "@/infrastructure/ui/svelte/NodeSheetView.svelte";

/**
 * Base Sheet-Klasse mit JournalEntryPageWindowSystemBridgeMixin
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Base class name uses PascalCase convention
const NodeSheetBase = JournalEntryPageWindowSystemBridgeMixin(
  foundry.applications.sheets.journal.JournalEntryPageHandlebarsSheet,
  {
    definitionId: "relationship-node-sheet",
    component: {
      type: "svelte",
      component: NodeSheetView,
    },
    title: "Beziehungsknoten",
  },
  "fvtt_relationship_app_module"
);

/**
 * RelationshipNodeSheet for JournalEntryPage documents.
 * Full implementation with Window-System + DI-Services.
 */
export default class RelationshipNodeSheet extends NodeSheetBase {
  /**
   * Default options for the sheet.
   */
  static override DEFAULT_OPTIONS = {
    ...super.DEFAULT_OPTIONS,
    id: "journal-entry-relationship-node",
    classes: ["journal-entry-page", "relationship-node"],
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
          "modules/fvtt_relationship_app_module/templates/journal/parts/node-content-edit.hbs",
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
          "modules/fvtt_relationship_app_module/templates/journal/parts/node-content-view.hbs",
      },
    };
  })();
}
