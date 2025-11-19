import { describe, it, expect, beforeEach, vi } from "vitest";
import { RetryService } from "@/services/RetryService";
import { ok, err } from "@/utils/functional/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Logger } from "@/interfaces/logger";

describe("Runtime Error: Error Recovery (Retry)", () => {
  let retryService: RetryService;
  let mockLogger: Logger;

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

    retryService = new RetryService(mockLogger);

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

  it("should retry on transient errors", async () => {
    let attemptCount = 0;
    const maxAttempts = 3;

    const failingFunction = vi.fn().mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < maxAttempts) {
        throw new Error("Transient error");
      }
      return ok("success");
    });

    const result = await retryService.retry(failingFunction, {
      maxAttempts,
      delayMs: 10,
      mapException: (error) => ({
        code: "RETRY_FAILED" as const,
        message: String(error),
      }),
    });

    expectResultOk(result);
    if (result.ok) {
      expect(result.value).toBe("success");
    }
    expect(failingFunction).toHaveBeenCalledTimes(maxAttempts);
  });

  it("should fail after max retries", async () => {
    const maxAttempts = 3;

    const alwaysFailingFunction = vi.fn().mockImplementation(async () => {
      throw new Error("Permanent error");
    });

    const result = await retryService.retry(alwaysFailingFunction, {
      maxAttempts,
      delayMs: 10,
      mapException: (error) => ({
        code: "RETRY_FAILED" as const,
        message: String(error),
      }),
    });

    expectResultErr(result);
    expect(alwaysFailingFunction).toHaveBeenCalledTimes(maxAttempts);
  });

  it("should handle Result-based errors (not just exceptions)", async () => {
    let attemptCount = 0;
    const maxAttempts = 3;

    const failingFunction = vi.fn().mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < maxAttempts) {
        return err({
          code: "TRANSIENT_ERROR" as const,
          message: "Transient error",
        });
      }
      return ok("success");
    });

    const result = await retryService.retry(failingFunction, {
      maxAttempts,
      delayMs: 10,
      mapException: (error) => ({
        code: "RETRY_FAILED" as const,
        message: String(error),
      }),
    });

    expectResultOk(result);
    if (result.ok) {
      expect(result.value).toBe("success");
    }
    expect(failingFunction).toHaveBeenCalledTimes(maxAttempts);
  });
});
