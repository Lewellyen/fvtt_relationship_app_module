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

    it("should not log when success on first attempt with operationName (covers neither if nor else-if path)", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // This test covers the case where:
      // - result.ok is true
      // - attemptCount is 1 (so first condition result.ok && attemptCount > 1 is false)
      // - operationName is set
      // In this case, neither the if-block nor the else-if block should execute
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await service.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
      // Neither if (result.ok && attemptCount > 1) nor else if (!result.ok) should execute
      // because: result.ok is true, but attemptCount is 1 (not > 1)
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
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
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

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
      // This should execute the else-if branch: else if (!result.ok)
      // First condition (result.ok && attemptCount > 1) is false because result.ok is false
      // even though attemptCount (3) > 1 is true
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts (50.00ms)'
      );
    });

    it("should execute else-if branch when result fails on first attempt (covers else if (!result.ok))", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // This test ensures the else-if branch is covered when:
      // - result.ok is false (so first condition result.ok && attemptCount > 1 is false)
      // - attemptCount is 1 (so first condition is definitely false)
      // - operationName is set
      const fn = vi.fn().mockResolvedValueOnce(err("error1"));

      const result = await service.retry(fn, {
        maxAttempts: 1, // Only one attempt, so attemptCount will be 1
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error1"));
      expect(fn).toHaveBeenCalledTimes(1);
      // This should execute the else-if branch: else if (!result.ok)
      // First condition (result.ok && attemptCount > 1) is false because attemptCount is 1
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 1 attempts (50.00ms)'
      );
    });

    it("should execute else-if branch when result fails after multiple attempts (covers else if (!result.ok) with attemptCount > 1)", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // This test ensures the else-if branch is covered when:
      // - result.ok is false (so first condition result.ok && attemptCount > 1 is false)
      // - attemptCount > 1 (multiple retries attempted)
      // - operationName is set
      // This covers the case where the first condition is false because result.ok is false,
      // even though attemptCount > 1 would be true
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
      // This should execute the else-if branch: else if (!result.ok)
      // First condition (result.ok && attemptCount > 1) is false because result.ok is false
      // even though attemptCount (3) > 1 is true
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts (50.00ms)'
      );
    });

    it("should handle thrown exceptions with mapException", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

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

      // Verify exception logging in wrappedFn catch block (lines 80-89, specifically 83-84)
      // This should be called once for the first attempt (attemptCount=1, maxAttempts=2)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/2 threw exception for "fetchData"',
        expect.objectContaining({ error: expect.any(Error) })
      );

      // Verify final failure logging (lines 102-105) - only one parameter (string)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("All retry attempts exhausted")
      );

      // Verify warn was called exactly 2 times: once for exception, once for final failure
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
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
        expect.objectContaining({ error: "error1" })
      );
    });

    it("should log multiple retry attempts for Result errors", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(ok(42));

      await service.retry(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      // Should log both failed attempts (lines 73-75)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/3 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
    });

    it("should log exception during retry attempts (not last attempt)", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(ok(42));

      await service.retry(fn, {
        maxAttempts: 3,
        operationName: "fetchData",
        mapException: simpleErrorMapper,
      });

      // Should log exceptions for first two attempts (lines 83-84)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/3 threw exception for "fetchData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 2/3 threw exception for "fetchData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it("should log Result errors during retry attempts with custom maxAttempts", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // Test with maxAttempts=4 to ensure we test the condition attemptCount < maxAttempts
      // for attempts 1, 2, and 3 (but not 4, which is the last attempt)
      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(err("error3"))
        .mockResolvedValueOnce(ok(42));

      await service.retry(fn, {
        maxAttempts: 4,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      // Should log Result errors for first three attempts (lines 73-75)
      // attemptCount=1, maxAttempts=4: 1 < 4 ✓
      // attemptCount=2, maxAttempts=4: 2 < 4 ✓
      // attemptCount=3, maxAttempts=4: 3 < 4 ✓
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/4 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/4 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 3/4 failed for "testOp"',
        expect.objectContaining({ error: "error3" })
      );
    });

    it("should use default maxAttempts of 3", async () => {
      const fn = vi.fn().mockResolvedValue(err("error"));

      await service.retry(fn, { mapException: simpleErrorMapper });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use default maxAttempts of 3 with operationName (covers ?? 3 branches)", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(ok(42));

      const result = await service.retry(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log retry attempts with default maxAttempts (3)
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

    it("should use default maxAttempts of 3 with operationName for thrown exceptions", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(ok(42));

      const result = await service.retry(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "fetchData",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log exceptions with default maxAttempts (3)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/3 threw exception for "fetchData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 2/3 threw exception for "fetchData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it("should use default maxAttempts of 3 with operationName for final failure", async () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockResolvedValueOnce(err("error1"))
        .mockResolvedValueOnce(err("error2"))
        .mockResolvedValueOnce(err("error3"));

      const result = await service.retry(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error3"));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log final failure with default maxAttempts (3)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts (50.00ms)'
      );
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

    it("should not log when success on first attempt with operationName (covers neither if nor else-if path) (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // This test covers the case where:
      // - result.ok is true
      // - attemptCount is 1 (so first condition result.ok && attemptCount > 1 is false)
      // - operationName is set
      // In this case, neither the if-block nor the else-if block should execute
      const fn = vi.fn().mockReturnValue(ok(42));

      const result = service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(1);
      // Neither if (result.ok && attemptCount > 1) nor else if (!result.ok) should execute
      // because: result.ok is true, but attemptCount is 1 (not > 1)
      expect(mockLogger.debug).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
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

    it("should execute else-if branch when result fails on first attempt (covers else if (!result.ok)) (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // This test ensures the else-if branch is covered when:
      // - result.ok is false (so first condition result.ok && attemptCount > 1 is false)
      // - attemptCount is 1 (so first condition is definitely false)
      // - operationName is set
      const fn = vi.fn().mockReturnValueOnce(err("error1"));

      const result = service.retrySync(fn, {
        maxAttempts: 1, // Only one attempt, so attemptCount will be 1
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error1"));
      expect(fn).toHaveBeenCalledTimes(1);
      // This should execute the else-if branch: else if (!result.ok)
      // First condition (result.ok && attemptCount > 1) is false because attemptCount is 1
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 1 attempts'
      );
    });

    it("should handle thrown exceptions with mapException", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

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

      // Verify exception logging in wrappedFn catch block (lines 145-152, specifically 148-149)
      // This should be called once for the first attempt (attemptCount=1, maxAttempts=2)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/2 threw exception for "parseData"',
        expect.objectContaining({ error: expect.any(Error) })
      );

      // Verify final failure logging (line 163) - only one parameter (string)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("All retry attempts exhausted")
      );

      // Verify warn was called exactly 2 times: once for exception, once for final failure
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
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
        expect.objectContaining({ error: "error1" })
      );
    });

    it("should log multiple retry attempts for Result errors (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(ok(42));

      service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      // Should log both failed attempts (lines 138-140)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/3 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
    });

    it("should log exception during retry attempts (not last attempt) (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Parse error");
        })
        .mockImplementationOnce(() => {
          throw new Error("Parse error");
        })
        .mockReturnValueOnce(ok(42));

      service.retrySync(fn, {
        maxAttempts: 3,
        operationName: "parseData",
        mapException: simpleErrorMapper,
      });

      // Should log exceptions for first two attempts (lines 148-149)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/3 threw exception for "parseData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 2/3 threw exception for "parseData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it("should log Result errors during retry attempts with custom maxAttempts (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      // Test with maxAttempts=4 to ensure we test the condition attemptCount < maxAttempts
      // for attempts 1, 2, and 3 (but not 4, which is the last attempt)
      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(err("error3"))
        .mockReturnValueOnce(ok(42));

      service.retrySync(fn, {
        maxAttempts: 4,
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      // Should log Result errors for first three attempts (lines 138-140)
      // attemptCount=1, maxAttempts=4: 1 < 4 ✓
      // attemptCount=2, maxAttempts=4: 2 < 4 ✓
      // attemptCount=3, maxAttempts=4: 3 < 4 ✓
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/4 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/4 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 3/4 failed for "testOp"',
        expect.objectContaining({ error: "error3" })
      );
    });

    it("should log final failure after all attempts exhausted (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

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

      expect(result.ok).toBe(false);
      // Should log final failure (line 163)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts'
      );
    });

    it("should use default maxAttempts of 3", () => {
      const fn = vi.fn().mockReturnValue(err("error"));

      service.retrySync(fn, { mapException: simpleErrorMapper });

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use default maxAttempts of 3 with operationName (covers ?? 3 branches) (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(ok(42));

      const result = service.retrySync(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log retry attempts with default maxAttempts (3)
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 1/3 failed for "testOp"',
        expect.objectContaining({ error: "error1" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry attempt 2/3 failed for "testOp"',
        expect.objectContaining({ error: "error2" })
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Retry succeeded for "testOp" after 3 attempts'
      );
    });

    it("should use default maxAttempts of 3 with operationName for thrown exceptions (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Parse error");
        })
        .mockImplementationOnce(() => {
          throw new Error("Parse error");
        })
        .mockReturnValueOnce(ok(42));

      const result = service.retrySync(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "parseData",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(ok(42));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log exceptions with default maxAttempts (3)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 1/3 threw exception for "parseData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 2/3 threw exception for "parseData"',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it("should use default maxAttempts of 3 with operationName for final failure (sync)", () => {
      // Reset mocks to ensure clean state
      vi.clearAllMocks();

      const fn = vi
        .fn()
        .mockReturnValueOnce(err("error1"))
        .mockReturnValueOnce(err("error2"))
        .mockReturnValueOnce(err("error3"));

      const result = service.retrySync(fn, {
        // maxAttempts is not set - should default to 3
        operationName: "testOp",
        mapException: simpleErrorMapper,
      });

      expect(result).toEqual(err("error3"));
      expect(fn).toHaveBeenCalledTimes(3);
      // Should log final failure with default maxAttempts (3)
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'All retry attempts exhausted for "testOp" after 3 attempts'
      );
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
