/**
 * Interface for managing metrics state changes.
 */
export interface IMetricsStateManager {
  /**
   * Resets the state manager.
   */
  reset(): void;

  /**
   * Subscribes to state changes.
   *
   * @param callback - Callback to invoke on state changes
   */
  onStateChanged(callback: () => void): void;

  /**
   * Unsubscribes from state changes.
   *
   * @param callback - Callback to remove
   */
  unsubscribe(callback: () => void): void;
}
