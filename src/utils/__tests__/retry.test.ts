import { describe, it, expect, vi } from "vitest";
import { withRetry, withRetrySync, type RetryOptions } from "../retry";
import { ok, err } from "../result";

// Structured error type for testing
interface StructuredError {
  code: "OPERATION_FAILED" | "VALIDATION_ERROR";
  message: string;
  attempt?: number;
}

describe("Retry Utilities", () => {
  describe("withRetry (async)", () => {
    it("should return success on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await withRetry(fn, 3, 10);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        return attempts < 3 ? err("Failed") : ok("Success");
      });

      const result = await withRetry(fn, 3, 10);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Success");
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should return last error after all retries exhausted", async () => {
      const fn = vi.fn().mockResolvedValue(err("Persistent Error"));

      const result = await withRetry(fn, 3, 10);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Persistent Error");
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use exponential backoff", async () => {
      const fn = vi.fn().mockResolvedValue(err("Error"));
      const start = Date.now();

      await withRetry(fn, 3, 100);

      const duration = Date.now() - start;

      // 1st attempt: immediate
      // 2nd attempt: +100ms
      // 3rd attempt: +200ms
      // Total: ~300ms
      expect(duration).toBeGreaterThanOrEqual(290);
      expect(duration).toBeLessThan(400);
    });

    it("should not delay after last attempt", async () => {
      const fn = vi.fn().mockResolvedValue(err("Error"));
      const start = Date.now();

      await withRetry(fn, 1, 1000);

      const duration = Date.now() - start;

      // Only 1 attempt, no delay
      expect(duration).toBeLessThan(100);
    });

    it("should handle thrown exceptions (breaks Result-Pattern)", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await withRetry(fn, 3, 10);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("Network error");
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should handle fn() that throws on some attempts", async () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error("Temporary error");
        }
        return ok("Success after exception");
      });

      const result = await withRetry(fn, 3, 10);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Success after exception");
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should reject maxAttempts < 1", async () => {
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await withRetry(fn, 0, 10);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("maxAttempts must be >= 1");
      }
      expect(fn).not.toHaveBeenCalled();
    });

    it("should reject negative maxAttempts", async () => {
      const fn = vi.fn().mockResolvedValue(ok(42));

      const result = await withRetry(fn, -5, 10);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("maxAttempts must be >= 1");
      }
      expect(fn).not.toHaveBeenCalled();
    });

    it("should use default mapException when options object provided without mapException", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Network timeout"));

      const result = await withRetry(fn, { maxAttempts: 2, delayMs: 10 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Default mapException casts error as ErrorType (Error in this case)
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("Network timeout");
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("withRetrySync", () => {
    it("should return success on first attempt", () => {
      const fn = vi.fn().mockReturnValue(ok(42));

      const result = withRetrySync(fn, 3);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", () => {
      let attempts = 0;
      const fn = vi.fn().mockImplementation(() => {
        attempts++;
        return attempts < 2 ? err("Failed") : ok("Success");
      });

      const result = withRetrySync(fn, 3);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Success");
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should return last error after all retries exhausted", () => {
      const fn = vi.fn().mockReturnValue(err("Persistent Error"));

      const result = withRetrySync(fn, 3);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Persistent Error");
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should use default maxAttempts of 3", () => {
      const fn = vi.fn().mockReturnValue(err("Error"));

      const result = withRetrySync(fn);

      expect(fn).toHaveBeenCalledTimes(3);
      expect(result.ok).toBe(false);
    });

    it("should handle thrown exceptions in sync mode", () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });

      const result = withRetrySync(fn, 3);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("Sync error");
      }
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should reject maxAttempts < 1 in sync mode", () => {
      const fn = vi.fn().mockReturnValue(ok(42));

      const result = withRetrySync(fn, 0);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("maxAttempts must be >= 1");
      }
      expect(fn).not.toHaveBeenCalled();
    });

    it("should use default mapException when options object provided without mapException", () => {
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("Sync parse error");
      });

      const result = withRetrySync(fn, { maxAttempts: 2 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Default mapException casts error as ErrorType (Error in this case)
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error as Error).message).toBe("Sync parse error");
      }
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("mapException for structured error types", () => {
    describe("withRetry (async)", () => {
      it("should use mapException to convert thrown exceptions to structured error type", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Network timeout"));

        const options: RetryOptions<StructuredError> = {
          maxAttempts: 2,
          delayMs: 10,
          mapException: (error, attempt) => ({
            code: "OPERATION_FAILED" as const,
            message: `Attempt ${attempt} failed: ${String(error)}`,
            attempt,
          }),
        };

        const result = await withRetry(fn, options);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("OPERATION_FAILED");
          expect(result.error.message).toContain("Attempt 2 failed");
          expect(result.error.message).toContain("Network timeout");
          expect(result.error.attempt).toBe(2);
        }
      });

      it("should use mapException for invalid maxAttempts error", async () => {
        const fn = vi.fn().mockResolvedValue(ok(42));

        const options: RetryOptions<StructuredError> = {
          maxAttempts: 0,
          mapException: (error, attempt) => ({
            code: "VALIDATION_ERROR" as const,
            message: `Validation failed (attempt ${attempt}): ${String(error)}`,
          }),
        };

        const result = await withRetry(fn, options);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("VALIDATION_ERROR");
          expect(result.error.message).toContain("maxAttempts must be >= 1");
        }
        expect(fn).not.toHaveBeenCalled();
      });

      it("should preserve Result errors without calling mapException", async () => {
        const structuredError: StructuredError = {
          code: "OPERATION_FAILED" as const,
          message: "Original error from Result",
        };
        const fn = vi.fn().mockResolvedValue(err(structuredError));

        const mapExceptionMock = vi.fn((error, attempt) => ({
          code: "OPERATION_FAILED" as const,
          message: `Mapped: ${String(error)}`,
          attempt,
        }));

        const options: RetryOptions<StructuredError> = {
          maxAttempts: 2,
          delayMs: 10,
          mapException: mapExceptionMock,
        };

        const result = await withRetry(fn, options);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          // Should be the original error, not mapped
          expect(result.error.message).toBe("Original error from Result");
        }
        // mapException should NOT be called for Result errors (only for exceptions)
        expect(mapExceptionMock).not.toHaveBeenCalled();
      });

      it("should work with legacy API (backward compatibility)", async () => {
        const fn = vi.fn().mockRejectedValue(new Error("Legacy error"));

        // Legacy API: (fn, maxAttempts, delayMs)
        const result = await withRetry(fn, 2, 10);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          // Legacy API uses unsafe 'as ErrorType' cast
          expect(result.error).toBeInstanceOf(Error);
        }
        expect(fn).toHaveBeenCalledTimes(2);
      });

      it("should apply backoffFactor correctly", async () => {
        const fn = vi.fn().mockResolvedValue(err("Error"));
        const start = Date.now();

        const options: RetryOptions<string> = {
          maxAttempts: 3,
          delayMs: 100,
          backoffFactor: 2, // Exponential: 100 * 1^2 = 100ms, 100 * 2^2 = 400ms
        };

        await withRetry(fn, options);

        const duration = Date.now() - start;

        // 1st attempt: immediate
        // 2nd attempt: +100ms (100 * 1^2)
        // 3rd attempt: +400ms (100 * 2^2)
        // Total: ~500ms
        expect(duration).toBeGreaterThanOrEqual(490);
        expect(duration).toBeLessThan(600);
      });
    });

    describe("withRetrySync", () => {
      it("should use mapException to convert thrown exceptions to structured error type", () => {
        const fn = vi.fn().mockImplementation(() => {
          throw new Error("Parse error");
        });

        const options: Omit<RetryOptions<StructuredError>, "delayMs" | "backoffFactor"> = {
          maxAttempts: 2,
          mapException: (error, attempt) => ({
            code: "OPERATION_FAILED" as const,
            message: `Attempt ${attempt} failed: ${String(error)}`,
            attempt,
          }),
        };

        const result = withRetrySync(fn, options);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("OPERATION_FAILED");
          expect(result.error.message).toContain("Attempt 2 failed");
          expect(result.error.message).toContain("Parse error");
          expect(result.error.attempt).toBe(2);
        }
      });

      it("should use mapException for invalid maxAttempts error", () => {
        const fn = vi.fn().mockReturnValue(ok(42));

        const options: Omit<RetryOptions<StructuredError>, "delayMs" | "backoffFactor"> = {
          maxAttempts: -1,
          mapException: (error, attempt) => ({
            code: "VALIDATION_ERROR" as const,
            message: `Validation failed (attempt ${attempt}): ${String(error)}`,
          }),
        };

        const result = withRetrySync(fn, options);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("VALIDATION_ERROR");
          expect(result.error.message).toContain("maxAttempts must be >= 1");
        }
        expect(fn).not.toHaveBeenCalled();
      });

      it("should work with legacy API (backward compatibility)", () => {
        const fn = vi.fn().mockImplementation(() => {
          throw new Error("Legacy sync error");
        });

        // Legacy API: (fn, maxAttempts)
        const result = withRetrySync(fn, 2);

        expect(result.ok).toBe(false);
        if (!result.ok) {
          // Legacy API uses unsafe 'as ErrorType' cast
          expect(result.error).toBeInstanceOf(Error);
        }
        expect(fn).toHaveBeenCalledTimes(2);
      });
    });
  });
});
