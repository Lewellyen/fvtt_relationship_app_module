import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  cacheServiceConfigToken,
  cacheServiceToken,
  runtimeConfigToken,
  platformCachePortToken,
} from "@/infrastructure/shared/tokens";
import type { CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import { DICacheService } from "@/infrastructure/cache/CacheService";
import { DICachePortAdapter } from "@/infrastructure/adapters/cache/platform-cache-port-adapter";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

/**
 * Registers CacheService and its configuration.
 *
 * Reads defaults from RuntimeConfigService to make cache tuning possible
 * through build-time variables and Foundry settings instead of code changes.
 *
 * @param container - Root service container used during bootstrap
 * @returns Result with `void` on success or error message if registration fails
 */
export function registerCacheServices(container: ServiceContainer): Result<void, string> {
  const runtimeConfig: RuntimeConfigService | null =
    container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }

  const maxEntries = runtimeConfig.get("cacheMaxEntries");
  const config: CacheServiceConfig = {
    enabled: runtimeConfig.get("enableCacheService"),
    defaultTtlMs: runtimeConfig.get("cacheDefaultTtlMs"),
    namespace: MODULE_CONSTANTS.MODULE.ID,
    ...(typeof maxEntries === "number" && maxEntries > 0 ? { maxEntries } : {}),
  };

  const configResult = container.registerValue(cacheServiceConfigToken, config);
  if (isErr(configResult)) {
    return err(`Failed to register CacheServiceConfig: ${configResult.error.message}`);
  }

  const serviceResult = container.registerClass(
    cacheServiceToken,
    DICacheService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(serviceResult)) {
    return err(`Failed to register CacheService: ${serviceResult.error.message}`);
  }

  // Register PlatformCachePort
  const cachePortResult = container.registerClass(
    platformCachePortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(cachePortResult)) {
    return err(`Failed to register PlatformCachePort: ${cachePortResult.error.message}`);
  }

  return ok(undefined);
}
