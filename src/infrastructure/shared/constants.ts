/**
 * Infrastructure-layer constants.
 *
 * Diese Datei enthält Infrastructure-spezifische Konstanten.
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
 * Infrastructure-spezifische Konstanten
 */

/**
 * Throttle window für Hook-Callbacks in Millisekunden.
 * Verhindert exzessive Verarbeitung bei schnell aufeinanderfolgenden Hook-Aufrufen.
 *
 * Auf 150ms gesetzt, um mehrere Journal-Einträge zu erfassen,
 * bevor Verarbeitung startet, während exzessive Aufrufe verhindert werden.
 */
export const HOOK_THROTTLE_WINDOW_MS = 150;

/**
 * Validation constraints für Input-Daten.
 */
export const VALIDATION_CONSTRAINTS = {
  /** Maximale Länge für IDs und Keys */
  MAX_ID_LENGTH: 100,
  /** Maximale Länge für Namen */
  MAX_NAME_LENGTH: 100,
  /** Maximale Länge für Flag-Keys */
  MAX_FLAG_KEY_LENGTH: 100,
} as const;

/**
 * Metrics collection configuration.
 */
export const METRICS_CONFIG = {
  /** Größe des Circular-Buffers für Resolution-Zeiten */
  RESOLUTION_TIMES_BUFFER_SIZE: 100,
} as const;

// Deep freeze Infrastructure-Constants
Object.freeze(VALIDATION_CONSTRAINTS);
Object.freeze(METRICS_CONFIG);
