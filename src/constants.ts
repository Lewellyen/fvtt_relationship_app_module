/**
 * Module-wide constants for the Foundry VTT Relationship App Module.
 * Contains metadata and configuration values used throughout the application.
 *
 * @constant
 *
 * @note ENCODING REQUIREMENT
 * All source files in this project MUST be saved as UTF-8 without BOM.
 * This ensures proper display of German text (ä, ö, ü, ß) and prevents mojibake.
 * Configure your editor to use UTF-8 encoding for all .ts, .js, and .svelte files.
 */
/* c8 ignore file -- Reine Konstanten-Definition, keine ausführbare Logik */
export const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen",
  },
  LOG_PREFIX: "Foundry VTT Relationship App Module |",
  FLAGS: {
    HIDDEN: "hidden",
  },
  HOOKS: {
    RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",
    INIT: "init",
    READY: "ready",
  },
  SETTINGS: {
    LOG_LEVEL: "logLevel",
  },
  DEFAULTS: {
    UNKNOWN_NAME: "Unknown",
    NO_VERSION_SELECTED: -1,
    CACHE_NOT_INITIALIZED: -1,
    CACHE_TTL_MS: 5000,
  },
} as const;
