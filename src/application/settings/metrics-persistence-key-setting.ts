import { SETTING_KEYS, MODULE_METADATA } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Foundry setting to configure the LocalStorage key for persisted metrics.
 */
export const metricsPersistenceKeySetting: SettingDefinition<string> = {
  key: SETTING_KEYS.METRICS_PERSISTENCE_KEY,

  createConfig(i18n, logger, _validator: PlatformValidationPort) {
    return {
      name: unwrapOr(
        i18n.translate("MODULE.SETTINGS.metricsPersistenceKey.name", "Metrics Storage Key"),
        "Metrics Storage Key"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.metricsPersistenceKey.hint",
          "LocalStorage key used when metrics persistence is enabled."
        ),
        "LocalStorage key used when metrics persistence is enabled."
      ),
      scope: "world",
      config: true,
      type: String,
      default: `${MODULE_METADATA.ID}.metrics`,
      onChange: (value: string) => {
        logger.info(`Metrics persistence key set to: ${value || "(empty)"}`);
      },
    };
  },
};
