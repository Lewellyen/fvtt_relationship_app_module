import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { createTestContainer } from "@/test/utils/test-helpers";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { traceContextToken } from "@/infrastructure/shared/tokens/observability.tokens";
import { loggerToken } from "@/infrastructure/shared/tokens/core.tokens";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { expectResultOk } from "@/test/utils/test-helpers";
import { LOG_PREFIX } from "@/application/constants/app-constants";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

describe("TraceContext Integration", () => {
  let container: ServiceContainer;
  let logger: Logger;
  let traceContext: TraceContext;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create and configure container
    container = createTestContainer();
    const configResult = configureDependencies(container);
    expectResultOk(configResult);

    // Resolve services using resolveWithError to respect API boundaries
    const loggerResult = container.resolveWithError(loggerToken);
    const traceContextResult = container.resolveWithError(traceContextToken);

    expectResultOk(loggerResult);
    expectResultOk(traceContextResult);

    logger = castResolvedService<Logger>(loggerResult.value);
    traceContext = castResolvedService<TraceContext>(traceContextResult.value);

    // Spy on console
    consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("DI Container Resolution", () => {
    it("should resolve TraceContext from container", () => {
      expect(traceContext).toBeDefined();
      expect(typeof traceContext.trace).toBe("function");
      expect(typeof traceContext.traceAsync).toBe("function");
      expect(typeof traceContext.getCurrentTraceId).toBe("function");
    });

    it("should resolve Logger with TraceContext injected", () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
    });

    it("should return same TraceContext instance (singleton)", () => {
      const traceContext2Result = container.resolveWithError(traceContextToken);
      expectResultOk(traceContext2Result);
      expect(traceContext2Result.value).toBe(traceContext);
    });

    it("should return same Logger instance (singleton)", () => {
      const logger2Result = container.resolveWithError(loggerToken);
      expectResultOk(logger2Result);
      expect(logger2Result.value).toBe(logger);
    });
  });

  describe("Logger + TraceContext Integration", () => {
    it("should automatically inject trace ID into logger messages", () => {
      traceContext.trace(() => {
        logger.info("Integration test message");
      }, "integration-trace-123");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [integration-trace-123] Integration test message`
      );
    });

    it("should work with nested service calls", () => {
      // Simulate nested service calls with same logger instance
      traceContext.trace(() => {
        logger.info("Outer service call");

        // Simulate inner service call with new trace
        traceContext.trace(() => {
          logger.info("Inner service call");
        }, "inner-service-trace");

        // Back to outer
        logger.info("Back to outer service");
      }, "outer-service-trace");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [outer-service-trace] Outer service call`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [inner-service-trace] Inner service call`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        3,
        `${LOG_PREFIX} [outer-service-trace] Back to outer service`
      );
    });

    it("should handle async operations with trace context", async () => {
      await traceContext.traceAsync(async () => {
        logger.info("Start async operation");

        await new Promise((resolve) => setTimeout(resolve, 10));

        logger.info("End async operation");
      }, "async-integration-trace");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [async-integration-trace] Start async operation`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [async-integration-trace] End async operation`
      );
    });

    it("should maintain trace context across multiple logger calls", () => {
      traceContext.trace(() => {
        logger.info("First message");
        logger.warn("Second message");
        logger.error("Third message");
      }, "multi-call-trace");

      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [multi-call-trace] First message`);
    });
  });

  describe("Multiple Concurrent Traces", () => {
    it("should not interfere between sequential traces", () => {
      // First trace
      traceContext.trace(() => {
        logger.info("Trace 1 message");
      }, "trace-1");

      // Second trace (independent)
      traceContext.trace(() => {
        logger.info("Trace 2 message");
      }, "trace-2");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(1, `${LOG_PREFIX} [trace-1] Trace 1 message`);
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(2, `${LOG_PREFIX} [trace-2] Trace 2 message`);
    });

    it("should handle trace within async operation", async () => {
      await traceContext.traceAsync(async () => {
        logger.info("Outer async");

        // Sync trace inside async trace
        traceContext.trace(() => {
          logger.info("Inner sync");
        }, "inner-sync-trace");

        logger.info("Back to outer async");
      }, "outer-async-trace");

      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [outer-async-trace] Outer async`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [inner-sync-trace] Inner sync`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        3,
        `${LOG_PREFIX} [outer-async-trace] Back to outer async`
      );
    });
  });

  describe("Error Handling", () => {
    it("should restore trace context when traced function throws", () => {
      expect(() => {
        traceContext.trace(() => {
          logger.info("Before error");
          throw new Error("Test error");
        }, "error-trace");
      }).toThrow("Test error");

      // Context should be restored
      expect(traceContext.getCurrentTraceId()).toBeNull();

      // Log from before error should have trace
      expect(consoleInfoSpy).toHaveBeenCalledWith(`${LOG_PREFIX} [error-trace] Before error`);
    });

    it("should restore trace context when async function throws", async () => {
      await expect(
        traceContext.traceAsync(async () => {
          logger.info("Before async error");
          throw new Error("Async error");
        }, "async-error-trace")
      ).rejects.toThrow("Async error");

      // Context should be restored
      expect(traceContext.getCurrentTraceId()).toBeNull();
    });
  });

  describe("Alternative Approaches", () => {
    it("should work with explicit withTraceId (alternative approach)", () => {
      const tracedLogger = logger.withTraceId!("explicit-trace-123");
      tracedLogger.info("Explicit traced message");

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `${LOG_PREFIX} [explicit-trace-123] Explicit traced message`
      );
    });

    it("should allow mixing explicit withTraceId and TraceContext", () => {
      traceContext.trace(() => {
        // Use explicit withTraceId inside trace context
        // TracedLogger wraps the base logger which already has context trace
        const explicitLogger = logger.withTraceId!("explicit-override");
        explicitLogger.info("Explicit wins");

        // Use automatic context trace
        logger.info("Context trace");
      }, "context-trace-id");

      // TracedLogger adds explicit trace to already-traced base logger
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        1,
        `${LOG_PREFIX} [context-trace-id] [explicit-override] Explicit wins`
      );
      expect(consoleInfoSpy).toHaveBeenNthCalledWith(
        2,
        `${LOG_PREFIX} [context-trace-id] Context trace`
      );
    });
  });
});
