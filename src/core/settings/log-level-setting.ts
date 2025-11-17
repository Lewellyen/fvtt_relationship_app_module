/**
 * Log level setting definition.
 *
 * Configures the minimum log level for the module's console output.
 */

import type { SettingDefinition } from "./setting-definition.interface";
import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { Logger } from "@/interfaces/logger";
import { validateAndSetLogLevel } from "@/utils/settings/validate-log-level";
import { unwrapOr } from "@/utils/functional/result";

/**
 * Log level setting definition.
 *
 * Provides dropdown with DEBUG/INFO/WARN/ERROR options.
 * OnChange handler dynamically reconfigures the logger.
 */
export const logLevelSetting: SettingDefinition<LogLevel> = {
  key: MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,

  createConfig(i18n: I18nFacadeService, logger: Logger) {
    return {
      name: unwrapOr(i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level"), "Log Level"),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.logLevel.hint",
          "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
        ),
        "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
      ),
      scope: "world",
      config: true,
      type: Number,
      choices: {
        [LogLevel.DEBUG]: unwrapOr(
          i18n.translate(
            "MODULE.SETTINGS.logLevel.choices.debug",
            "DEBUG (All logs - for debugging)"
          ),
          "DEBUG (All logs - for debugging)"
        ),
        [LogLevel.INFO]: unwrapOr(
          i18n.translate("MODULE.SETTINGS.logLevel.choices.info", "INFO (Standard)"),
          "INFO (Standard)"
        ),
        [LogLevel.WARN]: unwrapOr(
          i18n.translate(
            "MODULE.SETTINGS.logLevel.choices.warn",
            "WARN (Warnings and errors only)"
          ),
          "WARN (Warnings and errors only)"
        ),
        [LogLevel.ERROR]: unwrapOr(
          i18n.translate("MODULE.SETTINGS.logLevel.choices.error", "ERROR (Critical errors only)"),
          "ERROR (Critical errors only)"
        ),
      },
      default: LogLevel.INFO,
      onChange: (value: number) => {
        validateAndSetLogLevel(value, logger);
      },
    };
  },
};
