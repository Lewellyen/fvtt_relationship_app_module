import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting for configuring the optional CacheService max entries (LRU limit).
 */
export const cacheMaxEntriesSetting: SettingDefinition<number> = {
  key: SETTING_KEYS.CACHE_MAX_ENTRIES,

  createConfig(i18n, logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheMaxEntries.name", "Cache Max Entries"),
        "Cache Max Entries"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheMaxEntries.hint",
          "Optional LRU limit. Use 0 to allow unlimited cache entries."
        ),
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
