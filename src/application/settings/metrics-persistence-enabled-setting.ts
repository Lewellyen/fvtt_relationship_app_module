import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting to toggle metrics persistence between sessions.
 */
export const metricsPersistenceEnabledSetting: SettingDefinition<boolean> = {
  key: SETTING_KEYS.METRICS_PERSISTENCE_ENABLED,

  createConfig(i18n, logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.metricsPersistenceEnabled.name", "Persist Metrics"),
        "Persist Metrics"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.metricsPersistenceEnabled.hint",
          "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
        ),
        "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
      ),
      scope: "world",
      config: true,
      type: "boolean",
      default: false,
      onChange: (value: boolean) => {
        const action = value ? "enabled" : "disabled";
        logger.info(`Metrics persistence ${action} via module setting.`);
      },
    };
  },
};
