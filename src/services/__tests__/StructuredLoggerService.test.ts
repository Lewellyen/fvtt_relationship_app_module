import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StructuredLoggerService, type LogContext } from "../StructuredLoggerService";
import { MODULE_CONSTANTS } from "@/constants";

describe("StructuredLoggerService", () => {
  let logger: StructuredLoggerService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new StructuredLoggerService();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Basic Logging", () => {
    it("should log with JSON structure", () => {
      logger.info("Test message");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining(MODULE_CONSTANTS.LOG_PREFIX)
      );

      const callArg = consoleInfoSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.level).toBe("INFO");
      expect(parsed.message).toBe("Test message");
      expect(parsed.module).toBe(MODULE_CONSTANTS.MODULE.ID);
      expect(parsed.timestamp).toBeTypeOf("number");
    });

    it("should include log level in entry", () => {
      logger.error("Error message");

      const callArg = consoleErrorSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.level).toBe("ERROR");
    });
  });

  describe("Structured Context", () => {
    it("should include context when provided", () => {
      const context: LogContext = {
        component: "TestComponent",
        action: "testAction",
        userId: "user123",
      };

      logger.info("Test with context", context);

      const callArg = consoleInfoSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.context).toBeDefined();
      expect(parsed.context.component).toBe("TestComponent");
      expect(parsed.context.action).toBe("testAction");
      expect(parsed.context.userId).toBe("user123");
    });

    it("should handle additional data alongside context", () => {
      const context: LogContext = { component: "Test" };
      const additionalData = { key: "value" };

      logger.debug("Debug message", context, additionalData);

      const callArg = consoleDebugSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.context).toBeDefined();
      expect(parsed.data).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle non-serializable data gracefully", () => {
      const circular: any = {};
      circular.self = circular;

      // Should not throw
      expect(() => logger.info("Circular data", circular)).not.toThrow();

      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should log Error objects as data", () => {
      const error = new Error("Test error");

      logger.error("An error occurred", error);

      const callArg = consoleErrorSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.data).toBeDefined();
      expect(parsed.data.length).toBeGreaterThan(0);
    });
  });

  describe("All Log Levels", () => {
    it("should support log()", () => {
      logger.log("Log message");
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should support error()", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it("should support warn()", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should support info()", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalled();
    });

    it("should support debug()", () => {
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe("Timestamp", () => {
    it("should include timestamp in all log entries", () => {
      const before = Date.now();
      logger.info("Test");
      const after = Date.now();

      const callArg = consoleInfoSpy.mock.calls[0]?.[0] as string;
      const jsonPart = callArg.replace(MODULE_CONSTANTS.LOG_PREFIX, "").trim();
      const parsed = JSON.parse(jsonPart);

      expect(parsed.timestamp).toBeGreaterThanOrEqual(before);
      expect(parsed.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
