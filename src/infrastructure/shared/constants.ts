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
/* v8 ignore file -- Reine Konstanten-Definition, keine ausführbare Logik -- @preserve */
/**
 * Throttle window for hook callbacks in milliseconds.
 * Prevents excessive processing during rapid hook fires.
 *
 * Set to 150ms to allow multiple journal entries to be created
 * before processing, while still preventing excessive calls.
 */
export const HOOK_THROTTLE_WINDOW_MS = 150;

/**
 * Validation constraints for input data.
 */
export const VALIDATION_CONSTRAINTS = {
  /** Maximum length for IDs and keys */
  MAX_ID_LENGTH: 100,
  /** Maximum length for names */
  MAX_NAME_LENGTH: 100,
  /** Maximum length for flag keys */
  MAX_FLAG_KEY_LENGTH: 100,
} as const;

/**
 * Metrics collection configuration.
 */
export const METRICS_CONFIG = {
  /** Size of circular buffer for resolution times */
  RESOLUTION_TIMES_BUFFER_SIZE: 100,
} as const;

export const MODULE_CONSTANTS = {
  MODULE: {
    ID: "fvtt_relationship_app_module",
    NAME: "Beziehungsnetzwerke für Foundry",
    AUTHOR: "Andreas Rothe",
    AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
    AUTHOR_DISCORD: "lewellyen",
  },
  LOG_PREFIX: "Relationship App |",
  FLAGS: {
    HIDDEN: "hidden",
  },
  HOOKS: {
    RENDER_JOURNAL_DIRECTORY: "renderJournalDirectory",
    INIT: "init",
    READY: "ready",
    CREATE_JOURNAL_ENTRY: "createJournalEntry",
    UPDATE_JOURNAL_ENTRY: "updateJournalEntry",
    DELETE_JOURNAL_ENTRY: "deleteJournalEntry",
  },
  SETTINGS: {
    LOG_LEVEL: "logLevel",
    CACHE_ENABLED: "cacheEnabled",
    CACHE_TTL_MS: "cacheTtlMs",
    CACHE_MAX_ENTRIES: "cacheMaxEntries",
    PERFORMANCE_TRACKING_ENABLED: "performanceTrackingEnabled",
    PERFORMANCE_SAMPLING_RATE: "performanceSamplingRate",
    METRICS_PERSISTENCE_ENABLED: "metricsPersistenceEnabled",
    METRICS_PERSISTENCE_KEY: "metricsPersistenceKey",
  },
  API: {
    /**
     * Public API version for external module consumption.
     * Follows semantic versioning: MAJOR.MINOR.PATCH
     *
     * MAJOR: Breaking changes to public API
     * MINOR: New features, backwards-compatible
     * PATCH: Bug fixes, backwards-compatible
     */
    VERSION: "1.0.0",
  },
  DEFAULTS: {
    UNKNOWN_NAME: "Unknown",
    NO_VERSION_SELECTED: -1,
    CACHE_NOT_INITIALIZED: -1,
    CACHE_TTL_MS: 5000,
  },
} as const;

// Deep freeze constants for runtime immutability
Object.freeze(MODULE_CONSTANTS);
Object.freeze(MODULE_CONSTANTS.MODULE);
Object.freeze(MODULE_CONSTANTS.API);
Object.freeze(MODULE_CONSTANTS.FLAGS);
Object.freeze(MODULE_CONSTANTS.HOOKS);
Object.freeze(MODULE_CONSTANTS.SETTINGS);
Object.freeze(MODULE_CONSTANTS.DEFAULTS);
Object.freeze(VALIDATION_CONSTRAINTS);
Object.freeze(METRICS_CONFIG);
