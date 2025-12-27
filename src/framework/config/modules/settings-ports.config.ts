import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { platformSettingsPortToken } from "@/application/tokens/domain-ports.tokens";
import { DIFoundrySettingsAdapter } from "@/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter";
import { FoundrySettingTypeMapper } from "@/infrastructure/adapters/foundry/settings-adapters/mappers/foundry-setting-type-mapper";
import { FoundrySettingsErrorMapper } from "@/infrastructure/adapters/foundry/settings-adapters/mappers/foundry-settings-error-mapper";
import { settingTypeMapperToken } from "@/infrastructure/shared/tokens/foundry/setting-type-mapper.token";
import { settingsErrorMapperToken } from "@/infrastructure/shared/tokens/foundry/settings-error-mapper.token";

/**
 * Registers settings port services.
 *
 * Services registered:
 * - SettingTypeMapper (singleton) - Maps platform-agnostic setting types to Foundry types
 * - SettingsErrorMapper (singleton) - Maps Foundry errors to platform-agnostic errors
 * - PlatformSettingsPort (singleton) - Platform-agnostic settings handling
 *
 * DESIGN: Settings ports are platform-agnostic abstractions over settings systems.
 * They enable multi-VTT support by decoupling from Foundry-specific APIs.
 * Mappers follow Open/Closed Principle, allowing extensions without modifying adapters.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerSettingsPorts(container: ServiceContainer): Result<void, string> {
  // Register SettingTypeMapper (Foundry implementation)
  const typeMapperResult = container.registerClass(
    settingTypeMapperToken,
    FoundrySettingTypeMapper,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(typeMapperResult)) {
    return err(`Failed to register SettingTypeMapper: ${typeMapperResult.error.message}`);
  }

  // Register SettingsErrorMapper (Foundry implementation)
  const errorMapperResult = container.registerClass(
    settingsErrorMapperToken,
    FoundrySettingsErrorMapper,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(errorMapperResult)) {
    return err(`Failed to register SettingsErrorMapper: ${errorMapperResult.error.message}`);
  }

  // Register PlatformSettingsPort (Foundry implementation)
  // Dependencies: foundrySettingsToken, settingTypeMapperToken, settingsErrorMapperToken
  const settingsPortResult = container.registerClass(
    platformSettingsPortToken,
    DIFoundrySettingsAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsPortResult)) {
    return err(`Failed to register PlatformSettingsPort: ${settingsPortResult.error.message}`);
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "SettingsPorts",
  priority: 90,
  execute: registerSettingsPorts,
});
