import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import type { ValidationError } from "@/domain/ports/platform-validation-port.interface";
import { LogLevel, LOG_LEVEL_SCHEMA } from "@/domain/types/log-level";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import * as v from "valibot";

/**
 * Valibot-based implementation of PlatformValidationPort.
 *
 * Uses Valibot for validation, but exposes a platform-agnostic interface
 * to maintain Clean Architecture dependency rules.
 */
export class ValibotValidationAdapter implements PlatformValidationPort {
  /**
   * Validates a log level value using Valibot schema.
   *
   * @param value - The value to validate
   * @returns Result with validated LogLevel or validation error
   */
  validateLogLevel(value: unknown): Result<LogLevel, ValidationError> {
    const validationResult = v.safeParse(LOG_LEVEL_SCHEMA, value);

    if (!validationResult.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Invalid log level value: ${String(value)}. Must be one of: ${LogLevel.DEBUG}, ${LogLevel.INFO}, ${LogLevel.WARN}, ${LogLevel.ERROR}`,
        details: validationResult.issues,
      });
    }

    return ok(validationResult.output);
  }
}
