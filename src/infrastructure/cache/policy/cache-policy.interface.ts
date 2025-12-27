import type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { CacheServiceConfig } from "../cache-config.interface";

/**
 * Cache policy decisions.
 * Responsible for eviction and expiration enforcement.
 *
 * **Single Responsibility:**
 * - Capacity enforcement (eviction)
 * - Expiration enforcement
 * - Policy-based decisions
 *
 * **Design Benefits:**
 * - Separated from runtime operations
 * - Separated from telemetry
 * - Testable in isolation
 * - Exchangeable policy implementations
 */
export interface CachePolicy {
  /**
   * Enforces capacity limits by evicting entries if necessary.
   * Called after set operations to ensure maxEntries is respected.
   *
   * @param currentSize - Current cache size
   * @param config - Cache configuration
   * @returns Array of cache keys that were evicted
   */
  enforceCapacity(currentSize: number, config: CacheServiceConfig): CacheKey[];

  /**
   * Checks if an entry should be expired based on current time.
   *
   * @param expiresAt - Expiration timestamp (null means no expiration)
   * @param now - Current timestamp
   * @returns True if entry should be expired
   */
  shouldExpire(expiresAt: number | null, now: number): boolean;
}
