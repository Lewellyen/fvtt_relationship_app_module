import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type {
  SettingDefinition,
  SettingConfig as ModuleSettingConfig,
} from "@/application/settings/setting-definition.interface";
import type { LogLevel } from "@/framework/config/environment";
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
import {
  LOG_LEVEL_SCHEMA,
  BOOLEAN_FLAG_SCHEMA,
  NON_NEGATIVE_NUMBER_SCHEMA,
  NON_NEGATIVE_INTEGER_SCHEMA,
  SAMPLING_RATE_SCHEMA,
  NON_EMPTY_STRING_SCHEMA,
} from "@/infrastructure/adapters/foundry/validation/setting-schemas";
import type { BaseIssue } from "valibot";
import type { BaseSchema } from "valibot";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import {
  notificationCenterToken,
  loggerToken,
  i18nFacadeToken,
  runtimeConfigToken,
  platformSettingsPortToken,
} from "@/infrastructure/shared/tokens";

interface RuntimeConfigBinding<TSchema, K extends RuntimeConfigKey> {
  runtimeKey: K;
  schema: BaseSchema<unknown, TSchema, BaseIssue<unknown>>;
  normalize: (value: TSchema) => RuntimeConfigValues[K];
}

export const runtimeConfigBindings = {
  [MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]: {
    runtimeKey: "logLevel",
    schema: LOG_LEVEL_SCHEMA,
    normalize: (value: LogLevel) => value,
  } satisfies RuntimeConfigBinding<LogLevel, "logLevel">,
  [MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED]: {
    runtimeKey: "enableCacheService",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableCacheService">,
  [MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS]: {
    runtimeKey: "cacheDefaultTtlMs",
    schema: NON_NEGATIVE_NUMBER_SCHEMA,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "cacheDefaultTtlMs">,
  [MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES]: {
    runtimeKey: "cacheMaxEntries",
    schema: NON_NEGATIVE_INTEGER_SCHEMA,
    normalize: (value: number) => (value > 0 ? value : undefined),
  } satisfies RuntimeConfigBinding<number, "cacheMaxEntries">,
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED]: {
    runtimeKey: "enablePerformanceTracking",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enablePerformanceTracking">,
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE]: {
    runtimeKey: "performanceSamplingRate",
    schema: SAMPLING_RATE_SCHEMA,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "performanceSamplingRate">,
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED]: {
    runtimeKey: "enableMetricsPersistence",
    schema: BOOLEAN_FLAG_SCHEMA,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableMetricsPersistence">,
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY]: {
    runtimeKey: "metricsPersistenceKey",
    schema: NON_EMPTY_STRING_SCHEMA,
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
 */
export class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsPort,
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly notifications: NotificationCenter,
    private readonly i18n: I18nFacadeService,
    private readonly logger: Logger
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
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      cacheEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      cacheDefaultTtlSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      cacheMaxEntriesSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      performanceTrackingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      performanceSamplingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      metricsPersistenceEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
    );
    this.registerDefinition(
      metricsPersistenceKeySetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY],
      this.settings,
      this.runtimeConfig,
      this.notifications,
      this.i18n,
      this.logger
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
    settings: PlatformSettingsPort,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    notifications: NotificationCenter,
    settingKey: string
  ): void {
    const currentValue = settings.get(MODULE_CONSTANTS.MODULE.ID, settingKey, binding.schema);

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
    settings: PlatformSettingsPort,
    runtimeConfig: RuntimeConfigService,
    notifications: NotificationCenter,
    i18n: I18nFacadeService,
    logger: Logger
  ): void {
    const config = definition.createConfig(i18n, logger);
    const configWithRuntimeBridge = binding
      ? this.attachRuntimeConfigBridge(config, runtimeConfig, binding)
      : config;

    const result = settings.register(
      MODULE_CONSTANTS.MODULE.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      // Convert SettingsError to NotificationCenter's error format
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
    platformSettingsPortToken,
    runtimeConfigToken,
    notificationCenterToken,
    i18nFacadeToken,
    loggerToken,
  ] as const;

  constructor(
    settings: PlatformSettingsPort,
    runtimeConfig: RuntimeConfigService,
    notifications: NotificationCenter,
    i18n: I18nFacadeService,
    logger: Logger
  ) {
    super(settings, runtimeConfig, notifications, i18n, logger);
  }
}
