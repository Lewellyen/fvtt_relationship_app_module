import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { moduleSettingsRegistrarToken } from "@/infrastructure/shared/tokens/core/module-settings-registrar.token";
import {
  runtimeConfigSyncToken,
  settingRegistrationErrorMapperToken,
} from "@/application/tokens/application.tokens";
import { DIModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
import { DIRuntimeConfigSync } from "@/application/services/RuntimeConfigSync";
import { DISettingRegistrationErrorMapper } from "@/application/services/SettingRegistrationErrorMapper";

/**
 * Registers registrar services.
 *
 * Services registered:
 * - RuntimeConfigSync (singleton) - Handles Settings-to-RuntimeConfig synchronization
 * - ModuleSettingsRegistrar (singleton) - Manages all settings
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
  // Register RuntimeConfigSync first (required by ModuleSettingsRegistrar)
  const runtimeConfigSyncResult = container.registerClass(
    runtimeConfigSyncToken,
    DIRuntimeConfigSync,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(runtimeConfigSyncResult)) {
    return err(`Failed to register RuntimeConfigSync: ${runtimeConfigSyncResult.error.message}`);
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

  return ok(undefined);
}
