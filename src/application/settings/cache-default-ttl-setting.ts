import { SETTING_KEYS, APP_DEFAULTS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting for configuring the default cache TTL (in milliseconds).
 */
export const cacheDefaultTtlSetting: SettingDefinition<number> = {
  key: SETTING_KEYS.CACHE_TTL_MS,

  createConfig(i18n, logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.cacheDefaultTtlMs.name", "Cache TTL (ms)"),
        "Cache TTL (ms)"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.cacheDefaultTtlMs.hint",
          "Default lifetime for cache entries in milliseconds. Use 0 to disable TTL (entries live until invalidated)."
        ),
        "Default lifetime for cache entries in milliseconds. Use 0 to disable TTL (entries live until invalidated)."
      ),
      scope: "world",
      config: true,
      type: "number",
      default: APP_DEFAULTS.CACHE_TTL_MS,
      onChange: (value: number) => {
        const numericValue = Number(value);
        const sanitized = Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
        logger.info(`Cache TTL updated via settings: ${sanitized}ms`);
      },
    };
  },
};
