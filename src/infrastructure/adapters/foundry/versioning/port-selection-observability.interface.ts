import type { PortSelectionEvent } from "./port-selection-events";

// Structural helper types to avoid circular imports while keeping full type coverage
export type PortSelectionObservableSelector = {
  onEvent: (callback: (event: PortSelectionEvent) => void) => () => void;
};

export type PortSelectionEventObserver = {
  handleEvent: (event: PortSelectionEvent) => void;
};

/**
 * Interface for PortSelector observability setup.
 * Handles self-registration with ObservabilityRegistry.
 *
 * Uses structural types to avoid circular dependencies with PortSelector and PortSelectionObserver.
 */
export interface IPortSelectionObservability {
  /**
   * Register PortSelector with ObservabilityRegistry.
   * @param selector - The PortSelector instance to register (must have onEvent method)
   */
  registerWithObservabilityRegistry(selector: PortSelectionObservableSelector): void;

  /**
   * Setup observability for PortSelector.
   * @param selector - The PortSelector instance (must have onEvent method)
   * @param observer - The PortSelectionObserver to use (must have handleEvent method)
   */
  setupObservability(
    selector: PortSelectionObservableSelector,
    observer: PortSelectionEventObserver
  ): void;
}
