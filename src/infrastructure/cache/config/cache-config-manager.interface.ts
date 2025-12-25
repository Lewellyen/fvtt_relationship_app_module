import type { CacheServiceConfig } from "../cache-config.interface";

/**
 * Interface for cache configuration management.
 * Responsible only for managing cache configuration.
 */
export interface ICacheConfigManager {
  /**
   * Updates the cache configuration.
   *
   * @param partial - Partial configuration to merge with existing config
   */
  updateConfig(partial: Partial<CacheServiceConfig>): void;

  /**
   * Gets the current configuration.
   *
   * @returns The current cache configuration
   */
  getConfig(): CacheServiceConfig;

  /**
   * Checks if the cache is enabled.
   *
   * @returns true if the cache is enabled, false otherwise
   */
  isEnabled(): boolean;
}
