import type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { CacheServiceConfig } from "../cache-config.interface";
import type { CachePolicy as ICachePolicy } from "./cache-policy.interface";
import { CacheCapacityManager } from "../cache-capacity-manager";

/**
 * Cache policy implementation.
 * Handles capacity enforcement and expiration checks.
 */
export class CachePolicy implements ICachePolicy {
  constructor(private readonly capacityManager: CacheCapacityManager) {}

  enforceCapacity(currentSize: number, config: CacheServiceConfig): CacheKey[] {
    if (!config.maxEntries || currentSize <= config.maxEntries) {
      return [];
    }

    return this.capacityManager.enforceCapacity(config.maxEntries);
  }

  shouldExpire(expiresAt: number | null, now: number): boolean {
    if (expiresAt === null) {
      return false;
    }
    return now >= expiresAt;
  }
}
