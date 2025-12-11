/**
 * Tests for RetryServiceCompositionFactory
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryServiceCompositionFactory } from "../retry-service-composition-factory";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { ok, err } from "@/domain/utils/result";

// Test helper: Simple error mapper for test scenarios
const simpleErrorMapper = (error: unknown): { code: "TEST_ERROR"; message: string } => ({
  code: "TEST_ERROR" as const,
  message: String(error),
});

describe("RetryServiceCompositionFactory", () => {
  let mockLogger: Logger;
  let factory: RetryServiceCompositionFactory;

  beforeEach(() => {
    // Mock Logger
    mockLogger = {
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      setMinLevel: vi.fn(),
    };

    factory = new RetryServiceCompositionFactory();

    // Mock setTimeout to execute immediately
    vi.spyOn(global, "setTimeout").mockImplementation((callback: () => void) => {
      callback();
      return 0 as unknown as NodeJS.Timeout;
    });

    // Mock performance.now() for duration tracking
    vi.spyOn(performance, "now")
      .mockReturnValueOnce(1000) // start
      .mockReturnValue(1050); // end
  });

  describe("createRetryService", () => {
    it("should create a RetryService instance", () => {
      const retryService = factory.createRetryService(mockLogger);
      expect(retryService).toBeDefined();
      expect(retryService).toBeInstanceOf(Object);
    });

    it("should create a service that can retry async operations", async () => {
      const retryService = factory.createRetryService(mockLogger);
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await retryService.retry(fn, {
        maxAttempts: 3,
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should create a service that can retry sync operations", () => {
      const retryService = factory.createRetryService(mockLogger);
      const fn = vi.fn().mockReturnValue(ok(42));

      const result = retryService.retrySync(fn, {
        maxAttempts: 3,
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should create a service with observability (logging)", async () => {
      const retryService = factory.createRetryService(mockLogger);
      const fn = vi.fn().mockResolvedValueOnce(err("error1")).mockResolvedValueOnce(ok(42));

      await retryService.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
    });

    it("should compose BaseRetryService and RetryObservabilityDecorator correctly", async () => {
      const retryService = factory.createRetryService(mockLogger);
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(ok(42));

      const result = await retryService.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      // Verify retry algorithm works (multiple attempts)
      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);

      // Verify observability works (logging)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/3 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry succeeded for "testOp" after 3 attempts (50.00ms)'
      );
    });

    it("should handle null logger gracefully", () => {
      // This test ensures the factory can handle edge cases
      // In practice, logger should not be null, but we test the composition
      const nullLogger = null as unknown as Logger;
      expect(() => {
        factory.createRetryService(nullLogger);
      }).not.toThrow();
    });
  });
});
