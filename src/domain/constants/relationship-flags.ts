/**
 * Flag keys for relationship app markers.
 *
 * These flags are optional markers for quick identification of relationship pages.
 * The system structure (JournalEntryPage.system) is the Single Source of Truth.
 */

/**
 * Module ID for flag namespace.
 */
export const RELATIONSHIP_FLAGS_MODULE_ID = "fvtt_relationship_app_module";

/**
 * Flag keys for JournalEntry documents.
 */
export const JOURNAL_ENTRY_FLAGS = {
  HAS_RELATIONSHIP_NODE: `${RELATIONSHIP_FLAGS_MODULE_ID}.hasRelationshipNode`,
  HAS_RELATIONSHIP_GRAPH: `${RELATIONSHIP_FLAGS_MODULE_ID}.hasRelationshipGraph`,
} as const;

/**
 * Flag keys for JournalEntryPage documents.
 */
export const JOURNAL_ENTRY_PAGE_FLAGS = {
  IS_RELATIONSHIP_NODE: `${RELATIONSHIP_FLAGS_MODULE_ID}.isRelationshipNode`,
  IS_RELATIONSHIP_GRAPH: `${RELATIONSHIP_FLAGS_MODULE_ID}.isRelationshipGraph`,
} as const;
