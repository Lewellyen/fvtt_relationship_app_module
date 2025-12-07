import { SETTING_KEYS, MODULE_METADATA } from "@/application/constants/app-constants";
import type { SettingDefinition } from "@/application/settings/setting-definition.interface";
import { logLevelSetting } from "@/application/settings/log-level-setting";
import { cacheEnabledSetting } from "@/application/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/application/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/application/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/application/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/application/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/application/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/application/settings/metrics-persistence-key-setting";
import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { runtimeConfigSyncToken } from "@/application/tokens/application.tokens";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import {
  platformNotificationPortToken,
  platformI18nPortToken,
  platformValidationPortToken,
  platformLoggingPortToken,
} from "@/application/tokens/domain-ports.tokens";
import type {
  RuntimeConfigSync,
  RuntimeConfigBinding,
} from "@/application/services/RuntimeConfigSync";
import { runtimeConfigBindings } from "@/application/services/RuntimeConfigSync";

/**
 * ModuleSettingsRegistrar
 *
 * Registers all Foundry module settings using definition-based approach.
 * Each setting is defined separately for better organization and testability.
 *
 * **Design Benefits:**
 * - Easy to add new settings without modifying this class
 * - Each setting definition can be tested in isolation
 * - Clear separation between registration logic and setting configuration
 * - Full DI: All dependencies injected via constructor (no Service Locator)
 *
 * **DIP-Compliant:**
 * - Uses PlatformSettingsRegistrationPort instead of PlatformSettingsPort
 * - Uses domain-neutral SettingValidators instead of Valibot schemas
 * - No infrastructure layer imports for validation
 */
export class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsRegistrationPort,
    private readonly runtimeConfigSync: RuntimeConfigSync,
    private readonly notifications: PlatformNotificationPort,
    private readonly i18n: PlatformI18nPort,
    private readonly logger: PlatformLoggingPort,
    private readonly validator: PlatformValidationPort
  ) {}

  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * NOTE: Container parameter removed - all dependencies injected via constructor.
   */
  registerAll(): void {
    // Register all settings
    this.registerDefinition(
      logLevelSetting,
      runtimeConfigBindings[SETTING_KEYS.LOG_LEVEL],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheEnabledSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_ENABLED],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheDefaultTtlSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_TTL_MS],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheMaxEntriesSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_MAX_ENTRIES],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      performanceTrackingSetting,
      runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      performanceSamplingSetting,
      runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_SAMPLING_RATE],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      metricsPersistenceEnabledSetting,
      runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_ENABLED],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      metricsPersistenceKeySetting,
      runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_KEY],
      this.settings,
      this.runtimeConfigSync,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
  }

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    settings: PlatformSettingsRegistrationPort,
    runtimeConfigSync: RuntimeConfigSync,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ): void {
    const config = definition.createConfig(i18n, logger, validator);
    const configWithRuntimeBridge = binding
      ? runtimeConfigSync.attachBinding(config, binding)
      : config;

    const result = settings.registerSetting(
      MODULE_METADATA.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      // Convert DomainSettingsError to PlatformNotificationPort's error format
      const error: { code: string; message: string; [key: string]: unknown } = {
        code: result.error.code,
        message: result.error.message,
        ...(result.error.details !== undefined && { details: result.error.details }),
      };
      notifications.error(`Failed to register ${definition.key} setting`, error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    if (binding) {
      runtimeConfigSync.syncInitialValue(settings, binding, definition.key);
    }
  }
}

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static dependencies = [
    platformSettingsRegistrationPortToken,
    runtimeConfigSyncToken,
    platformNotificationPortToken,
    platformI18nPortToken,
    platformLoggingPortToken,
    platformValidationPortToken,
  ] as const;

  constructor(
    settings: PlatformSettingsRegistrationPort,
    runtimeConfigSync: RuntimeConfigSync,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ) {
    super(settings, runtimeConfigSync, notifications, i18n, logger, validator);
  }
}
