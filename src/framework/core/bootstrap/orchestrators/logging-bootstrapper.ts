import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { LogLevel, LOG_LEVEL_SCHEMA } from "@/domain/types/log-level";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

/**
 * Orchestrator for configuring logger during bootstrap.
 *
 * Responsibilities:
 * - Resolve FoundrySettings
 * - Read log level setting
 * - Configure logger with user setting
 */
export class LoggingBootstrapper {
  /**
   * Configures logger with current setting value.
   *
   * @param container - ContainerPort for service resolution
   * @param logger - Logger instance to configure
   * @returns Result indicating success (always succeeds, settings are optional)
   */
  static configureLogging(container: ContainerPort, logger: Logger): Result<void, string> {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    if (!settingsResult.ok) {
      // Settings are optional - return success
      return ok(undefined);
    }

    const settings = settingsResult.value as FoundrySettings;
    const logLevelResult = settings.get(
      MODULE_CONSTANTS.MODULE.ID,
      MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
      LOG_LEVEL_SCHEMA
    );

    if (logLevelResult.ok && logger.setMinLevel) {
      logger.setMinLevel(logLevelResult.value);
      logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }

    return ok(undefined);
  }
}
