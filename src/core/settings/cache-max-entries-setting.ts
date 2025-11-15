import { MODULE_CONSTANTS } from "@/constants";
import type { SettingDefinition } from "./setting-definition.interface";

/**
 * Foundry setting for configuring the optional CacheService max entries (LRU limit).
 */
export const cacheMaxEntriesSetting: SettingDefinition<number> = {
  key: MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES,

  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.cacheMaxEntries.name", "Cache Max Entries"),
      hint: i18n.translate(
        "MODULE.SETTINGS.cacheMaxEntries.hint",
        "Optional LRU limit. Use 0 to allow unlimited cache entries."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 0,
      onChange: (value: number) => {
        const numericValue = Number(value);
        const sanitized =
          Number.isFinite(numericValue) && numericValue > 0 ? Math.floor(numericValue) : 0;
        if (sanitized === 0) {
          logger.info("Cache max entries reset to unlimited via settings.");
        } else {
          logger.info(`Cache max entries updated via settings: ${sanitized}`);
        }
      },
    };
  },
};
