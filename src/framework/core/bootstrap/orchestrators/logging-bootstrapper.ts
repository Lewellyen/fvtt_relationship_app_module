import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";

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
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger instance to configure
   * @returns Result indicating success (always succeeds, settings are optional)
   */
  static configureLogging(
    container: PlatformContainerPort,
    logger: PlatformLoggingPort
  ): Result<void, string> {
    const settingsResult = container.resolveWithError<PlatformSettingsRegistrationPort>(
      platformSettingsRegistrationPortToken
    );
    if (!settingsResult.ok) {
      // Settings are optional - return success
      return ok(undefined);
    }

    const settings = settingsResult.value;
    const logLevelResult = settings.getSettingValue(
      MODULE_METADATA.ID,
      SETTING_KEYS.LOG_LEVEL,
      (v: unknown): v is LogLevel => typeof v === "number"
    );

    if (logLevelResult.ok && logger.setMinLevel) {
      logger.setMinLevel(logLevelResult.value);
      logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }

    return ok(undefined);
  }
}
