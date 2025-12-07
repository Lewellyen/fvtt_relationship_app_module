import type { Result } from "@/domain/types/result";
import type { LogLevel } from "@/domain/types/log-level";

/**
 * Platform-agnostic validation error.
 */
export interface ValidationError {
  code: "VALIDATION_FAILED" | "INVALID_VALUE" | "TYPE_MISMATCH";
  message: string;
  details?: unknown;
}

/**
 * Platform-agnostic port for validation operations.
 *
 * This port provides validation capabilities without coupling to specific
 * validation libraries (e.g., Valibot, Zod). Implementations in the
 * Infrastructure Layer can use any validation library.
 *
 * @example
 * ```typescript
 * const validator: PlatformValidationPort = container.resolve(platformValidationPortToken);
 * const result = validator.validateLogLevel(2);
 * if (result.ok) {
 *   logger.setMinLevel(result.value); // LogLevel.WARN
 * }
 * ```
 */
export interface PlatformValidationPort {
  /**
   * Validates a log level value.
   *
   * Checks if the provided value is a valid LogLevel enum value.
   *
   * @param value - The value to validate (typically a number)
   * @returns Result with validated LogLevel or validation error
   *
   * @example
   * ```typescript
   * const result = validator.validateLogLevel(2);
   * if (result.ok) {
   *   console.log(`Valid log level: ${LogLevel[result.value]}`); // "WARN"
   * } else {
   *   console.error(`Invalid: ${result.error.message}`);
   * }
   * ```
   */
  validateLogLevel(value: unknown): Result<LogLevel, ValidationError>;
}
