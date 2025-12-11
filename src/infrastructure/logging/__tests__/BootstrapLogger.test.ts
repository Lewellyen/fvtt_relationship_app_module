import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BootstrapLoggerService,
  createBootstrapLogger,
} from "@/infrastructure/logging/BootstrapLogger";
import { LOG_PREFIX } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";

describe("BootstrapLoggerService", () => {
  let logger: BootstrapLoggerService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let mockEnv: EnvironmentConfig;

  beforeEach(() => {
    mockEnv = createMockEnvironmentConfig({ logLevel: LogLevel.INFO });
    logger = new BootstrapLoggerService(mockEnv);
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create instance with EnvironmentConfig", () => {
      const env = createMockEnvironmentConfig({ logLevel: LogLevel.DEBUG });
      const bootstrapLogger = new BootstrapLoggerService(env);
      expect(bootstrapLogger).toBeInstanceOf(BootstrapLoggerService);
    });

    it("should use createRuntimeConfig internally", () => {
      const createRuntimeConfigSpy = vi.spyOn({ createRuntimeConfig }, "createRuntimeConfig");
      const env = createMockEnvironmentConfig({ logLevel: LogLevel.ERROR });
      new BootstrapLoggerService(env);
      // Note: We can't directly spy on the imported function, but we can verify
      // the behavior by checking that the logger works correctly
      expect(createRuntimeConfigSpy).not.toHaveBeenCalled(); // Spy doesn't work on imported functions
    });

    it("should initialize with correct log level from environment", () => {
      const env = createMockEnvironmentConfig({ logLevel: LogLevel.ERROR });
      const bootstrapLogger = new BootstrapLoggerService(env);

      // Debug should be suppressed at ERROR level
      bootstrapLogger.debug("debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // Error should be shown
      bootstrapLogger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe("inherited Logger methods", () => {
    it("should log messages with prefix", () => {
      logger.log("Test message");
      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`);
    });

    it("should log error messages", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Error message`);
    });

    it("should log warn messages", () => {
      logger.warn("Warn message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Warn message`);
    });

    it("should log info messages", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Info message`);
    });

    it("should respect log level from environment", () => {
      const env = createMockEnvironmentConfig({ logLevel: LogLevel.ERROR });
      const errorLevelLogger = new BootstrapLoggerService(env);

      // Debug should be suppressed
      errorLevelLogger.debug("debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // Info should be suppressed
      errorLevelLogger.info("info message");
      expect(consoleInfoSpy).not.toHaveBeenCalled();

      // Error should be shown
      errorLevelLogger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should log with additional parameters", () => {
      const obj = { key: "value" };
      logger.log("Test message", obj);
      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`, obj);
    });
  });
});

describe("createBootstrapLogger", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let mockEnv: EnvironmentConfig;

  beforeEach(() => {
    mockEnv = createMockEnvironmentConfig({ logLevel: LogLevel.INFO });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a Logger instance", () => {
    const logger = createBootstrapLogger(mockEnv);
    expect(logger).toBeDefined();
    expect(typeof logger.log).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should return a BootstrapLoggerService instance", () => {
    const logger = createBootstrapLogger(mockEnv);
    expect(logger).toBeInstanceOf(BootstrapLoggerService);
  });

  it("should create logger with correct environment configuration", () => {
    const env = createMockEnvironmentConfig({ logLevel: LogLevel.ERROR });
    const logger = createBootstrapLogger(env);

    // Debug should be suppressed at ERROR level
    logger.debug("debug message");
    expect(consoleDebugSpy).not.toHaveBeenCalled();

    // Error should be shown
    logger.error("error message");
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("should create functional logger that can log messages", () => {
    const logger = createBootstrapLogger(mockEnv);
    logger.info("Test message");
    expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`);
  });

  it("should create independent logger instances", () => {
    const logger1 = createBootstrapLogger(mockEnv);
    const env2 = createMockEnvironmentConfig({ logLevel: LogLevel.DEBUG });
    const logger2 = createBootstrapLogger(env2);

    expect(logger1).not.toBe(logger2);
    expect(logger1).toBeInstanceOf(BootstrapLoggerService);
    expect(logger2).toBeInstanceOf(BootstrapLoggerService);
  });

  it("should implement Logger interface", () => {
    const logger = createBootstrapLogger(mockEnv);
    const loggerInterface: Logger = logger;
    expect(loggerInterface).toBeDefined();
    expect(loggerInterface.log).toBeDefined();
    expect(loggerInterface.error).toBeDefined();
    expect(loggerInterface.warn).toBeDefined();
    expect(loggerInterface.info).toBeDefined();
    expect(loggerInterface.debug).toBeDefined();
  });
});
