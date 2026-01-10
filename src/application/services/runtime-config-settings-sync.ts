import type { RuntimeConfigKey } from "@/domain/types/runtime-config";
import type { DomainSettingConfig } from "@/domain/types/settings";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import {
  RuntimeConfigSync,
  type RuntimeConfigBinding,
} from "@/application/services/RuntimeConfigSync";
import { runtimeConfigSyncToken } from "@/application/tokens/application.tokens";

/**
 * Interface for RuntimeConfig settings synchronization.
 *
 * Encapsulates the responsibility of synchronizing Foundry Settings with RuntimeConfig.
 * Separated from ModuleSettingsRegistrar to follow Single Responsibility Principle.
 */
export interface IRuntimeConfigSettingsSync {
  /**
   * Attaches RuntimeConfig synchronization binding to a setting configuration.
   *
   * @param config - The Setting configuration (platform-agnostic DomainSettingConfig)
   * @param binding - Binding configuration for RuntimeConfig sync
   * @returns Modified config with RuntimeConfig bridge attached
   */
  attachBinding<TSchema, K extends RuntimeConfigKey>(
    config: DomainSettingConfig<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K>
  ): DomainSettingConfig<TSchema>;

  /**
   * Synchronizes initial Setting value to RuntimeConfig.
   *
   * @param settings - Settings port for reading values
   * @param binding - Binding configuration for RuntimeConfig sync
   * @param settingKey - The Setting key to read
   */
  syncInitialValue<TSchema, K extends RuntimeConfigKey>(
    settings: PlatformSettingsRegistrationPort,
    binding: RuntimeConfigBinding<TSchema, K>,
    settingKey: string
  ): void;
}

/**
 * RuntimeConfigSettingsSync
 *
 * Handles synchronization between Foundry Settings and RuntimeConfigService.
 * This class encapsulates the synchronization responsibility, delegating to RuntimeConfigSync
 * for the actual implementation.
 *
 * **Responsibilities:**
 * - Bind RuntimeConfig synchronization to Setting onChange callbacks
 * - Synchronize initial Setting values to RuntimeConfig on registration
 *
 * **Design Benefits:**
 * - Single Responsibility: Only handles RuntimeConfig synchronization for Settings
 * - Separation of Concerns: Settings registration is separate from synchronization
 * - Delegation: Uses RuntimeConfigSync for actual implementation
 * - Testable: Isolated from Settings registration logic
 */
export class RuntimeConfigSettingsSync implements IRuntimeConfigSettingsSync {
  constructor(private readonly runtimeConfigSync: RuntimeConfigSync) {}

  /**
   * Attaches RuntimeConfig synchronization binding to a setting configuration.
   *
   * Delegates to RuntimeConfigSync.attachBinding().
   *
   * @param config - The Setting configuration (platform-agnostic DomainSettingConfig)
   * @param binding - Binding configuration for RuntimeConfig sync
   * @returns Modified config with RuntimeConfig bridge attached
   */
  attachBinding<TSchema, K extends RuntimeConfigKey>(
    config: DomainSettingConfig<TSchema>,
    binding: RuntimeConfigBinding<TSchema, K>
  ): DomainSettingConfig<TSchema> {
    return this.runtimeConfigSync.attachBinding(config, binding);
  }

  /**
   * Synchronizes initial Setting value to RuntimeConfig.
   *
   * Delegates to RuntimeConfigSync.syncInitialValue().
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
    this.runtimeConfigSync.syncInitialValue(settings, binding, settingKey);
  }
}

/**
 * DI wrapper for RuntimeConfigSettingsSync.
 * Injects dependencies via constructor.
 */
export class DIRuntimeConfigSettingsSync extends RuntimeConfigSettingsSync {
  static dependencies = [runtimeConfigSyncToken] as const;

  constructor(runtimeConfigSync: RuntimeConfigSync) {
    super(runtimeConfigSync);
  }
}
