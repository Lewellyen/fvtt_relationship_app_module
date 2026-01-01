import { MODULE_METADATA } from "@/application/constants/app-constants";
import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { SettingConfig as ModuleSettingConfig } from "@/application/settings/setting-definition.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { SettingValidator } from "@/domain/types/setting-validator";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

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
 * DI wrapper for RuntimeConfigSync.
 */
export class DIRuntimeConfigSync extends RuntimeConfigSync {
  static dependencies = [runtimeConfigToken, notificationPublisherPortToken] as const;

  constructor(runtimeConfig: PlatformRuntimeConfigPort, notifications: NotificationPublisherPort) {
    super(runtimeConfig, notifications);
  }
}
