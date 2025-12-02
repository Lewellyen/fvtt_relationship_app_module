import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting that toggles the CacheService globally.
 */
export const cacheEnabledSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.CACHE_ENABLED,

  createConfig(i18n, logger) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheEnabled.name", "Enable Cache Service"),
        "Enable Cache Service"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheEnabled.hint",
          "Toggle the global CacheService. When disabled, all cache interactions bypass the cache layer."
        ),
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
