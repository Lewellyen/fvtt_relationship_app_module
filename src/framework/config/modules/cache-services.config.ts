import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  cacheReaderPortToken,
  cacheWriterPortToken,
  cacheInvalidationPortToken,
  cacheStatsPortToken,
  cacheComputePortToken,
} from "@/application/tokens/domain-ports.tokens";
import { cacheServiceConfigToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service-config.token";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service.token";
import { cacheConfigSyncToken } from "@/infrastructure/shared/tokens/infrastructure/cache-config-sync.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import { DICacheService } from "@/infrastructure/cache/CacheService";
import { DICacheConfigSync, type CacheConfigSync } from "@/infrastructure/cache/CacheConfigSync";
import { DICachePortAdapter } from "@/infrastructure/adapters/cache/platform-cache-port-adapter";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";

/**
 * Registers CacheService and its configuration.
 *
 * Reads defaults from PlatformRuntimeConfigPort to make cache tuning possible
 * through build-time variables and Foundry settings instead of code changes.
 *
 * @param container - Root service container used during bootstrap
 * @returns Result with `void` on success or error message if registration fails
 */
export function registerCacheServices(container: ServiceContainer): Result<void, string> {
  const runtimeConfig: PlatformRuntimeConfigPort | null =
    container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("PlatformRuntimeConfigPort not registered");
  }

  const maxEntries = runtimeConfig.get("cacheMaxEntries");
  const config: CacheServiceConfig = {
    enabled: runtimeConfig.get("enableCacheService"),
    defaultTtlMs: runtimeConfig.get("cacheDefaultTtlMs"),
    namespace: MODULE_METADATA.ID,
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

  // Register segregated cache ports (same instance, different tokens)
  // This allows clients to depend only on the capabilities they need (ISP)
  const readerPortResult = container.registerClass(
    cacheReaderPortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(readerPortResult)) {
    return err(`Failed to register CacheReaderPort: ${readerPortResult.error.message}`);
  }

  const writerPortResult = container.registerClass(
    cacheWriterPortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(writerPortResult)) {
    return err(`Failed to register CacheWriterPort: ${writerPortResult.error.message}`);
  }

  const invalidationPortResult = container.registerClass(
    cacheInvalidationPortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(invalidationPortResult)) {
    return err(`Failed to register CacheInvalidationPort: ${invalidationPortResult.error.message}`);
  }

  const statsPortResult = container.registerClass(
    cacheStatsPortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(statsPortResult)) {
    return err(`Failed to register CacheStatsPort: ${statsPortResult.error.message}`);
  }

  const computePortResult = container.registerClass(
    cacheComputePortToken,
    DICachePortAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(computePortResult)) {
    return err(`Failed to register CacheComputePort: ${computePortResult.error.message}`);
  }

  // Register CacheConfigSync
  const configSyncResult = container.registerClass(
    cacheConfigSyncToken,
    DICacheConfigSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(configSyncResult)) {
    return err(`Failed to register CacheConfigSync: ${configSyncResult.error.message}`);
  }

  return ok(undefined);
}

/**
 * Initializes CacheConfigSync binding after container validation.
 * This ensures all dependencies are resolved before activating the binding.
 *
 * @param container - Service container with validated dependencies
 * @returns Result indicating success or initialization errors
 */
export function initializeCacheConfigSync(container: ServiceContainer): Result<void, string> {
  const configSyncResult = container.resolveWithError<CacheConfigSync>(cacheConfigSyncToken);
  if (!configSyncResult.ok) {
    // If CacheConfigSync is not available, it's not critical - binding will be skipped
    // This allows the system to work without RuntimeConfig synchronization
    return ok(undefined);
  }

  const configSync = configSyncResult.value;
  configSync.bind();

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "CacheServices",
  priority: 50,
  execute: registerCacheServices,
});
// Note: initializeCacheConfigSync is registered in dependencyconfig.ts as an internal step
