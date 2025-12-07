import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import { LogLevel, LOG_LEVEL_SCHEMA } from "@/domain/types/log-level";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
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
   * @param container - PlatformContainerPort for service resolution
   * @param logger - Logger instance to configure
   * @returns Result indicating success (always succeeds, settings are optional)
   */
  static configureLogging(container: PlatformContainerPort, logger: Logger): Result<void, string> {
    const settingsResult = container.resolveWithError(foundrySettingsToken);
    if (!settingsResult.ok) {
      // Settings are optional - return success
      return ok(undefined);
    }

    const settings = castResolvedService<FoundrySettings>(settingsResult.value);
    const logLevelResult = settings.get(
      MODULE_METADATA.ID,
      SETTING_KEYS.LOG_LEVEL,
      LOG_LEVEL_SCHEMA
    );

    if (logLevelResult.ok && logger.setMinLevel) {
      logger.setMinLevel(logLevelResult.value);
      logger.debug(`Logger configured with level: ${LogLevel[logLevelResult.value]}`);
    }

    return ok(undefined);
  }
}
