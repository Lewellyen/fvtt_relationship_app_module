/**
 * Performance measurement constants for the application.
 * Used to standardize performance mark names across the codebase.
 */
export const PERFORMANCE_MARKS = {
  BOOTSTRAP_START: "bootstrap-start",
  BOOTSTRAP_END: "bootstrap-end",
  BOOTSTRAP_DURATION: "bootstrap-duration",
  PORT_SELECTION_START: "port-selection-start",
  PORT_SELECTION_END: "port-selection-end",
  PORT_SELECTION_DURATION: "port-selection-duration",
} as const;
