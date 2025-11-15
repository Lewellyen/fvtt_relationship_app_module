import { MODULE_CONSTANTS } from "@/constants";
import type { SettingDefinition } from "./setting-definition.interface";

/**
 * Foundry setting that toggles the CacheService globally.
 */
export const cacheEnabledSetting: SettingDefinition<boolean> = {
  key: MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED,

  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.cacheEnabled.name", "Enable Cache Service"),
      hint: i18n.translate(
        "MODULE.SETTINGS.cacheEnabled.hint",
        "Toggle the global CacheService. When disabled, all cache interactions bypass the cache layer."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
      onChange: (value: boolean) => {
        const action = value ? "enabled" : "disabled";
        logger.info(`CacheService ${action} via module setting.`);
      },
    };
  },
};
