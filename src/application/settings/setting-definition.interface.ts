/**
 * Interface for setting definitions.
 *
 * Implements Strategy Pattern for extensible settings registration.
 * Each setting gets its own definition object.
 *
 * **Design Rationale:**
 * - Single Responsibility: Each setting definition is separate
 * - Open/Closed: Easy to add new settings without modifying ModuleSettingsRegistrar
 * - Testability: Each setting can be tested in isolation
 * - Dependency Inversion: Uses domain-agnostic DomainSettingConfig instead of platform-specific types
 *
 * @see ModuleSettingsRegistrar for usage
 */

import type { DomainSettingConfig } from "@/domain/types/settings";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";

/**
 * Definition for a module setting.
 *
 * @template T - The setting value type
 *
 * @example
 * ```typescript
 * export const mySettingDefinition: SettingDefinition<boolean> = {
 *   key: 'cacheEnabled',
 *   createConfig(i18n, logger) {
 *     return {
 *       name: i18n.translate('setting.name', 'Enable Feature'),
 *       scope: "world",
 *       config: true,
 *       type: "boolean",
 *       default: true,
 *       // ... other config
 *     };
 *   }
 * };
 * ```
 */
export interface SettingDefinition<T> {
  /**
   * The setting key (unique identifier).
   */
  key: string;

  /**
   * Creates the setting configuration.
   *
   * This method is called during settings registration to build
   * the configuration object with localized strings.
   *
   * Returns a platform-agnostic DomainSettingConfig that will be
   * mapped to platform-specific types by the infrastructure layer.
   *
   * @param i18n - I18n facade for translating strings
   * @param logger - Logger for the onChange callback
   * @param validator - Validation port for validating setting values
   * @returns Platform-agnostic setting configuration
   */
  createConfig(
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ): DomainSettingConfig<T>;
}
