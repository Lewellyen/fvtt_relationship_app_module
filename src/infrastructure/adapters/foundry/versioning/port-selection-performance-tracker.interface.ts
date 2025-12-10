/**
 * Interface for PortSelector performance tracking.
 * Handles performance.now() tracking for port selection operations.
 */
export interface IPortSelectionPerformanceTracker {
  /**
   * Start performance tracking.
   */
  startTracking(): void;

  /**
   * End performance tracking and return duration in milliseconds.
   * @returns Duration in milliseconds
   */
  endTracking(): number;
}
