import { MODULE_CONSTANTS } from "@/constants";
import { loggerToken, i18nFacadeToken, notificationCenterToken } from "@/tokens/tokenindex";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { SettingDefinition } from "@/core/settings/setting-definition.interface";
import type { LogLevel } from "@/config/environment";
import { logLevelSetting } from "@/core/settings/log-level-setting";

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

  // Array of setting definitions with their specific types preserved
  private settings: readonly SettingDefinition<LogLevel>[] =
    // Add new setting types here
    [
      logLevelSetting,
      // Add new settings here
    ];

  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * @param container - DI container with registered services
   */
  registerAll(container: ServiceContainer): void {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const i18nResult = container.resolveWithError(i18nFacadeToken);
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);

    if (!notificationCenterResult.ok) {
      console.error("Failed to resolve NotificationCenter for ModuleSettingsRegistrar", {
        error: notificationCenterResult.error,
      });
      return;
    }

    const notifications = notificationCenterResult.value;

    // Early return if any resolution failed
    /* c8 ignore start -- Defensive: Service resolution can only fail if container is not validated or services are not registered, which cannot happen in normal flow */
    if (!settingsResult.ok || !loggerResult.ok || !i18nResult.ok) {
      notifications.error(
        "DI resolution failed in ModuleSettingsRegistrar",
        {
          code: "DI_RESOLUTION_FAILED",
          message: "Required services for ModuleSettingsRegistrar are missing",
          details: {
            settingsResolved: settingsResult.ok,
            i18nResolved: i18nResult.ok,
            loggerResolved: loggerResult.ok,
          },
        },
        { channels: ["ConsoleChannel"] }
      );
      return;
    }
    /* c8 ignore stop */

    const foundrySettings = settingsResult.value;
    const logger = loggerResult.value;
    const i18n = i18nResult.value;

    // Register all settings
    for (const setting of this.settings) {
      const config = setting.createConfig(i18n, logger);
      const result = foundrySettings.register(MODULE_CONSTANTS.MODULE.ID, setting.key, config);

      if (!result.ok) {
        notifications.error(`Failed to register ${setting.key} setting`, result.error, {
          channels: ["ConsoleChannel"],
        });
      }
    }
  }
}

export class DIModuleSettingsRegistrar extends ModuleSettingsRegistrar {
  static override dependencies = [] as const;

  constructor() {
    super();
  }
}
