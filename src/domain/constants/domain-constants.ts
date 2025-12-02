/**
 * Domain-layer constants.
 *
 * Diese Konstanten repräsentieren Domain-Konzepte, die unabhängig von
 * jeglicher Technologie oder Framework-Implementierung sind.
 */

/**
 * Domain-level feature flags.
 * Diese Flags definieren Domain-Funktionalität, nicht technische Implementation.
 */
export const DOMAIN_FLAGS = {
  /** Flag key für versteckte Journal-Einträge */
  HIDDEN: "hidden",
} as const;

/**
 * Domain event names.
 * Diese Hook-Namen repräsentieren Domain-Events, die unabhängig von
 * der Platform-Implementierung (Foundry) sind.
 */
export const DOMAIN_EVENTS = {
  /** Event: Journal Directory wird gerendert */
  RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",

  /** Event: System-Initialisierung */
  INIT: "init",

  /** Event: System ist bereit */
  READY: "ready",

  /** Event: Journal Entry wird erstellt */
  CREATE_JOURNAL_ENTRY: "createJournalEntry",

  /** Event: Journal Entry wird aktualisiert */
  UPDATE_JOURNAL_ENTRY: "updateJournalEntry",

  /** Event: Journal Entry wird gelöscht */
  DELETE_JOURNAL_ENTRY: "deleteJournalEntry",
} as const;

// Deep freeze für Runtime-Immutability
Object.freeze(DOMAIN_FLAGS);
Object.freeze(DOMAIN_EVENTS);

