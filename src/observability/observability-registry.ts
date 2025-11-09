import type { Logger } from "@/interfaces/logger";
import type { MetricsRecorder } from "@/observability/interfaces/metrics-recorder";
import type { PortSelectionEvent } from "@/foundry/versioning/port-selection-events";
import { loggerToken, metricsRecorderToken } from "@/tokens/tokenindex";

/**
 * Observable service interface.
 * Services implementing this can be registered for observability.
 */
export interface ObservableService<TEvent = unknown> {
  onEvent(callback: (event: TEvent) => void): () => void;
}

/**
 * ObservabilityRegistry
 *
 * Central registry for self-registering observable services.
 * Routes events to appropriate observers based on event type.
 *
 * DESIGN: Services register themselves via constructor injection.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(observability: ObservabilityRegistry) {
 *     observability.registerPortSelector(this);
 *   }
 * }
 * ```
 */
export class ObservabilityRegistry {
  static dependencies = [loggerToken, metricsRecorderToken] as const;

  constructor(
    private readonly logger: Logger,
    private readonly metrics: MetricsRecorder
  ) {}

  /**
   * Register a PortSelector for observability.
   * Wires event emission to logging and metrics.
   *
   * @param service - Observable service that emits PortSelectionEvents
   */
  registerPortSelector(service: ObservableService<PortSelectionEvent>): void {
    service.onEvent((event) => {
      /* c8 ignore start -- Ternary: adapterName is optional parameter rarely provided */
      if (event.type === "success") {
        const adapterSuffix = event.adapterName ? ` for ${event.adapterName}` : "";
        this.logger.debug(
          `Port v${event.selectedVersion} selected in ${event.durationMs.toFixed(2)}ms${adapterSuffix}`
        );
        this.metrics.recordPortSelection(event.selectedVersion);
      } else {
      /* c8 ignore stop */
      /* c8 ignore start -- Error path: Port selection failure only occurs in edge cases (no compatible ports) */
        this.logger.error("Port selection failed", {
          foundryVersion: event.foundryVersion,
          availableVersions: event.availableVersions,
          adapterName: event.adapterName,
        });
        this.metrics.recordPortSelectionFailure(event.foundryVersion);
      }
      /* c8 ignore stop */
    });
  }

  // Future: Add more registration methods for other observable services
  // registerSomeOtherService(service: ObservableService<OtherEvent>): void { ... }
}
