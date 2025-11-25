import type { Result } from "@/domain/types/result";
import type {
  DomainSettingConfig,
  DomainSettingsError,
  SettingValidator,
} from "@/domain/types/settings";

/**
 * Port for settings registration and access.
 *
 * Abstraction that allows the domain to work with settings
 * without knowing about the underlying platform (Foundry) or
 * validation library (Valibot).
 *
 * This port differs from PlatformSettingsPort in that it:
 * 1. Uses domain-neutral types (DomainSettingConfig, SettingValidator)
 * 2. Does not expose Valibot schemas in its interface
 * 3. Handles validation internally in the adapter
 *
 * Platform mappings:
 * - Foundry: game.settings.register/get/set with Valibot validation
 * - Roll20: state object with JSON schema validation
 * - Fantasy Grounds: DB operations with type checking
 *
 * @example
 * ```typescript
 * // Register setting
 * const result = port.registerSetting("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   config: true,
 *   type: Boolean,
 *   default: true,
 * });
 *
 * // Get setting with validator
 * const value = port.getSettingValue(
 *   "my-module",
 *   "enabled",
 *   (v): v is boolean => typeof v === "boolean"
 * );
 * ```
 */
export interface SettingsRegistrationPort {
  /**
   * Registers a new module setting.
   *
   * Must be called during 'init' hook or earlier on most platforms.
   *
   * @param namespace - Module ID
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration (domain-neutral)
   * @returns Result indicating success or error
   */
  registerSetting<T>(
    namespace: string,
    key: string,
    config: DomainSettingConfig<T>
  ): Result<void, DomainSettingsError>;

  /**
   * Gets the current value of a setting.
   *
   * Uses a validator function to ensure type safety without
   * exposing validation library details.
   *
   * @param namespace - Module ID
   * @param key - Setting key
   * @param validator - Type guard function to validate the value
   * @returns Result with setting value or error
   */
  getSettingValue<T>(
    namespace: string,
    key: string,
    validator: SettingValidator<T>
  ): Result<T, DomainSettingsError>;

  /**
   * Sets the value of a setting.
   *
   * Updates are persisted and trigger onChange callbacks.
   *
   * @param namespace - Module ID
   * @param key - Setting key
   * @param value - New value
   * @returns Async Result indicating success or error
   */
  setSettingValue<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, DomainSettingsError>>;
}
