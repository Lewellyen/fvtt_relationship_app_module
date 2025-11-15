import { MODULE_CONSTANTS } from "@/constants";
import type { SettingDefinition } from "./setting-definition.interface";

/**
 * Foundry setting to toggle metrics persistence between sessions.
 */
export const metricsPersistenceEnabledSetting: SettingDefinition<boolean> = {
  key: MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED,

  createConfig(i18n, logger) {
    return {
      name: i18n.translate("MODULE.SETTINGS.metricsPersistenceEnabled.name", "Persist Metrics"),
      hint: i18n.translate(
        "MODULE.SETTINGS.metricsPersistenceEnabled.hint",
        "Keeps observability metrics across Foundry restarts (uses LocalStorage)."
      ),
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
      onChange: (value: boolean) => {
        const action = value ? "enabled" : "disabled";
        logger.info(`Metrics persistence ${action} via module setting.`);
      },
    };
  },
};
