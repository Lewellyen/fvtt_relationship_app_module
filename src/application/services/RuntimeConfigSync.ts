import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import type {
  RuntimeConfigService,
  RuntimeConfigKey,
  RuntimeConfigValues,
} from "@/application/services/RuntimeConfigService";
import type { SettingConfig as ModuleSettingConfig } from "@/application/settings/setting-definition.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { SettingValidator } from "@/domain/types/settings";
import { SettingValidators } from "@/domain/types/settings";
import type { LogLevel } from "@/domain/types/log-level";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import { platformNotificationPortToken } from "@/application/tokens/domain-ports.tokens";

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
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly notifications: PlatformNotificationPort
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
        this.runtimeConfig.setFromFoundry(binding.runtimeKey, normalized);
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

    this.runtimeConfig.setFromFoundry(binding.runtimeKey, binding.normalize(currentValue.value));
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
} as const;

/**
 * DI wrapper for RuntimeConfigSync.
 */
export class DIRuntimeConfigSync extends RuntimeConfigSync {
  static dependencies = [runtimeConfigToken, platformNotificationPortToken] as const;

  constructor(runtimeConfig: RuntimeConfigService, notifications: PlatformNotificationPort) {
    super(runtimeConfig, notifications);
  }
}
