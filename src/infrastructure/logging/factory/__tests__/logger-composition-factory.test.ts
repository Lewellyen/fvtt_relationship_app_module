import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LoggerCompositionFactory } from "../logger-composition-factory";
import { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import { LogLevel } from "@/domain/types/log-level";
import { LOG_PREFIX } from "@/application/constants/app-constants";

describe("LoggerCompositionFactory", () => {
  let factory: LoggerCompositionFactory;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    factory = new LoggerCompositionFactory();
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLogger", () => {
    it("should create a logger without trace context", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger = factory.createLogger(config);

      expect(logger).toBeDefined();
      logger.info("Test message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`);
    });

    it("should create a logger with trace context", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const traceContext = new TraceContext();
      const logger = factory.createLogger(config, traceContext);

      expect(logger).toBeDefined();
      traceContext.trace(() => {
        logger.info("Test message");
      }, "test-trace-123");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [test-trace-123] Test message`);
    });

    it("should compose logger with all decorators", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.DEBUG }));
      const logger = factory.createLogger(config);

      // Test that all decorators are applied:
      // - BaseConsoleLogger: basic logging
      // - RuntimeConfigLoggerDecorator: syncs log level
      // - StackTraceLoggerDecorator: adds caller info in DEBUG mode
      logger.debug("Debug message");

      // Should include caller info in DEBUG mode (formatted as "message [file:line]")
      expect(consoleDebugSpy).toHaveBeenCalled();
      const callArgs = consoleDebugSpy.mock.calls[0];
      expect(callArgs[0]).toContain(LOG_PREFIX);
      expect(callArgs[0]).toContain("Debug message");
      // Verify caller info is included when in DEBUG mode
      expect(callArgs[0]).toMatch(/\[.*:\d+\]/);
    });

    it("should apply decorators in correct order", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const traceContext = new TraceContext();
      const logger = factory.createLogger(config, traceContext);

      traceContext.trace(() => {
        logger.info("Test message");
      }, "trace-123");

      // Decorator order should be:
      // TraceContext -> StackTrace -> RuntimeConfig -> Base
      // So trace ID should be prepended
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [trace-123] Test message`);
    });

    it("should handle null/undefined trace context gracefully", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger1 = factory.createLogger(config, undefined);
      const logger2 = factory.createLogger(config, null as unknown as TraceContext);

      logger1.info("Message 1");
      logger2.info("Message 2");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(1, `${LOG_PREFIX} Message 1`);
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(2, `${LOG_PREFIX} Message 2`);
    });

    it("should create independent logger instances", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger1 = factory.createLogger(config);
      const logger2 = factory.createLogger(config);

      logger1.setMinLevel?.(LogLevel.ERROR);
      logger2.setMinLevel?.(LogLevel.DEBUG);

      logger1.info("Info 1");
      logger2.info("Info 2");

      // Logger1 should filter INFO (minLevel = ERROR)
      // Logger2 should show INFO (minLevel = DEBUG)
      expect(consoleInfoSpy).not.toHaveBeenNthCalledWith(1, expect.stringContaining("Info 1"));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining("Info 2"));
    });

    it("should sync log level from RuntimeConfig", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger = factory.createLogger(config);

      // Initially INFO level, so debug should be filtered
      logger.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // Change to DEBUG level via RuntimeConfig
      config.setFromFoundry("logLevel", LogLevel.DEBUG);

      // Now debug should be visible
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it("should return Logger interface implementation", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger = factory.createLogger(config);

      // Verify all Logger interface methods are available
      expect(typeof logger.log).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.setMinLevel).toBe("function");
      expect(typeof logger.withTraceId).toBe("function");
    });

    it("should handle withTraceId correctly", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const logger = factory.createLogger(config);
      const tracedLogger = logger.withTraceId?.("explicit-trace") ?? logger;

      tracedLogger.info("Test message");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [explicit-trace] Test message`);
    });
  });

  describe("Edge Cases", () => {
    it("should handle config with different log levels", () => {
      const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

      for (const level of levels) {
        const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: level }));
        const logger = factory.createLogger(config);

        expect(logger).toBeDefined();
        logger.log("Test");
        expect(consoleLogSpy).toHaveBeenCalled();
        vi.clearAllMocks();
      }
    });

    it("should create logger when trace context is provided but not active", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const traceContext = new TraceContext();
      const logger = factory.createLogger(config, traceContext);

      // Log without active trace
      logger.info("Message without trace");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Message without trace`);
    });
  });
});
