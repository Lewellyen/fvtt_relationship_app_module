import type { CacheServiceConfig } from "./cache-config.interface";

/**
 * Observer interface for cache configuration updates.
 * Allows components to react to configuration changes without directly managing configuration.
 *
 * **Design Benefits:**
 * - Separates configuration management from cache behavior
 * - Enables Observer Pattern for config synchronization
 * - Follows Single Responsibility Principle
 */
export interface CacheConfigObserver {
  /**
   * Called when cache configuration is updated.
   * Implementations should react to configuration changes (e.g., clear cache, enforce capacity).
   *
   * @param config - The updated cache configuration
   */
  onConfigUpdated(config: CacheServiceConfig): void;
}
