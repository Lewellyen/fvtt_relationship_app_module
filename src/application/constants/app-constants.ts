/**
 * Application-layer constants.
 *
 * Diese Konstanten repräsentieren Application-spezifische Konfiguration,
 * die von Application-Services verwendet wird.
 */

/**
 * Module metadata.
 * Diese Informationen definieren das Modul selbst.
 */
export const MODULE_METADATA = {
  ID: "fvtt_relationship_app_module",
  NAME: "Beziehungsnetzwerke für Foundry",
  AUTHOR: "Andreas Rothe",
  AUTHOR_EMAIL: "forenadmin.tir@gmail.com",
  AUTHOR_DISCORD: "lewellyen",
} as const;

/**
 * Setting keys für das Modul.
 * Diese Keys werden von Application-Services verwendet, um Settings zu lesen/schreiben.
 */
export const SETTING_KEYS = {
  LOG_LEVEL: "logLevel",
  CACHE_ENABLED: "cacheEnabled",
  CACHE_TTL_MS: "cacheTtlMs",
  CACHE_MAX_ENTRIES: "cacheMaxEntries",
  PERFORMANCE_TRACKING_ENABLED: "performanceTrackingEnabled",
  PERFORMANCE_SAMPLING_RATE: "performanceSamplingRate",
  METRICS_PERSISTENCE_ENABLED: "metricsPersistenceEnabled",
  METRICS_PERSISTENCE_KEY: "metricsPersistenceKey",
  NOTIFICATION_QUEUE_MAX_SIZE: "notificationQueueMaxSize",
  JOURNAL_DIRECTORY_BUTTONS_PLAYER: "journalDirectoryButtonsPlayer",
  JOURNAL_DIRECTORY_BUTTONS_TRUSTED: "journalDirectoryButtonsTrusted",
  JOURNAL_DIRECTORY_BUTTONS_ASSISTANT: "journalDirectoryButtonsAssistant",
  JOURNAL_DIRECTORY_BUTTONS_GAMEMASTER: "journalDirectoryButtonsGamemaster",
} as const;

/**
 * Default-Werte für Application-Logic.
 */
export const APP_DEFAULTS = {
  UNKNOWN_NAME: "Unknown",
  NO_VERSION_SELECTED: -1,
  CACHE_NOT_INITIALIZED: -1,
  CACHE_TTL_MS: 5000,
} as const;

/**
 * Public API Version.
 * Folgt Semantic Versioning: MAJOR.MINOR.PATCH
 *
 * - MAJOR: Breaking Changes zur Public API
 * - MINOR: Neue Features, backwards-compatible
 * - PATCH: Bug Fixes, backwards-compatible
 */
export const PUBLIC_API_VERSION = "1.0.0";

/**
 * Log-Präfix für alle Log-Ausgaben des Moduls.
 */
export const LOG_PREFIX = "Relationship App |";

// Deep freeze für Runtime-Immutability
Object.freeze(MODULE_METADATA);
Object.freeze(SETTING_KEYS);
Object.freeze(APP_DEFAULTS);
