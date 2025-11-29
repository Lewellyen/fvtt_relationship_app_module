/**
 * Tests for RetryService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryService, DIRetryService } from "@/infrastructure/retry/RetryService";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import { ok, err } from "@/domain/utils/result";

// Test helper: Simple error mapper for test scenarios
const simpleErrorMapper = (error: unknown): { code: "TEST_ERROR"; message: string } => ({
  code: "TEST_ERROR" as const,
  message: String(error),
});

describe("RetryService", () => {
  let mockLogger: Logger;
  let service: RetryService;

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

    service = new RetryService(mockLogger);

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

  describe("retry (async)", () => {
    it("should return success on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await service.retry(fn, { maxAttempts: 3, mapException: simpleErrorMapper });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it("should retry on failure and eventually succeed", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(ok(42));

      const result = await service.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry succeeded for "testOp" after 3 attempts (50.00ms)'
      );
    });

    it("should return last error after all attempts exhausted", async () => {
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(err("error3"));

      const result = await service.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error3"));
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts (50.00ms)'
      );
    });

    it("should handle thrown exceptions with mapException", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await service.retry(fn, {
        maxAttempts: 2,
        operationName: "fetchData",
        mapException: (error, attempt) => `Mapped: ${String(error)} at attempt ${attempt}`,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Mapped:");
        expect(result.error).toContain("Network error");
      }
      expect(fn).toHaveBeenCalledTimes(2);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("threw exception"),
        expect.anything()
      );
    });

    it("should handle thrown exceptions without operationName (no logging)", async () => {
      // This covers line 299: if (operationName) - the case where operationName is undefined
      const fn = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await service.retry(fn, {
        maxAttempts: 2,
        // operationName is not provided
        mapException: (error, attempt) => `Mapped: ${String(error)} at attempt ${attempt}`,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Mapped:");
        expect(result.error).toContain("Network error");
      }
      expect(fn).toHaveBeenCalledTimes(2);
      // Should NOT log when operationName is not provided (line 299)
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should log retry attempts when operationName is provided", async () => {
      const fn = vi.fn().mockResolvedValueOnce(err("error1")).mockResolvedValueOnce(ok(42));

      await service.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.anything()
      );
    });

    it("should use default maxAttempts of 3", async () => {
      const fn = vi.fn().mockResolvedValue(err("error"));

      await service.retry(fn, { mapException: simpleErrorMapper });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use default delayMs of 100", async () => {
      const fn = vi.fn().mockResolvedValueOnce(err("error")).mockResolvedValueOnce(ok(42));

      await service.retry(fn, { maxAttempts: 2, mapException: simpleErrorMapper });

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    });

    it("should reject when maxAttempts < 1", async () => {
      const fn = vi.fn();

      const result = await service.retry(fn, {
        maxAttempts: 0,
        mapException: (error) => String(error),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("maxAttempts must be >= 1");
      }
      expect(fn).not.toHaveBeenCalled();
    });

    it("should NOT log when operationName is not provided", async () => {
      const fn = vi.fn().mockResolvedValueOnce(err("error")).mockResolvedValueOnce(ok(42));

      await service.retry(fn, { maxAttempts: 2, mapException: simpleErrorMapper });

      // No logging should happen without operationName
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should handle backoff factor correctly", async () => {
      const fn = vi.fn().mockResolvedValueOnce(err("error1")).mockResolvedValueOnce(ok(42));

      await service.retry(fn, {
        maxAttempts: 2,
        delayMs: 100,
        backoffFactor: 2,
        mapException: simpleErrorMapper,
      });

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    });
  });

  describe("retrySync", () => {
    it("should return success on first attempt", () => {
      const fn = vi.fn().mockReturnValue(ok(42));

      const result = service.retrySync(fn, { maxAttempts: 3, mapException: simpleErrorMapper });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
      expect(mockLogger.debug).not.toHaveBeenCalled();
    });

    it("should retry on failure and eventually succeed", () => {
      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(ok(42));

      const result = service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry succeeded for "testOp" after 3 attempts'
      );
    });

    it("should return last error after all attempts exhausted", () => {
      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(err("error3"));

      const result = service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error3"));
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts'
      );
    });

    it("should handle thrown exceptions with mapException", () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("Parse error");
      });

      const result = service.retrySync(fn, {
        maxAttempts: 2,
        operationName: "parseData",
        mapException: (error, attempt) => `Mapped: ${String(error)} at attempt ${attempt}`,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Mapped:");
        expect(result.error).toContain("Parse error");
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should handle thrown exceptions without operationName (no logging)", () => {
      // This covers sync version of line 299: if (operationName) - the case where operationName is undefined
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("Parse error");
      });

      const result = service.retrySync(fn, {
        maxAttempts: 2,
        // operationName is not provided
        mapException: (error, attempt) => `Mapped: ${String(error)} at attempt ${attempt}`,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Mapped:");
        expect(result.error).toContain("Parse error");
      }
      expect(fn).toHaveBeenCalledTimes(2);
      // Should NOT log when operationName is not provided
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    it("should log retry attempts when operationName is provided", () => {
      const fn = vi.fn().mockReturnValueOnce(err("error1")).mockReturnValueOnce(ok(42));

      service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.anything()
      );
    });

    it("should use default maxAttempts of 3", () => {
      const fn = vi.fn().mockReturnValue(err("error"));

      service.retrySync(fn, { mapException: simpleErrorMapper });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should reject when maxAttempts < 1", () => {
      const fn = vi.fn();

      const result = service.retrySync(fn, {
        maxAttempts: 0,
        mapException: (error) => String(error),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("maxAttempts must be >= 1");
      }
      expect(fn).not.toHaveBeenCalled();
    });

    it("should NOT log when operationName is not provided", () => {
      const fn = vi.fn().mockReturnValueOnce(err("error")).mockReturnValueOnce(ok(42));

      service.retrySync(fn, { maxAttempts: 2, mapException: simpleErrorMapper });

      // No logging should happen without operationName
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe("Constructor", () => {
    it("should create instance with dependencies", () => {
      const service = new RetryService(mockLogger);
      expect(service).toBeInstanceOf(RetryService);
    });
  });

  describe("static dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(DIRetryService.dependencies).toEqual([
        expect.any(Symbol), // loggerToken
      ]);
      expect(DIRetryService.dependencies).toHaveLength(1);
    });
  });
});
