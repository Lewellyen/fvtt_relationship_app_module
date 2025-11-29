import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import { journalVisibilityConfigToken } from "@/infrastructure/shared/tokens";
import { createCacheNamespace } from "@/infrastructure/cache/cache.interface";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type { DomainCacheKey } from "@/domain/types/cache/cache-types";

/**
 * Registers JournalVisibilityConfig for JournalVisibilityService.
 *
 * Encapsulates infrastructure details (module IDs, flag keys, cache key factory)
 * into a config object that is injected into the Application layer service.
 *
 * @param container - Root service container used during bootstrap
 * @returns Result with `void` on success or error message if registration fails
 */
export function registerJournalVisibilityConfig(container: ServiceContainer): Result<void, string> {
  // Create cache key factory using Infrastructure utilities
  const buildCacheKey = createCacheNamespace("journal-visibility");
  const cacheKeyFactory = (resource: string): DomainCacheKey => {
    // Convert Infrastructure CacheKey (branded) to DomainCacheKey (string)
    return buildCacheKey(resource) as DomainCacheKey;
  };

  const config: JournalVisibilityConfig = {
    moduleNamespace: MODULE_CONSTANTS.MODULE.ID,
    hiddenFlagKey: MODULE_CONSTANTS.FLAGS.HIDDEN,
    unknownName: MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
    cacheKeyFactory,
  };

  const configResult = container.registerValue(journalVisibilityConfigToken, config);
  if (isErr(configResult)) {
    return err(`Failed to register JournalVisibilityConfig: ${configResult.error.message}`);
  }

  return ok(undefined);
}
