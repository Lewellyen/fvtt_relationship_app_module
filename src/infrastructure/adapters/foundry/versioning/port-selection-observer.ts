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

import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { MetricsRecorder } from "@/infrastructure/observability/interfaces/metrics-recorder";
import type { PortSelectionEvent } from "./port-selection-events";
import type { PortSelectionEventEmitter } from "./port-selection-events";

/**
 * Observes port selection events and handles logging and metrics.
 *
 * **Responsibilities:**
 * - Log port selection success/failure
 * - Record port selection metrics
 * - Emit events via EventEmitter (for other listeners)
 * - No business logic, pure observability
 *
 * @example
 * ```typescript
 * const observer = new PortSelectionObserver(logger, metricsRecorder, eventEmitter);
 * portSelector.onEvent((event) => observer.handleEvent(event));
 * ```
 */
export class PortSelectionObserver {
  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsRecorder,
    private readonly eventEmitter: PortSelectionEventEmitter
  ) {}

  /**
   * Handle a port selection event.
   *
   * Performs appropriate logging, metrics recording, and event emission.
   *
   * @param event - The port selection event to handle
   */
  handleEvent(event: PortSelectionEvent): void {
    // Emit event via EventEmitter for other listeners (e.g., ObservabilityRegistry)
    this.eventEmitter.emit(event);

    // Handle observability concerns
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

// DI-Wrapper-Klasse - Import am Ende, um zirkuläre Abhängigkeiten zu vermeiden
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { metricsRecorderToken } from "@/infrastructure/shared/tokens/observability/metrics-recorder.token";
import { portSelectionEventEmitterToken } from "@/infrastructure/shared/tokens/observability/port-selection-event-emitter.token";

export class DIPortSelectionObserver extends PortSelectionObserver {
  static dependencies = [
    loggerToken,
    metricsRecorderToken,
    portSelectionEventEmitterToken,
  ] as const;

  constructor(logger: Logger, metrics: MetricsRecorder, eventEmitter: PortSelectionEventEmitter) {
    super(logger, metrics, eventEmitter);
  }
}
