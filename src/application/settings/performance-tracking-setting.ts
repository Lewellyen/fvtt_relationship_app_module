import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting to toggle performance tracking at runtime.
 */
export const performanceTrackingSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED,

  createConfig(i18n, logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.performanceTracking.name", "Performance Tracking"),
        "Performance Tracking"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.performanceTracking.hint",
          "Enables internal performance instrumentation (requires sampling)."
        ),
        "Enables internal performance instrumentation (requires sampling)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: (value: boolean) => {
        const action = value ? "enabled" : "disabled";
        logger.info(`Performance tracking ${action} via module setting.`);
      },
    };
  },
};
