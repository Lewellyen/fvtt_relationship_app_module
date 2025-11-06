import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLoggerService } from "../consolelogger";
import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";

describe("ConsoleLoggerService", () => {
  let logger: ConsoleLoggerService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new ConsoleLoggerService();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("log", () => {
    it("should log message with prefix", () => {
      logger.log("Test message");
      expect(consoleLogSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Test message`);
    });

    it("should log with additional parameters", () => {
      const obj = { key: "value" };
      logger.log("Test message", obj);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `${MODULE_CONSTANTS.LOG_PREFIX} Test message`,
        obj
      );
    });
  });

  describe("error", () => {
    it("should log error message with prefix", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Error message`);
    });

    it("should log error with stack trace", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${MODULE_CONSTANTS.LOG_PREFIX} Error occurred`,
        error
      );
    });
  });

  describe("warn", () => {
    it("should log warning message with prefix", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Warning message`);
    });

    it("should log warning with additional data", () => {
      const data = { count: 5 };
      logger.warn("Warning message", data);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `${MODULE_CONSTANTS.LOG_PREFIX} Warning message`,
        data
      );
    });
  });

  describe("info", () => {
    it("should log info message with prefix", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Info message`);
    });
  });

  describe("debug", () => {
    it("should log debug message with prefix when minLevel allows", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable debug logging
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Debug message`);
    });

    it("should log debug with complex objects when minLevel allows", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable debug logging
      const complexObj = { nested: { data: [1, 2, 3] } };
      logger.debug("Debug message", complexObj);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `${MODULE_CONSTANTS.LOG_PREFIX} Debug message`,
        complexObj
      );
    });

    it("should be filtered by default (minLevel = INFO)", () => {
      // Default minLevel is INFO, so debug should be filtered
      logger.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });
  });

  describe("Logging consistency", () => {
    it("should use consistent prefix for all log levels", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable all log levels
      logger.log("log");
      logger.error("error");
      logger.warn("warn");
      logger.info("info");
      logger.debug("debug");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );
    });
  });

  describe("Log Level Filtering", () => {
    it("should filter debug messages when minLevel is INFO", () => {
      logger.setMinLevel(LogLevel.INFO);

      logger.debug("Debug message");
      logger.info("Info message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should filter debug and info when minLevel is WARN", () => {
      logger.setMinLevel(LogLevel.WARN);

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should only show errors when minLevel is ERROR", () => {
      logger.setMinLevel(LogLevel.ERROR);

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should show all messages when minLevel is DEBUG", () => {
      logger.setMinLevel(LogLevel.DEBUG);

      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message");

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should always show log() regardless of minLevel", () => {
      logger.setMinLevel(LogLevel.ERROR);

      logger.log("Log message");

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should respect LogLevel hierarchy", () => {
      logger.setMinLevel(LogLevel.WARN);

      logger.error("Error message"); // ERROR (3) >= WARN (2) -> shown
      logger.warn("Warn message"); // WARN (2) >= WARN (2) -> shown
      logger.info("Info message"); // INFO (1) < WARN (2) -> filtered
      logger.debug("Debug message"); // DEBUG (0) < WARN (2) -> filtered

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it("should respect minLevel in error method", () => {
      // LogLevel values: DEBUG=0, INFO=1, WARN=2, ERROR=3
      // Set minLevel higher than ERROR to filter it out
      logger.setMinLevel(99 as LogLevel);

      logger.error("Error message");

      // ERROR is filtered when minLevel > ERROR
      // This tests that error() respects minLevel for filtering
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
