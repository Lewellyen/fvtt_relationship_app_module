import { describe, it, expect, vi } from "vitest";
import { validateAndSetLogLevel } from "@/infrastructure/shared/utils/validate-log-level";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { LogLevel } from "@/framework/config/environment";

describe("validateAndSetLogLevel", () => {
  it("should set valid log level", () => {
    const logger: Logger = {
      setMinLevel: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    validateAndSetLogLevel(LogLevel.DEBUG, logger);

    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    expect(logger.info).toHaveBeenCalledWith("Log level changed to: DEBUG");
  });

  it("should fallback to INFO when validation fails", () => {
    const logger: Logger = {
      setMinLevel: vi.fn(),
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    validateAndSetLogLevel(999, logger); // Invalid log level

    expect(logger.warn).toHaveBeenCalledWith(
      "Invalid log level value received: 999, using default INFO"
    );
    expect(logger.setMinLevel).toHaveBeenCalledWith(LogLevel.INFO);
  });

  it("should handle logger without setMinLevel", () => {
    const logger: Logger = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    expect(() => validateAndSetLogLevel(LogLevel.WARN, logger)).not.toThrow();
  });

  it("should handle invalid value with logger without setMinLevel", () => {
    const logger: Logger = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    };

    validateAndSetLogLevel(999, logger);

    expect(logger.warn).toHaveBeenCalled();
  });
});
