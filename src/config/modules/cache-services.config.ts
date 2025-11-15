import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { cacheServiceConfigToken, cacheServiceToken } from "@/tokens/tokenindex";
import type { CacheServiceConfig } from "@/interfaces/cache";
import { DICacheService } from "@/services/CacheService";
import { MODULE_CONSTANTS } from "@/constants";
import { runtimeConfigToken } from "@/tokens/tokenindex";
import type { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";

/**
 * Registers CacheService and its configuration.
 *
 * Reads defaults from RuntimeConfigService to make cache tuning possible
 * through build-time variables and Foundry settings instead of code changes.
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

  return ok(undefined);
}
