/**
 * Log level setting definition.
 *
 * Configures the minimum log level for the module's console output.
 */

import type { SettingDefinition } from "./setting-definition.interface";
import { SETTING_KEYS } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { validateAndSetLogLevel } from "@/application/utils/validate-log-level";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Log level setting definition.
 *
 * Provides dropdown with DEBUG/INFO/WARN/ERROR options.
 * OnChange handler dynamically reconfigures the logger.
 */
export const logLevelSetting: SettingDefinition<LogLevel> = {
  key: SETTING_KEYS.LOG_LEVEL,

  createConfig(
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    validator: PlatformValidationPort
  ) {
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
        validateAndSetLogLevel(value, logger, validator);
      },
    };
  },
};
