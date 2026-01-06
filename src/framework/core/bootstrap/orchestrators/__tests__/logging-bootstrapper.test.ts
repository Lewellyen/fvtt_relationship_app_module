import { describe, it, expect, beforeEach, vi } from "vitest";
import { LoggingBootstrapper } from "../logging-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { ok, err } from "@/domain/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { MODULE_METADATA, SETTING_KEYS } from "@/application/constants/app-constants";
import { LOG_LEVEL_SCHEMA } from "@/infrastructure/validation/log-level-schema";
import { LogLevel } from "@/domain/types/log-level";

describe("LoggingBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockSettings: FoundrySettings;
  let mockLogger: Logger;

  beforeEach(() => {
    mockSettings = {
      get: vi.fn().mockReturnValue(ok(LogLevel.INFO)),
    } as unknown as FoundrySettings;

    mockLogger = {
      setMinLevel: vi.fn(),
      debug: vi.fn(),
    } as unknown as Logger;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue(ok(mockSettings)),
    } as unknown as PlatformContainerPort;
  });

  it("should configure logging successfully", () => {
    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(foundrySettingsToken);
    expect(mockSettings.get).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.LOG_LEVEL,
      LOG_LEVEL_SCHEMA
    );
    expect(mockLogger.setMinLevel).toHaveBeenCalledWith(LogLevel.INFO);
    expect(mockLogger.debug).toHaveBeenCalledWith("Logger configured with level: INFO");
  });

  it("should return success when settings cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "FoundrySettings not found",
        tokenDescription: String(foundrySettingsToken),
      })
    );

    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockSettings.get).not.toHaveBeenCalled();
    expect(mockLogger.setMinLevel).not.toHaveBeenCalled();
  });

  it("should return success when get setting fails", () => {
    vi.mocked(mockSettings.get).mockReturnValue(
      err({
        code: "VALIDATION_FAILED",
        message: "Setting validation failed",
        details: { value: undefined },
      })
    );

    const result = LoggingBootstrapper.configureLogging(mockContainer, mockLogger);

    expect(result.ok).toBe(true);
    expect(mockLogger.setMinLevel).not.toHaveBeenCalled();
  });

  it("should handle logger without setMinLevel method", () => {
    const loggerWithoutSetMinLevel = {
      debug: vi.fn(),
    } as unknown as Logger;

    const result = LoggingBootstrapper.configureLogging(mockContainer, loggerWithoutSetMinLevel);

    expect(result.ok).toBe(true);
    expect(mockSettings.get).toHaveBeenCalled();
    // Should not throw even if setMinLevel is not available
  });
});
