import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type { SettingDefinition } from "./setting-definition.interface";
import { unwrapOr } from "@/infrastructure/shared/utils/result";

/**
 * Foundry setting to adjust performance sampling rate (0.0 - 1.0).
 */
export const performanceSamplingSetting: SettingDefinition<number> = {
  key: MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE,

  createConfig(i18n, logger) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.performanceSamplingRate.name", "Performance Sampling Rate"),
        "Performance Sampling Rate"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.performanceSamplingRate.hint",
          "Fraction of operations to instrument (0 = 0%, 1 = 100%)."
        ),
        "Fraction of operations to instrument (0 = 0%, 1 = 100%)."
      ),
      scope: "world",
      config: true,
      type: Number,
      default: 1,
      onChange: (value: number) => {
        const clamped = Math.max(0, Math.min(1, Number(value) || 0));
        logger.info(
          `Performance sampling rate updated via settings: ${(clamped * 100).toFixed(1)}%`
        );
      },
    };
  },
};
