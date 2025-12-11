import { MODULE_METADATA } from "@/application/constants/app-constants";
import type { SettingDefinition } from "@/application/settings/setting-definition.interface";
import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import {
  runtimeConfigSettingsSyncToken,
  settingRegistrationErrorMapperToken,
} from "@/application/tokens/application.tokens";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import {
  platformNotificationPortToken,
  platformI18nPortToken,
  platformValidationPortToken,
  platformLoggingPortToken,
} from "@/application/tokens/domain-ports.tokens";
import type { RuntimeConfigBinding } from "@/application/services/RuntimeConfigSync";
import type { SettingRegistrationErrorMapper } from "./SettingRegistrationErrorMapper";
import type { IRuntimeConfigSettingsSync } from "./runtime-config-settings-sync";
import type { SettingDefinitionRegistry } from "./registries/setting-definition-registry.interface";
import type { RuntimeConfigBindingRegistry } from "./registries/runtime-config-binding-registry.interface";
import {
  settingDefinitionRegistryToken,
  runtimeConfigBindingRegistryToken,
} from "@/application/tokens/application.tokens";

/**
 * ModuleSettingsRegistrar
 *
 * Registers all Foundry module settings using definition-based approach.
 * Each setting is defined separately for better organization and testability.
 *
 * **Design Benefits:**
 * - Easy to add new settings without modifying this class (Open/Closed Principle)
 * - Each setting definition can be tested in isolation
 * - Clear separation between registration logic and setting configuration
 * - Full DI: All dependencies injected via constructor (no Service Locator)
 * - Registry-based: Settings and bindings provided via registries, enabling extension without modification
 *
 * **OCP-Compliant:**
 * - New settings can be added by extending SettingDefinitionRegistry
 * - New bindings can be added by extending RuntimeConfigBindingRegistry
 * - No code changes needed in ModuleSettingsRegistrar for new settings/bindings
 *
 * **DIP-Compliant:**
 * - Uses PlatformSettingsRegistrationPort instead of PlatformSettingsPort
 * - Uses domain-neutral SettingValidators instead of Valibot schemas
 * - No infrastructure layer imports for validation
 * - Depends on registry abstractions, not concrete implementations
 */
export class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsRegistrationPort,
    private readonly runtimeConfigSettingsSync: IRuntimeConfigSettingsSync,
    private readonly errorMapper: SettingRegistrationErrorMapper,
    private readonly notifications: PlatformNotificationPort,
    private readonly i18n: PlatformI18nPort,
    private readonly logger: PlatformLoggingPort,
    private readonly validator: PlatformValidationPort,
    private readonly settingDefinitionRegistry: SettingDefinitionRegistry,
    private readonly runtimeConfigBindingRegistry: RuntimeConfigBindingRegistry
  ) {}

  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * Iterates over settings from SettingDefinitionRegistry and applies
   * corresponding bindings from RuntimeConfigBindingRegistry.
   *
   * Implements Open/Closed Principle: New settings can be added via registry
   * extension without modifying this method.
   */
  registerAll(): void {
    const definitions = this.settingDefinitionRegistry.getAll();
    const bindings = this.runtimeConfigBindingRegistry.getAll();

    for (const definition of definitions) {
      const binding = bindings.get(definition.key);
      this.registerDefinition(
        definition,
        binding,
        this.settings,
        this.runtimeConfigSettingsSync,
        this.errorMapper,
        this.i18n,
        this.logger,
        this.validator
      );
    }
  }

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    settings: PlatformSettingsRegistrationPort,
    runtimeConfigSettingsSync: IRuntimeConfigSettingsSync,
    errorMapper: SettingRegistrationErrorMapper,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ): void {
    const config = definition.createConfig(i18n, logger, validator);
    const configWithRuntimeBridge = binding
      ? runtimeConfigSettingsSync.attachBinding(config, binding)
      : config;

    const result = settings.registerSetting(
      MODULE_METADATA.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      errorMapper.mapAndNotify(result.error, definition.key);
      return;
    }

    if (binding) {
      runtimeConfigSettingsSync.syncInitialValue(settings, binding, definition.key);
    }
  }
}

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static dependencies = [
    platformSettingsRegistrationPortToken,
    runtimeConfigSettingsSyncToken,
    settingRegistrationErrorMapperToken,
    platformNotificationPortToken,
    platformI18nPortToken,
    platformLoggingPortToken,
    platformValidationPortToken,
    settingDefinitionRegistryToken,
    runtimeConfigBindingRegistryToken,
  ] as const;

  constructor(
    settings: PlatformSettingsRegistrationPort,
    runtimeConfigSettingsSync: IRuntimeConfigSettingsSync,
    errorMapper: SettingRegistrationErrorMapper,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort,
    settingDefinitionRegistry: SettingDefinitionRegistry,
    runtimeConfigBindingRegistry: RuntimeConfigBindingRegistry
  ) {
    super(
      settings,
      runtimeConfigSettingsSync,
      errorMapper,
      notifications,
      i18n,
      logger,
      validator,
      settingDefinitionRegistry,
      runtimeConfigBindingRegistry
    );
  }
}
