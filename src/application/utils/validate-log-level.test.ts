import { describe, it, expect, vi } from "vitest";
import { validateAndSetLogLevel } from "@/application/utils/validate-log-level";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { LogLevel } from "@/domain/types/log-level";
import { ok, err } from "@/domain/utils/result";

describe("validateAndSetLogLevel", () => {
  it("should set valid log level", () => {
    const logger: PlatformLoggingPort = {
      setMinLevel: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const validator: PlatformValidationPort = {
      validateLogLevel: vi.fn().mockReturnValue(ok(LogLevel.DEBUG)),
    };

    validateAndSetLogLevel(LogLevel.DEBUG, logger, validator);

    expect(validator.validateLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    expect(logger.info).toHaveBeenCalledWith("Log level changed to: DEBUG");
  });

  it("should fallback to INFO when validation fails", () => {
    const logger: PlatformLoggingPort = {
      setMinLevel: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const validator: PlatformValidationPort = {
      validateLogLevel: vi.fn().mockReturnValue(
        err({
          code: "VALIDATION_FAILED",
          message: "Invalid log level value",
        })
      ),
    };

    validateAndSetLogLevel(999, logger, validator); // Invalid log level

    expect(validator.validateLogLevel).toHaveBeenCalledWith(999);
    expect(logger.warn).toHaveBeenCalledWith(
      "Invalid log level value received: 999, using default INFO"
    );
    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.INFO);
  });

  it("should handle logger without setMinLevel", () => {
    const logger: PlatformLoggingPort = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const validator: PlatformValidationPort = {
      validateLogLevel: vi.fn().mockReturnValue(ok(LogLevel.WARN)),
    };

    expect(() => validateAndSetLogLevel(LogLevel.WARN, logger, validator)).not.toThrow();
  });

  it("should handle invalid value with logger without setMinLevel", () => {
    const logger: PlatformLoggingPort = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    const validator: PlatformValidationPort = {
      validateLogLevel: vi.fn().mockReturnValue(
        err({
          code: "VALIDATION_FAILED",
          message: "Invalid log level value",
        })
      ),
    };

    validateAndSetLogLevel(999, logger, validator);

    expect(logger.warn).toHaveBeenCalled();
  });
});
