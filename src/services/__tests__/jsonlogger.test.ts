import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { JsonLogger } from "../jsonlogger";
import { LogLevel } from "@/config/environment";

describe("JsonLogger", () => {
  let logger: JsonLogger;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new JsonLogger();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("log()", () => {
    it("should output JSON with all required fields", () => {
      logger.log("Test message");

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedJson = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedJson);

      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("level", "log");
      expect(parsed).toHaveProperty("module", "fvtt_relationship_app_module");
      expect(parsed).toHaveProperty("message", "Test message");
    });

    it("should include data when params provided", () => {
      logger.log("Test", { foo: "bar" }, 123);

      const loggedJson = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedJson);

      expect(parsed).toHaveProperty("data");
      expect(parsed.data).toEqual([{ foo: "bar" }, 123]);
    });

    it("should not include data field when no params", () => {
      logger.log("Test");

      const loggedJson = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedJson);

      expect(parsed).not.toHaveProperty("data");
    });
  });

  describe("Level filtering", () => {
    it("should filter debug when minLevel is INFO", () => {
      logger.setMinLevel(LogLevel.INFO);

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      expect(consoleLogSpy).toHaveBeenCalledTimes(3); // info, warn, error (no debug)
    });

    it("should show all when minLevel is DEBUG", () => {
      logger.setMinLevel(LogLevel.DEBUG);

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      expect(consoleLogSpy).toHaveBeenCalledTimes(4);
    });

    it("should show only errors when minLevel is ERROR", () => {
      logger.setMinLevel(LogLevel.ERROR);

      logger.debug("Debug");
      logger.info("Info");
      logger.warn("Warn");
      logger.error("Error");

      expect(consoleLogSpy).toHaveBeenCalledTimes(1); // Only error
    });
  });

  describe("JSON format validation", () => {
    it("should produce valid JSON for all log levels", () => {
      // Enable DEBUG level so all logs are output
      logger.setMinLevel(LogLevel.DEBUG);

      // Test each log level method individually
      logger.log("Test log");
      expect(() => JSON.parse(consoleLogSpy.mock.calls[0]?.[0] as string)).not.toThrow();

      logger.error("Test error");
      expect(() => JSON.parse(consoleLogSpy.mock.calls[1]?.[0] as string)).not.toThrow();

      logger.warn("Test warn");
      expect(() => JSON.parse(consoleLogSpy.mock.calls[2]?.[0] as string)).not.toThrow();

      logger.info("Test info");
      expect(() => JSON.parse(consoleLogSpy.mock.calls[3]?.[0] as string)).not.toThrow();

      logger.debug("Test debug");
      expect(() => JSON.parse(consoleLogSpy.mock.calls[4]?.[0] as string)).not.toThrow();

      expect(consoleLogSpy).toHaveBeenCalledTimes(5);
    });

    it("should handle complex objects in data", () => {
      const complexObject = {
        nested: { deeply: { value: 123 } },
        array: [1, 2, 3],
        null: null,
        bool: true,
      };

      logger.info("Complex", complexObject);

      const loggedJson = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedJson);

      expect(parsed.data[0]).toEqual(complexObject);
    });
  });

  describe("Timestamp format", () => {
    it("should use ISO 8601 format", () => {
      logger.info("Test");

      const loggedJson = consoleLogSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(loggedJson);

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("should respect minLevel in error method", () => {
      logger.setMinLevel(99 as LogLevel);

      logger.error("Error message");

      // ERROR is filtered when minLevel > ERROR
      // This tests the filtering behavior
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
