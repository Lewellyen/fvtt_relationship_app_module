import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { SettingConfig as ModuleSettingConfig } from "@/application/settings/setting-definition.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { SettingValidator } from "@/domain/types/setting-validator";
import { SettingValidators } from "@/domain/utils/setting-validators";
import type { LogLevel } from "@/domain/types/log-level";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";
import { getNotificationQueueConstants } from "@/application/settings/notification-queue-max-size-setting";

/**
 * Binding configuration for syncing a setting with RuntimeConfig.
 *
 * Uses domain-neutral SettingValidator instead of Valibot schemas.
 */
export interface RuntimeConfigBinding<TSchema, K extends RuntimeConfigKey> {
  runtimeKey: K;
  validator: SettingValidator<TSchema>;
  normalize: (value: TSchema) => RuntimeConfigValues[K];
}

/**
 * RuntimeConfigSync
 *
 * Handles synchronization between Foundry Settings and RuntimeConfigService.
 * Separated from ModuleSettingsRegistrar to follow Single Responsibility Principle.
 *
 * **Responsibilities:**
 * - Bind RuntimeConfig synchronization to Setting onChange callbacks
 * - Synchronize initial Setting values to RuntimeConfig on registration
 *
 * **Design Benefits:**
 * - Single Responsibility: Only handles RuntimeConfig synchronization
 * - Reusable: Can be used for any Setting-to-RuntimeConfig binding
 * - Testable: Isolated from Settings registration logic
 */
export class RuntimeConfigSync {
  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Bindet RuntimeConfig-Synchronisation an ein Setting.
   *
   * Wraps the original onChange callback and adds RuntimeConfig synchronization.
   *
   * @param config - The Setting configuration
   * @param binding - Binding configuration for RuntimeConfig sync
   * @returns Modified config with RuntimeConfig bridge attached
   */
  attachBinding<TSchema, K extends RuntimeConfigKey>(
    config: ModuleSettingConfig<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K>
  ): ModuleSettingConfig<TSchema> {
    const originalOnChange = config.onChange;
    return {
      ...config,
      onChange: (value: TSchema) => {
        const normalized = binding.normalize(value);
        this.runtimeConfig.setFromPlatform(binding.runtimeKey, normalized);
        originalOnChange?.(value);
      },
    };
  }

  /**
   * Synchronisiert initialen Setting-Wert zu RuntimeConfig.
   *
   * Reads the current Setting value and updates RuntimeConfig accordingly.
   *
   * @param settings - Settings port for reading values
   * @param binding - Binding configuration for RuntimeConfig sync
   * @param settingKey - The Setting key to read
   */
  syncInitialValue<TSchema, K extends RuntimeConfigKey>(
    settings: PlatformSettingsRegistrationPort,
    binding: RuntimeConfigBinding<TSchema, K>,
    settingKey: string
  ): void {
    const currentValue = settings.getSettingValue(
      MODULE_METADATA.ID,
      settingKey,
      binding.validator
    );

    if (!currentValue.ok) {
      this.notifications.warn(
        `Failed to read initial value for ${settingKey}`,
        currentValue.error,
        {
          channels: ["ConsoleChannel"],
        }
      );
      return;
    }

    this.runtimeConfig.setFromPlatform(binding.runtimeKey, binding.normalize(currentValue.value));
  }
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
  [SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE]: {
    runtimeKey: "notificationQueueMaxSize",
    validator: SettingValidators.positiveInteger,
    normalize: (value: number) => {
      const constants = getNotificationQueueConstants();
      return Math.max(constants.minSize, Math.min(constants.maxSize, Math.floor(value)));
    },
  } satisfies RuntimeConfigBinding<number, "notificationQueueMaxSize">,
} as const;

/**
 * DI wrapper for RuntimeConfigSync.
 */
export class DIRuntimeConfigSync extends RuntimeConfigSync {
  static dependencies = [runtimeConfigToken, notificationPublisherPortToken] as const;

  constructor(runtimeConfig: PlatformRuntimeConfigPort, notifications: NotificationPublisherPort) {
    super(runtimeConfig, notifications);
  }
}
