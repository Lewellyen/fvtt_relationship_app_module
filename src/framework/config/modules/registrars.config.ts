import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  runtimeConfigSyncToken,
  runtimeConfigSettingsSyncToken,
  settingRegistrationErrorMapperToken,
  settingDefinitionRegistryToken,
  runtimeConfigBindingRegistryToken,
  moduleSettingsRegistrarToken,
} from "@/application/tokens/application.tokens";
import { moduleSettingsRegistrarToken as legacyModuleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core/module-settings-registrar.token";
import { DIModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
import { DIRuntimeConfigSync } from "@/application/services/RuntimeConfigSync";
import { DIRuntimeConfigSettingsSync } from "@/application/services/runtime-config-settings-sync";
import { DISettingRegistrationErrorMapper } from "@/application/services/SettingRegistrationErrorMapper";
import { DefaultSettingDefinitionRegistry } from "@/application/services/registries/default-setting-definition-registry";
import { DefaultRuntimeConfigBindingRegistry } from "@/application/services/registries/default-runtime-config-binding-registry";

/**
 * Registers registrar services.
 *
 * Services registered:
 * - RuntimeConfigSync (singleton) - Handles Settings-to-RuntimeConfig synchronization
 * - RuntimeConfigSettingsSync (singleton) - Encapsulates RuntimeConfig synchronization for Settings
 * - SettingRegistrationErrorMapper (singleton) - Maps registration errors to notifications
 * - ModuleSettingsRegistrar (singleton) - Manages all settings registration
 *
 * NOTE: Event listeners are now registered via registerEventPorts() in event-ports.config.ts.
 * This separation improves modularity and follows Single Responsibility Principle.
 *
 * DESIGN: Registrars are DI services that can be resolved when needed.
 * They are NOT instantiated with 'new' in business logic.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerRegistrars(container: ServiceContainer): Result<void, string> {
  // Register RuntimeConfigSync first (required by RuntimeConfigSettingsSync)
  const runtimeConfigSyncResult = container.registerClass(
    runtimeConfigSyncToken,
    DIRuntimeConfigSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigSyncResult)) {
    return err(`Failed to register RuntimeConfigSync: ${runtimeConfigSyncResult.error.message}`);
  }

  // Register RuntimeConfigSettingsSync (required by ModuleSettingsRegistrar)
  const runtimeConfigSettingsSyncResult = container.registerClass(
    runtimeConfigSettingsSyncToken,
    DIRuntimeConfigSettingsSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigSettingsSyncResult)) {
    return err(
      `Failed to register RuntimeConfigSettingsSync: ${runtimeConfigSettingsSyncResult.error.message}`
    );
  }

  // Register SettingRegistrationErrorMapper (required by ModuleSettingsRegistrar)
  const errorMapperResult = container.registerClass(
    settingRegistrationErrorMapperToken,
    DISettingRegistrationErrorMapper,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(errorMapperResult)) {
    return err(
      `Failed to register SettingRegistrationErrorMapper: ${errorMapperResult.error.message}`
    );
  }

  // Register SettingDefinitionRegistry (required by ModuleSettingsRegistrar)
  const settingDefinitionRegistryResult = container.registerClass(
    settingDefinitionRegistryToken,
    DefaultSettingDefinitionRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingDefinitionRegistryResult)) {
    return err(
      `Failed to register SettingDefinitionRegistry: ${settingDefinitionRegistryResult.error.message}`
    );
  }

  // Register RuntimeConfigBindingRegistry (required by ModuleSettingsRegistrar)
  const runtimeConfigBindingRegistryResult = container.registerClass(
    runtimeConfigBindingRegistryToken,
    DefaultRuntimeConfigBindingRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigBindingRegistryResult)) {
    return err(
      `Failed to register RuntimeConfigBindingRegistry: ${runtimeConfigBindingRegistryResult.error.message}`
    );
  }

  // Register ModuleSettingsRegistrar
  const settingsRegistrarResult = container.registerClass(
    moduleSettingsRegistrarToken,
    DIModuleSettingsRegistrar,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(settingsRegistrarResult)) {
    return err(
      `Failed to register ModuleSettingsRegistrar: ${settingsRegistrarResult.error.message}`
    );
  }

  // Backward compatibility: keep legacy infrastructure token as alias
  const legacyAliasResult = container.registerAlias(
    legacyModuleSettingsRegistrarToken,
    moduleSettingsRegistrarToken
  );
  if (isErr(legacyAliasResult)) {
    return err(
      `Failed to register legacy ModuleSettingsRegistrar token alias: ${legacyAliasResult.error.message}`
    );
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "Registrars",
  priority: 150,
  execute: registerRegistrars,
});
