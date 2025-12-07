import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { LogLevel } from "@/domain/types/log-level";

/**
 * Validates and sets log level on logger.
 *
 * This function validates the log level value before applying it to the logger.
 * If validation fails, it falls back to INFO level and logs a warning.
 *
 * Uses PlatformValidationPort to maintain Clean Architecture dependency rules.
 * The validation port abstracts away the specific validation library (e.g., Valibot).
 *
 * @param value - The log level value to validate and set
 * @param logger - The logger instance to configure
 * @param validator - The validation port for validating the log level value
 */
export function validateAndSetLogLevel(
  value: number,
  logger: PlatformLoggingPort,
  validator: PlatformValidationPort
): void {
  // Validate value before using it (security!)
  const validationResult = validator.validateLogLevel(value);

  if (!validationResult.ok) {
    logger.warn(`Invalid log level value received: ${value}, using default INFO`);
    if (logger.setMinLevel) {
      logger.setMinLevel(LogLevel.INFO);
    }
    return;
  }

  // Dynamically reconfigure logger when setting changes
  if (logger.setMinLevel) {
    logger.setMinLevel(validationResult.value);
    logger.info(`Log level changed to: ${LogLevel[validationResult.value]}`);
  }
}
