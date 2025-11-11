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
import { LOG_LEVEL_SCHEMA } from "@/foundry/validation/setting-schemas";
import * as v from "valibot";

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
      name: i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level"),
      hint: i18n.translate(
        "MODULE.SETTINGS.logLevel.hint",
        "Minimum log level for module output. DEBUG shows all logs, ERROR only critical errors."
      ),
      scope: "world",
      config: true,
      type: Number,
      choices: {
        [LogLevel.DEBUG]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.debug",
          "DEBUG (All logs - for debugging)"
        ),
        [LogLevel.INFO]: i18n.translate("MODULE.SETTINGS.logLevel.choices.info", "INFO (Standard)"),
        [LogLevel.WARN]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.warn",
          "WARN (Warnings and errors only)"
        ),
        [LogLevel.ERROR]: i18n.translate(
          "MODULE.SETTINGS.logLevel.choices.error",
          "ERROR (Critical errors only)"
        ),
      },
      default: LogLevel.INFO,
      onChange: (value: number) => {
        // Validate value before using it (security!)
        const validationResult = v.safeParse(LOG_LEVEL_SCHEMA, value);

        /* c8 ignore start -- onChange callback: Defensive validation for external input, difficult to test in isolation as it requires Foundry settings system */
        if (!validationResult.success) {
          logger.warn(`Invalid log level value received: ${value}, using default INFO`);
          if (logger.setMinLevel) {
            logger.setMinLevel(LogLevel.INFO);
          }
          return;
        }
        /* c8 ignore stop */

        // Dynamically reconfigure logger when setting changes
        if (logger.setMinLevel) {
          logger.setMinLevel(validationResult.output);
          logger.info(`Log level changed to: ${LogLevel[validationResult.output]}`);
        }
      },
    };
  },
};
