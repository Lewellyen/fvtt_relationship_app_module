import { SETTING_KEYS, MODULE_METADATA } from "@/application/constants/app-constants";
import type {
  SettingDefinition,
  SettingConfig as ModuleSettingConfig,
} from "@/application/settings/setting-definition.interface";
// LogLevel is imported from domain layer (not framework layer) to maintain Clean Architecture
// See: https://github.com/Lewellyen/fvtt_relationship_app_module/issues/35
import type { LogLevel } from "@/domain/types/log-level";
import { logLevelSetting } from "@/application/settings/log-level-setting";
import { cacheEnabledSetting } from "@/application/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/application/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/application/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/application/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/application/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/application/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/application/settings/metrics-persistence-key-setting";
import type {
  RuntimeConfigService,
  RuntimeConfigKey,
  RuntimeConfigValues,
} from "@/application/services/RuntimeConfigService";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { SettingValidator } from "@/domain/types/settings";
import { SettingValidators } from "@/domain/types/settings";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import { platformSettingsRegistrationPortToken } from "@/infrastructure/shared/tokens/ports.tokens";
import {
  platformNotificationPortToken,
  platformI18nPortToken,
  platformValidationPortToken,
  platformLoggingPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Binding configuration for syncing a setting with RuntimeConfig.
 *
 * Uses domain-neutral SettingValidator instead of Valibot schemas.
 */
interface RuntimeConfigBinding<TSchema, K extends RuntimeConfigKey> {
  runtimeKey: K;
  validator: SettingValidator<TSchema>;
  normalize: (value: TSchema) => RuntimeConfigValues[K];
}

/**
 * LogLevel validator that checks if value is a valid LogLevel enum value.
 */
const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "number" && value >= 0 && value <= 3;

/**
 * Runtime config bindings using domain-neutral validators.
 *
 * DIP-Compliant: Uses SettingValidators from domain layer instead of
 * Valibot schemas from infrastructure layer.
 */
export const runtimeConfigBindings = {
  [SETTING_KEYS.LOG_LEVEL]: {
    runtimeKey: "logLevel",
    validator: isLogLevel,
    normalize: (value: LogLevel) => value,
  } satisfies RuntimeConfigBinding<LogLevel, "logLevel">,
  [SETTING_KEYS.CACHE_ENABLED]: {
    runtimeKey: "enableCacheService",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableCacheService">,
  [SETTING_KEYS.CACHE_TTL_MS]: {
    runtimeKey: "cacheDefaultTtlMs",
    validator: SettingValidators.nonNegativeNumber,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "cacheDefaultTtlMs">,
  [SETTING_KEYS.CACHE_MAX_ENTRIES]: {
    runtimeKey: "cacheMaxEntries",
    validator: SettingValidators.nonNegativeInteger,
    normalize: (value: number) => (value > 0 ? value : undefined),
  } satisfies RuntimeConfigBinding<number, "cacheMaxEntries">,
  [SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED]: {
    runtimeKey: "enablePerformanceTracking",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enablePerformanceTracking">,
  [SETTING_KEYS.PERFORMANCE_SAMPLING_RATE]: {
    runtimeKey: "performanceSamplingRate",
    validator: SettingValidators.samplingRate,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "performanceSamplingRate">,
  [SETTING_KEYS.METRICS_PERSISTENCE_ENABLED]: {
    runtimeKey: "enableMetricsPersistence",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableMetricsPersistence">,
  [SETTING_KEYS.METRICS_PERSISTENCE_KEY]: {
    runtimeKey: "metricsPersistenceKey",
    validator: SettingValidators.nonEmptyString,
    normalize: (value: string) => value,
  } satisfies RuntimeConfigBinding<string, "metricsPersistenceKey">,
} as const;

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
    private readonly runtimeConfig: RuntimeConfigService,
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
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheEnabledSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheDefaultTtlSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_TTL_MS],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      cacheMaxEntriesSetting,
      runtimeConfigBindings[SETTING_KEYS.CACHE_MAX_ENTRIES],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      performanceTrackingSetting,
      runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      performanceSamplingSetting,
      runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_SAMPLING_RATE],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      metricsPersistenceEnabledSetting,
      runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
    this.registerDefinition(
      metricsPersistenceKeySetting,
      runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_KEY],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger,
      this.validator
    );
  }

  private attachRuntimeConfigBridge<TSchema, K extends RuntimeConfigKey>(
    config: ModuleSettingConfig<TSchema>,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>
  ): ModuleSettingConfig<TSchema> {
    const originalOnChange = config.onChange;
    return {
      ...config,
      onChange: (value: TSchema) => {
        const normalized = binding.normalize(value);
        runtimeConfig.setFromFoundry(binding.runtimeKey, normalized);
        originalOnChange?.(value);
      },
    };
  }

  private syncRuntimeConfigFromSettings<TSchema, K extends RuntimeConfigKey>(
    settings: PlatformSettingsRegistrationPort,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    notifications: PlatformNotificationPort,
    settingKey: string
  ): void {
    const currentValue = settings.getSettingValue(
      MODULE_METADATA.ID,
      settingKey,
      binding.validator
    );

    if (!currentValue.ok) {
      notifications.warn(`Failed to read initial value for ${settingKey}`, currentValue.error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    runtimeConfig.setFromFoundry(binding.runtimeKey, binding.normalize(currentValue.value));
  }

  private registerDefinition<TSchema, K extends RuntimeConfigKey>(
    definition: SettingDefinition<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K> | undefined,
    settings: PlatformSettingsRegistrationPort,
    runtimeConfig: RuntimeConfigService,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ): void {
    const config = definition.createConfig(i18n, logger, validator);
    const configWithRuntimeBridge = binding
      ? this.attachRuntimeConfigBridge(config, runtimeConfig, binding)
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
      this.syncRuntimeConfigFromSettings(
        settings,
        runtimeConfig,
        binding,
        notifications,
        definition.key
      );
    }
  }
}

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static dependencies = [
    platformSettingsRegistrationPortToken,
    runtimeConfigToken,
    platformNotificationPortToken,
    platformI18nPortToken,
    platformLoggingPortToken,
    platformValidationPortToken,
  ] as const;

  constructor(
    settings: PlatformSettingsRegistrationPort,
    runtimeConfig: RuntimeConfigService,
    notifications: PlatformNotificationPort,
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ) {
    super(settings, runtimeConfig, notifications, i18n, logger, validator);
  }
}
