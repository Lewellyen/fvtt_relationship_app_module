import type { IMetricsStateManager } from "../interfaces/metrics-state-manager.interface";

/**
 * Manages state change notifications for metrics.
 *
 * Follows Single Responsibility Principle: Only responsible for state change management.
 */
export class MetricsStateManager implements IMetricsStateManager {
  private callbacks: Set<() => void> = new Set();

  /**
   * Resets the state manager.
   * Clears all registered callbacks.
   */
  reset(): void {
    this.callbacks.clear();
  }

  /**
   * Subscribes to state changes.
   *
   * @param callback - Callback to invoke on state changes
   */
  onStateChanged(callback: () => void): void {
    this.callbacks.add(callback);
  }

  /**
   * Unsubscribes from state changes.
   *
   * @param callback - Callback to remove
   */
  unsubscribe(callback: () => void): void {
    this.callbacks.delete(callback);
  }

  /**
   * Notifies all registered callbacks of a state change.
   * Internal method used by MetricsCollector.
   */
  notifyStateChanged(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        // Ignore errors in callbacks to prevent one failing callback from breaking others

        console.error("Error in metrics state change callback:", error);
      }
    }
  }
}
