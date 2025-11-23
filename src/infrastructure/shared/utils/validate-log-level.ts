import type { Logger } from "@/infrastructure/logging/logger.interface";
import { LogLevel } from "@/framework/config/environment";
import { LOG_LEVEL_SCHEMA } from "@/infrastructure/adapters/foundry/validation/setting-schemas";
import * as v from "valibot";

/**
 * Validates and sets log level on logger.
 *
 * This function validates the log level value before applying it to the logger.
 * If validation fails, it falls back to INFO level and logs a warning.
 *
 * @param value - The log level value to validate and set
 * @param logger - The logger instance to configure
 */
export function validateAndSetLogLevel(value: number, logger: Logger): void {
  // Validate value before using it (security!)
  const validationResult = v.safeParse(LOG_LEVEL_SCHEMA, value);

  if (!validationResult.success) {
    logger.warn(`Invalid log level value received: ${value}, using default INFO`);
    if (logger.setMinLevel) {
      logger.setMinLevel(LogLevel.INFO);
    }
    return;
  }

  // Dynamically reconfigure logger when setting changes
  if (logger.setMinLevel) {
    logger.setMinLevel(validationResult.output);
    logger.info(`Log level changed to: ${LogLevel[validationResult.output]}`);
  }
}
