import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";
import { loggerToken, i18nFacadeToken } from "@/tokens/tokenindex";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import type { ServiceContainer } from "@/di_infrastructure/container";

/**
 * ModuleSettingsRegistrar
 *
 * Registers all Foundry module settings during the init hook.
 * Provides onChange handlers for reactive setting updates.
 */
export class ModuleSettingsRegistrar {
  /**
   * Registers all module settings.
   * Must be called during or after the 'init' hook.
   *
   * @param container DI-Container with registered services
   */
  registerAll(container: ServiceContainer): void {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    const loggerResult = container.resolveWithError(loggerToken);
    const i18nResult = container.resolveWithError(i18nFacadeToken);

    // Early return if any resolution failed
    /* c8 ignore next 4 -- Defensive: Service resolution can only fail if container is not validated or services are not registered, which cannot happen in normal flow */
    if (!settingsResult.ok || !loggerResult.ok || !i18nResult.ok) {
      console.error("Failed to resolve required services for settings registration");
      return;
    }

    const settings = settingsResult.value;
    const logger = loggerResult.value;
    const i18n = i18nResult.value;

    // Register log level setting
    const result = settings.register(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      {
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
          [LogLevel.INFO]: i18n.translate(
            "MODULE.SETTINGS.logLevel.choices.info",
            "INFO (Standard)"
          ),
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
          // Dynamically reconfigure logger when setting changes
          if (logger.setMinLevel) {
            logger.setMinLevel(value as LogLevel);
            logger.info(`Log level changed to: ${LogLevel[value]}`);
          }
        },
      }
    );

    if (!result.ok) {
      logger.error("Failed to register log level setting", result.error);
    }
  }
}
