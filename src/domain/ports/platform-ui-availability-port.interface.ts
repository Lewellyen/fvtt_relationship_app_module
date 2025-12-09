/**
 * Platform-agnostic port for checking UI availability.
 *
 * Different platforms may have different UI initialization timing:
 * - Foundry: UI becomes available in 'init' hook
 * - Roll20: UI might be available immediately
 * - CSV/Headless: UI never available
 */

/**
 * Platform-agnostic port for checking UI availability.
 */
export interface PlatformUIAvailabilityPort {
  /**
   * Checks if the platform UI is currently available.
   *
   * @returns true if UI is available, false otherwise
   */
  isAvailable(): boolean;

  /**
   * Registers a callback to be called when UI becomes available.
   *
   * Optional: Some platforms might not support this (returns immediately).
   *
   * @param callback - Function to call when UI becomes available
   */
  onAvailable?(callback: () => void): void;
}
