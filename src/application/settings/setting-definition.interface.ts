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
 *
 * @see ModuleSettingsRegistrar for usage
 */

import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { LoggingPort } from "@/domain/ports/logging-port.interface";

/**
 * Configuration for a Foundry setting.
 * Matches Foundry's game.settings.register() options.
 */
export interface SettingConfig<T> {
  name: string;
  hint: string;
  scope: "client" | "world";
  config: boolean;
  type: NumberConstructor | StringConstructor | BooleanConstructor;
  choices?: Record<number | string, string>;
  default: T;
  onChange?: (value: T) => void;
}

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
   * @param i18n - I18n facade for translating strings
   * @param logger - Logger for the onChange callback
   * @returns Complete setting configuration
   */
  createConfig(i18n: PlatformI18nPort, logger: LoggingPort): SettingConfig<T>;
}
