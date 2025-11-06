/**
 * Performance measurement constants for the application.
 *
 * Organized hierarchically by component for better structure and discoverability.
 * Used to standardize performance mark names across the codebase.
 *
 * @example
 * ```typescript
 * performance.mark(PERFORMANCE_MARKS.MODULE.BOOTSTRAP.START);
 * // ... operation
 * performance.mark(PERFORMANCE_MARKS.MODULE.BOOTSTRAP.END);
 * performance.measure(
 *   PERFORMANCE_MARKS.MODULE.BOOTSTRAP.DURATION,
 *   PERFORMANCE_MARKS.MODULE.BOOTSTRAP.START,
 *   PERFORMANCE_MARKS.MODULE.BOOTSTRAP.END
 * );
 * ```
 */
/* c8 ignore file -- Reine Konstanten-Definition, keine ausführbare Logik */
export const PERFORMANCE_MARKS = {
  MODULE: {
    BOOTSTRAP: {
      START: "module:bootstrap:start",
      END: "module:bootstrap:end",
      DURATION: "module:bootstrap:duration",
    },
    PORT_SELECTION: {
      START: "module:port-selection:start",
      END: "module:port-selection:end",
      DURATION: "module:port-selection:duration",
    },
  },
} as const;

/**
 * Legacy flat constants for backwards compatibility.
 * @deprecated Use PERFORMANCE_MARKS.MODULE.* instead
 */
export const LEGACY_PERFORMANCE_MARKS = {
  BOOTSTRAP_START: PERFORMANCE_MARKS.MODULE.BOOTSTRAP.START,
  BOOTSTRAP_END: PERFORMANCE_MARKS.MODULE.BOOTSTRAP.END,
  BOOTSTRAP_DURATION: PERFORMANCE_MARKS.MODULE.BOOTSTRAP.DURATION,
  PORT_SELECTION_START: PERFORMANCE_MARKS.MODULE.PORT_SELECTION.START,
  PORT_SELECTION_END: PERFORMANCE_MARKS.MODULE.PORT_SELECTION.END,
  PORT_SELECTION_DURATION: PERFORMANCE_MARKS.MODULE.PORT_SELECTION.DURATION,
} as const;
