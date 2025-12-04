/**
 * Infrastructure-layer constants.
 *
 * Diese Datei enthält Infrastructure-spezifische Konstanten und
 * re-exportiert Domain/Application-Konstanten für Backward-Compatibility.
 *
 * HINWEIS: Für neue Code sollten die layer-spezifischen Imports verwendet werden:
 * - @/domain/constants/domain-constants
 * - @/application/constants/app-constants
 *
 * @constant
 *
 * @note ENCODING REQUIREMENT
 * All source files in this project MUST be saved as UTF-8 without BOM.
 * This ensures proper display of German text (ä, ö, ü, ß) and prevents mojibake.
 * Configure your editor to use UTF-8 encoding for all .ts, .js, and .svelte files.
 */
/* v8 ignore file -- Reine Konstanten-Definition, keine ausführbare Logik -- @preserve */

// Re-export Domain/Application constants für Backward-Compatibility
import { DOMAIN_FLAGS, DOMAIN_EVENTS } from "@/domain/constants/domain-constants";
import {
  MODULE_METADATA,
  SETTING_KEYS,
  APP_DEFAULTS,
  PUBLIC_API_VERSION,
  LOG_PREFIX,
} from "@/application/constants/app-constants";

/**
 * @deprecated Import directly from @/domain/constants/domain-constants or @/application/constants/app-constants
 * This re-export exists for backward compatibility only.
 */
export const MODULE_CONSTANTS = {
  MODULE: MODULE_METADATA,
  LOG_PREFIX: LOG_PREFIX,
  FLAGS: DOMAIN_FLAGS,
  HOOKS: DOMAIN_EVENTS,
  SETTINGS: SETTING_KEYS,
  API: {
    VERSION: PUBLIC_API_VERSION,
  },
  DEFAULTS: APP_DEFAULTS,
} as const;

// Deep freeze underlying constants (MODULE_CONSTANTS inherits immutability from these)
Object.freeze(MODULE_METADATA);
Object.freeze(DOMAIN_FLAGS);
Object.freeze(DOMAIN_EVENTS);
Object.freeze(SETTING_KEYS);
Object.freeze(APP_DEFAULTS);

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
