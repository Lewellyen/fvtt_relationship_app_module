import type { DomainCacheKey } from "@/domain/types/cache/cache-types";

/**
 * Configuration object for JournalVisibilityService.
 * Encapsulates infrastructure details (module IDs, flag keys, cache keys).
 *
 * This config object is created in the Framework layer (where infrastructure details are known)
 * and injected into the Application layer service, maintaining clean separation of concerns.
 */
export interface JournalVisibilityConfig {
  /** Module namespace for flags */
  moduleNamespace: string;
  /** Flag key for hidden entries */
  hiddenFlagKey: string;
  /** Default name for entries without name */
  unknownName: string;
  /** Cache key factory for hidden entries */
  cacheKeyFactory: (resource: string) => DomainCacheKey;
}
