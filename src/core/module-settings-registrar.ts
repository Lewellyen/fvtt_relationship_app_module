import { MODULE_CONSTANTS } from "@/constants";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type {
  SettingDefinition,
  SettingConfig as ModuleSettingConfig,
} from "@/core/settings/setting-definition.interface";
import type { LogLevel } from "@/config/environment";
import { logLevelSetting } from "@/core/settings/log-level-setting";
import { cacheEnabledSetting } from "@/core/settings/cache-enabled-setting";
import { cacheDefaultTtlSetting } from "@/core/settings/cache-default-ttl-setting";
import { cacheMaxEntriesSetting } from "@/core/settings/cache-max-entries-setting";
import { performanceTrackingSetting } from "@/core/settings/performance-tracking-setting";
import { performanceSamplingSetting } from "@/core/settings/performance-sampling-setting";
import { metricsPersistenceEnabledSetting } from "@/core/settings/metrics-persistence-enabled-setting";
import { metricsPersistenceKeySetting } from "@/core/settings/metrics-persistence-key-setting";
import type {
  RuntimeConfigService,
  RuntimeConfigKey,
  RuntimeConfigValues,
} from "@/core/runtime-config/runtime-config.service";
import {
  LOG_LEVEL_SCHEMA,
  BOOLEAN_FLAG_SCHEMA,
  NON_NEGATIVE_NUMBER_SCHEMA,
  NON_NEGATIVE_INTEGER_SCHEMA,
  SAMPLING_RATE_SCHEMA,
  NON_EMPTY_STRING_SCHEMA,
} from "@/foundry/validation/setting-schemas";
import type { BaseIssue } from "valibot";
import type { BaseSchema } from "valibot";
import type { FoundrySettings } from "@/foundry/interfaces/FoundrySettings";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { Logger } from "@/interfaces/logger";
import { ModuleSettingsContextResolver } from "@/core/settings/module-settings-context-resolver";

interface RuntimeConfigBinding<TSchema, K extends RuntimeConfigKey> {
  runtimeKey: K;
  schema: BaseSchema<unknown, TSchema, BaseIssue<unknown>>;
  normalize: (value: TSchema) => RuntimeConfigValues[K];
}

const runtimeConfigBindings = {
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
 */
export class ModuleSettingsRegistrar {
  static dependencies = [] as const;
  private readonly contextResolver = new ModuleSettingsContextResolver();

  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * @param container - DI container with registered services
   */
  registerAll(container: ServiceContainer): void {
    const context = this.contextResolver.resolve(container);
    if (!context) {
      return;
    }

    const { foundrySettings, runtimeConfig, notifications, i18n, logger } = context;

    // Register all settings
    this.registerDefinition(
      logLevelSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheDefaultTtlSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      cacheMaxEntriesSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      performanceTrackingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      performanceSamplingSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      metricsPersistenceEnabledSetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
    );
    this.registerDefinition(
      metricsPersistenceKeySetting,
      runtimeConfigBindings[MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY],
      foundrySettings,
      runtimeConfig,
      notifications,
      i18n,
      logger
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
    foundrySettings: FoundrySettings,
    runtimeConfig: RuntimeConfigService,
    binding: RuntimeConfigBinding<TSchema, K>,
    notifications: NotificationCenter,
    settingKey: string
  ): void {
    const currentValue = foundrySettings.get(
      MODULE_CONSTANTS.MODULE.ID,
      settingKey,
      binding.schema
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
    binding: RuntimeConfigBinding<TSchema, K>,
    foundrySettings: FoundrySettings,
    runtimeConfig: RuntimeConfigService,
    notifications: NotificationCenter,
    i18n: I18nFacadeService,
    logger: Logger
  ): void {
    const config = definition.createConfig(i18n, logger);
    const configWithRuntimeBridge = this.attachRuntimeConfigBridge(config, runtimeConfig, binding);

    const result = foundrySettings.register(
      MODULE_CONSTANTS.MODULE.ID,
      definition.key,
      configWithRuntimeBridge
    );

    if (!result.ok) {
      notifications.error(`Failed to register ${definition.key} setting`, result.error, {
        channels: ["ConsoleChannel"],
      });
      return;
    }

    if (binding) {
      this.syncRuntimeConfigFromSettings(
        foundrySettings,
        runtimeConfig,
        binding,
        notifications,
        definition.key
      );
    }
  }
}

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
