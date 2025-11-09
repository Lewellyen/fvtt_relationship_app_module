/**
 * Utilities for distributed tracing and request correlation.
 * Provides unique trace IDs to correlate log messages across operations.
 */

/**
 * Generates a unique trace ID for correlating related log entries.
 *
 * Format: {timestamp}-{random}
 * - timestamp: Unix timestamp in milliseconds (for chronological ordering)
 * - random: Random hex string for uniqueness
 *
 * @returns A unique trace ID string
 *
 * @example
 * ```typescript
 * const traceId = generateTraceId();
 * logger.withTraceId(traceId).info('Starting operation');
 * // ... nested operations can use the same traceId ...
 * logger.withTraceId(traceId).info('Operation completed');
 * ```
 */
export function generateTraceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Extracts timestamp from a trace ID (if available).
 * Useful for debugging and metrics correlation.
 *
 * @param traceId - The trace ID to parse
 * @returns The timestamp in milliseconds, or null if invalid format
 */
export function getTraceTimestamp(traceId: string): number | null {
  const parts = traceId.split("-");
  if (parts.length !== 2) {
    return null;
  }

  // parts[0] is defined because we bail out when array length isn't exactly two
  /* type-coverage:ignore-next-line */
  const timestamp = parseInt(parts[0]!, 10);
  return isNaN(timestamp) ? null : timestamp;
}
