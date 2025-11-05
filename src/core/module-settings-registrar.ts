import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";
import { loggerToken } from "@/tokens/tokenindex";
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

    // Early return if any resolution failed
    if (!settingsResult.ok || !loggerResult.ok) {
      console.error("Failed to resolve required services for settings registration");
      return;
    }

    const settings = settingsResult.value;
    const logger = loggerResult.value;

    // Register log level setting
    const result = settings.register(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      {
        name: "Log Level",
        hint: "Mindest-Log-Level für Modul-Ausgaben. DEBUG zeigt alle Logs, ERROR nur kritische Fehler.",
        scope: "world",
        config: true,
        type: Number,
        choices: {
          [LogLevel.DEBUG]: "DEBUG (Alle Logs - für Debugging)",
          [LogLevel.INFO]: "INFO (Standard)",
          [LogLevel.WARN]: "WARN (Nur Warnungen und Fehler)",
          [LogLevel.ERROR]: "ERROR (Nur kritische Fehler)",
        },
        default: LogLevel.INFO,
        onChange: (value: number) => {
          // Logger dynamisch neu konfigurieren wenn Setting geändert wird
          if (logger.setMinLevel) {
            logger.setMinLevel(value as LogLevel);
            logger.info(`Log-Level geändert zu: ${LogLevel[value]}`);
          }
        },
      }
    );

    if (!result.ok) {
      logger.error("Failed to register log level setting", result.error);
    }
  }
}
