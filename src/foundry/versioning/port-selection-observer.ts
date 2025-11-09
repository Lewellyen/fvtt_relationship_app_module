/**
 * Observer for PortSelector events that handles observability concerns.
 *
 * **Design Rationale:**
 * - Separates observability logic from port selection logic
 * - PortSelector remains focused on its core responsibility
 * - Observability can be easily extended without modifying PortSelector
 * - Testable in isolation
 *
 * @see PortSelector for event emission
 * @see PortSelectionEventEmitter for event infrastructure
 */

import type { Logger } from "@/interfaces/logger";
import type { MetricsRecorder } from "@/observability/interfaces/metrics-recorder";
import type { PortSelectionEvent } from "@/foundry/versioning/port-selection-events";

/**
 * Observes port selection events and handles logging and metrics.
 *
 * **Responsibilities:**
 * - Log port selection success/failure
 * - Record port selection metrics
 * - No business logic, pure observability
 *
 * @example
 * ```typescript
 * const observer = new PortSelectionObserver(logger, metricsRecorder);
 * portSelector.onEvent((event) => observer.handleEvent(event));
 * ```
 */
export class PortSelectionObserver {
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsRecorder
  ) {}

  /**
   * Handle a port selection event.
   *
   * Performs appropriate logging and metrics recording based on event type.
   *
   * @param event - The port selection event to handle
   */
  handleEvent(event: PortSelectionEvent): void {
    if (event.type === "success") {
      this.handleSuccess(event);
    } else {
      this.handleFailure(event);
    }
  }

  /**
   * Handle successful port selection.
   *
   * Logs debug message and records metrics.
   */
  private handleSuccess(event: PortSelectionEvent & { type: "success" }): void {
    // Log success with detailed information
    this.logger.debug(
      `Port selection completed in ${event.durationMs.toFixed(2)}ms (selected: v${event.selectedVersion}${event.adapterName ? ` for ${event.adapterName}` : ""})`
    );

    // Record successful port selection in metrics
    this.metrics.recordPortSelection(event.selectedVersion);
  }

  /**
   * Handle failed port selection.
   *
   * Logs error and records failure metrics.
   */
  private handleFailure(event: PortSelectionEvent & { type: "failure" }): void {
    // Log failure with diagnostic information
    this.logger.error("No compatible port found", {
      foundryVersion: event.foundryVersion,
      availableVersions: event.availableVersions,
      adapterName: event.adapterName,
    });

    // Record port selection failure in metrics
    this.metrics.recordPortSelectionFailure(event.foundryVersion);
  }
}
