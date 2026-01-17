import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoggingBootstrapper } from "../logging-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import { ok, err } from "@/domain/utils/result";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";

describe("LoggingBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockSettings: PlatformSettingsRegistrationPort;
  let mockLogger: PlatformLoggingPort;

  beforeEach(() => {
    mockSettings = {
      getSettingValue: vi.fn().mockReturnValue(ok(LogLevel.INFO)),
    } as unknown as PlatformSettingsRegistrationPort;

    mockLogger = {
      setMinLevel: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    } as unknown as PlatformLoggingPort;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue(ok(mockSettings)),
    } as unknown as PlatformContainerPort;
  });

  it("should configure logging successfully", () => {
    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(
      platformSettingsRegistrationPortToken
    );
    expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.LOG_LEVEL,
      expect.any(Function)
    );
    expect(mockLogger.setMinLevel).toHaveBeenCalledWith(LogLevel.INFO);
    expect(mockLogger.debug).toHaveBeenCalledWith("Logger configured with level: INFO");
  });

  it("should return success when settings cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "FoundrySettings not found",
      })
    );

    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockSettings.getSettingValue).not.toHaveBeenCalled();
    expect(mockLogger.setMinLevel).not.toHaveBeenCalled();
  });

  it("should return success when get setting fails", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(
      err({
        code: "SETTING_READ_FAILED",
        message: "Setting validation failed",
      })
    );

    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockLogger.setMinLevel).not.toHaveBeenCalled();
  });

  it("should handle logger without setMinLevel method", () => {
    const loggerWithoutSetMinLevel = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    } as unknown as PlatformLoggingPort;

    const result = LoggingBootstrapper.configureLogging(mockContainer, loggerWithoutSetMinLevel);

    expect(result.ok).toBe(true);
    expect(mockSettings.getSettingValue).toHaveBeenCalled();
    // Should not throw even if setMinLevel is not available
  });
});
