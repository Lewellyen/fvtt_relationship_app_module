import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { PortSelector } from "./portselector";
import type { PortSelectionObserver } from "./port-selection-observer";
import type { IPortSelectionObservability } from "./port-selection-observability.interface";

/**
 * Handles observability setup for PortSelector.
 * Manages self-registration with ObservabilityRegistry.
 *
 * **Responsibilities:**
 * - Register PortSelector with ObservabilityRegistry
 * - Setup observability wiring (selector → observer)
 * - No business logic, pure observability setup
 */
export class PortSelectionObservability implements IPortSelectionObservability {
  constructor(private readonly observabilityRegistry: ObservabilityRegistry) {}

  /**
   * Register PortSelector with ObservabilityRegistry.
   * This enables automatic logging and metrics collection.
   */
  registerWithObservabilityRegistry(selector: PortSelector): void {
    this.observabilityRegistry.registerPortSelector(selector);
  }

  /**
   * Setup observability for PortSelector.
   * Wires PortSelector events to PortSelectionObserver.
   */
  setupObservability(selector: PortSelector, observer: PortSelectionObserver): void {
    // Subscribe to PortSelector events and forward to observer
    selector.onEvent((event) => {
      observer.handleEvent(event);
    });
  }
}

// DI-Wrapper-Klasse - Import am Ende, um zirkuläre Abhängigkeiten zu vermeiden
import { observabilityRegistryToken } from "@/infrastructure/shared/tokens/observability/observability-registry.token";

export class DIPortSelectionObservability extends PortSelectionObservability {
  static dependencies = [observabilityRegistryToken] as const;

  constructor(observabilityRegistry: ObservabilityRegistry) {
    super(observabilityRegistry);
  }
}
