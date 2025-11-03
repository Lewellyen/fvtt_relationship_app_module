import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConsoleLoggerService } from "../consolelogger";
import { MODULE_CONSTANTS } from "@/constants";

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
    it("should log debug message with prefix", () => {
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith(`${MODULE_CONSTANTS.LOG_PREFIX} Debug message`);
    });

    it("should log debug with complex objects", () => {
      const complexObj = { nested: { data: [1, 2, 3] } };
      logger.debug("Debug message", complexObj);
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `${MODULE_CONSTANTS.LOG_PREFIX} Debug message`,
        complexObj
      );
    });
  });

  describe("Logging consistency", () => {
    it("should use consistent prefix for all log levels", () => {
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
});
