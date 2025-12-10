import type { IPortSelectionPerformanceTracker } from "./port-selection-performance-tracker.interface";

/**
 * Handles performance tracking for PortSelector operations.
 * Uses performance.now() for high-resolution timing.
 *
 * **Responsibilities:**
 * - Start performance tracking
 * - End performance tracking and calculate duration
 * - No business logic, pure performance measurement
 */
export class PortSelectionPerformanceTracker implements IPortSelectionPerformanceTracker {
  private startTime: number | undefined;

  /**
   * Start performance tracking.
   * Records the current high-resolution timestamp.
   */
  startTracking(): void {
    this.startTime = performance.now();
  }

  /**
   * End performance tracking and return duration in milliseconds.
   * @returns Duration in milliseconds, or 0 if tracking was not started
   */
  endTracking(): number {
    if (this.startTime === undefined) {
      return 0;
    }
    const durationMs = performance.now() - this.startTime;
    this.startTime = undefined; // Reset for next tracking
    return durationMs;
  }
}

// DI-Wrapper-Klasse - Import am Ende, um zirkuläre Abhängigkeiten zu vermeiden
// Keine Token-Imports nötig, da keine Dependencies

export class DIPortSelectionPerformanceTracker extends PortSelectionPerformanceTracker {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
