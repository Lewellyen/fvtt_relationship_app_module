import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ConsoleLoggerService,
  DIConsoleLoggerService,
} from "@/infrastructure/logging/ConsoleLoggerService";
import { LOG_PREFIX } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { createMockEnvironmentConfig } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";

describe("ConsoleLoggerService", () => {
  let logger: ConsoleLoggerService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;
  let mockEnv: EnvironmentConfig;
  let runtimeConfig: PlatformRuntimeConfigPort;

  beforeEach(() => {
    mockEnv = createMockEnvironmentConfig({ logLevel: LogLevel.INFO });
    runtimeConfig = createRuntimeConfig(mockEnv);
    logger = new ConsoleLoggerService(runtimeConfig);
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
      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`);
    });

    it("should log with additional parameters", () => {
      const obj = { key: "value" };
      logger.log("Test message", obj);
      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`, obj);
    });
  });

  describe("error", () => {
    it("should log error message with prefix", () => {
      logger.error("Error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Error message`);
    });

    it("should log error with stack trace", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Error occurred`, error);
    });
  });

  describe("warn", () => {
    it("should log warning message with prefix", () => {
      logger.warn("Warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Warning message`);
    });

    it("should log warning with additional data", () => {
      const data = { count: 5 };
      logger.warn("Warning message", data);
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Warning message`, data);
    });
  });

  describe("info", () => {
    it("should log info message with prefix", () => {
      logger.info("Info message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Info message`);
    });
  });

  describe("debug", () => {
    it("should log debug message with prefix when minLevel allows", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable debug logging
      logger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Debug message`);
    });

    it("should log debug with complex objects when minLevel allows", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable debug logging
      const complexObj = { nested: { data: [1, 2, 3] } };
      logger.debug("Debug message", complexObj);
      expect(consoleDebugSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Debug message`, complexObj);
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

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(LOG_PREFIX));
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(LOG_PREFIX));
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining(LOG_PREFIX));
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining(LOG_PREFIX));
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining(LOG_PREFIX));
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

  describe("withTraceId", () => {
    it("should create a traced logger that prefixes messages with trace ID", () => {
      const traceId = "trace-123-abc";
      const tracedLogger = logger.withTraceId(traceId);

      tracedLogger.info("Test message");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Test message`);
    });

    it("should include trace ID in all log methods", () => {
      logger.setMinLevel(LogLevel.DEBUG); // Enable all log levels
      const traceId = "trace-456-def";
      const tracedLogger = logger.withTraceId(traceId);

      tracedLogger.log("Log message");
      tracedLogger.error("Error message");
      tracedLogger.warn("Warn message");
      tracedLogger.info("Info message");
      tracedLogger.debug("Debug message");

      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Log message`);
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Error message`);
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Warn message`);
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Info message`);
      expect(consoleDebugSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Debug message`);
    });

    it("should preserve additional parameters in traced logs", () => {
      const traceId = "trace-789-ghi";
      const tracedLogger = logger.withTraceId(traceId);
      const errorObj = new Error("Test error");
      const dataObj = { key: "value" };

      tracedLogger.error("Error with object", errorObj);
      tracedLogger.info("Info with data", dataObj);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [${traceId}] Error with object`,
        errorObj
      );
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [${traceId}] Info with data`,
        dataObj
      );
    });

    it("should respect log level filtering in traced logger", () => {
      logger.setMinLevel(LogLevel.WARN);
      const traceId = "trace-abc-123";
      const tracedLogger = logger.withTraceId(traceId);

      tracedLogger.debug("Debug message");
      tracedLogger.info("Info message");
      tracedLogger.warn("Warn message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should allow nested trace IDs", () => {
      const traceId1 = "trace-1";
      const traceId2 = "trace-2";
      const tracedLogger1 = logger.withTraceId(traceId1);
      const tracedLogger2 = tracedLogger1.withTraceId?.(traceId2);

      tracedLogger2?.info("Nested trace");

      // Nested trace IDs should be combined
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [${traceId1}/${traceId2}] Nested trace`
      );
    });

    it("should create independent traced logger instances", () => {
      const traceId1 = "trace-aaa";
      const traceId2 = "trace-bbb";
      const tracedLogger1 = logger.withTraceId(traceId1);
      const tracedLogger2 = logger.withTraceId(traceId2);

      tracedLogger1.info("Message 1");
      tracedLogger2.info("Message 2");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(1, `${LOG_PREFIX} [${traceId1}] Message 1`);
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(2, `${LOG_PREFIX} [${traceId2}] Message 2`);
    });

    it("should allow setting min level on traced logger", () => {
      const traceId = "trace-level-test";
      const tracedLogger = logger.withTraceId(traceId);

      tracedLogger.setMinLevel?.(LogLevel.ERROR);
      tracedLogger.info("Info message");
      tracedLogger.error("Error message");

      // Info should be filtered, error should be shown
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [${traceId}] Error message`);
    });
  });

  describe("TraceContext Integration", () => {
    let traceContext: TraceContext;
    let loggerWithContext: ConsoleLoggerService;

    beforeEach(() => {
      traceContext = new TraceContext();
      loggerWithContext = new ConsoleLoggerService(createRuntimeConfig(mockEnv), traceContext);
    });

    it("should auto-inject trace ID from context when available", () => {
      traceContext.trace(() => {
        loggerWithContext.info("Message with auto trace");
      }, "auto-trace-123");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [auto-trace-123] Message with auto trace`
      );
    });

    it("should log normally when no trace context is active", () => {
      loggerWithContext.info("Message without trace");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Message without trace`);
    });

    it("should auto-inject trace ID for all log levels", () => {
      traceContext.trace(() => {
        loggerWithContext.log("Log message");
        loggerWithContext.error("Error message");
        loggerWithContext.warn("Warn message");
        loggerWithContext.info("Info message");
        loggerWithContext.debug("Debug message");
      }, "multi-level-trace");

      expect(consoleLogSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [multi-level-trace] Log message`);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [multi-level-trace] Error message`
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [multi-level-trace] Warn message`);
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [multi-level-trace] Info message`);
      expect(consoleDebugSpy).not.toHaveBeenCalled(); // LogLevel.INFO filters out DEBUG
    });

    it("should work correctly with nested traces", () => {
      traceContext.trace(() => {
        loggerWithContext.info("Outer message");

        traceContext.trace(() => {
          loggerWithContext.info("Inner message");
        }, "inner-trace");

        loggerWithContext.info("Back to outer");
      }, "outer-trace");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [outer-trace] Outer message`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [inner-trace] Inner message`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        3,
        `${LOG_PREFIX} [outer-trace] Back to outer`
      );
    });

    it("should work with async traces", async () => {
      await traceContext.traceAsync(async () => {
        loggerWithContext.info("Async message");
        await new Promise((resolve) => setTimeout(resolve, 10));
        loggerWithContext.info("After delay");
      }, "async-trace-456");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [async-trace-456] Async message`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [async-trace-456] After delay`
      );
    });

    it("should work when TraceContext is not injected (backward compatibility)", () => {
      const loggerWithoutContext = new ConsoleLoggerService(createRuntimeConfig(mockEnv));

      loggerWithoutContext.info("Message without context injection");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} Message without context injection`
      );
    });

    it("should have both context and explicit trace when using withTraceId inside trace", () => {
      traceContext.trace(() => {
        const tracedLogger = loggerWithContext.withTraceId("explicit-trace");
        tracedLogger.info("Message with explicit trace");
      }, "context-trace");

      // TracedLogger wraps the base logger which already has context trace
      // So we get both: [context-trace] from base logger, then [explicit-trace] from TracedLogger
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [context-trace] [explicit-trace] Message with explicit trace`
      );
    });

    it("should handle trace context with additional parameters", () => {
      traceContext.trace(() => {
        const obj = { data: "value" };
        loggerWithContext.info("Message with data", obj);
      }, "trace-with-params");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [trace-with-params] Message with data`,
        { data: "value" }
      );
    });

    it("should restore context correctly after exception", () => {
      traceContext.trace(() => {
        try {
          traceContext.trace(() => {
            throw new Error("Inner error");
          }, "inner-error-trace");
        } catch {
          // Swallow error
        }

        // Should be back to outer trace
        loggerWithContext.info("After error");
      }, "outer-error-trace");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [outer-error-trace] After error`);
    });
  });

  describe("Runtime config binding", () => {
    it("should sync log level from RuntimeConfig on initialization", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.WARN }));
      const onChangeSpy = vi.spyOn(config, "onChange");
      const localLogger = new ConsoleLoggerService(config);

      // Logger should be initialized with WARN level
      localLogger.debug("Debug message");
      localLogger.warn("Warn message");

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(onChangeSpy).toHaveBeenCalledWith("logLevel", expect.any(Function));

      onChangeSpy.mockRestore();
    });

    it("should update log level when RuntimeConfig changes", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig({ logLevel: LogLevel.INFO }));
      const localLogger = new ConsoleLoggerService(config);

      // Initially INFO level
      localLogger.debug("Debug message");
      expect(consoleDebugSpy).not.toHaveBeenCalled();

      // Change to DEBUG level via RuntimeConfig
      config.setFromPlatform("logLevel", LogLevel.DEBUG);

      // Now debug should be visible
      localLogger.debug("Debug message");
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe("withTraceId fallback", () => {
    it("should return logger itself if withTraceId is not available", () => {
      // Create a mock logger without withTraceId
      const mockLogger: Logger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        setMinLevel: vi.fn(),
        // withTraceId is intentionally missing
      };

      const config = createRuntimeConfig(createMockEnvironmentConfig());
      const logger = new ConsoleLoggerService(config);

      // Replace internal logger with mock that has no withTraceId
      (logger as unknown as { logger: Logger }).logger = mockLogger;

      const result = logger.withTraceId("test-trace");

      // Should return the logger itself (fallback)
      expect(result).toBe(mockLogger);
    });
  });

  describe("DIConsoleLoggerService", () => {
    it("should extend ConsoleLoggerService with DI dependencies", () => {
      expect(DIConsoleLoggerService.dependencies).toEqual([
        expect.anything(), // runtimeConfigToken
        expect.anything(), // traceContextToken
      ]);
      expect(DIConsoleLoggerService.dependencies).toHaveLength(2);
    });

    it("should create instance with same behavior as ConsoleLoggerService", () => {
      const config = createRuntimeConfig(createMockEnvironmentConfig());
      const diLogger = new DIConsoleLoggerService(config);

      diLogger.info("Test message");
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} Test message`);
    });
  });
});
