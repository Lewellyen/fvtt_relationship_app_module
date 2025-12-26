import { describe, it, expect, vi, beforeEach } from "vitest";
import { RetryableOperation } from "@/infrastructure/adapters/foundry/services/RetryableOperation";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { ok, err } from "@/domain/utils/result";

describe("RetryableOperation", () => {
  let mockRetryService: RetryService;
  let retryable: RetryableOperation;

  beforeEach(() => {
    mockRetryService = {
      retrySync: vi.fn(),
      retry: vi.fn(),
    } as unknown as RetryService;

    retryable = new RetryableOperation(mockRetryService);
  });

  describe("execute", () => {
    it("should delegate to RetryService.retrySync with correct parameters", () => {
      const operation = vi.fn(() => ok("test-result"));
      vi.mocked(mockRetryService.retrySync).mockReturnValue(ok("test-result"));

      const result = retryable.execute(operation, "TestOperation");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test-result");
      }
      expect(mockRetryService.retrySync).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          operationName: "TestOperation",
          maxAttempts: 2,
          mapException: expect.any(Function),
        })
      );
    });

    it("should use custom maxAttempts when provided", () => {
      const operation = vi.fn(() => ok("test-result"));
      vi.mocked(mockRetryService.retrySync).mockReturnValue(ok("test-result"));

      retryable.execute(operation, "TestOperation", 3);

      expect(mockRetryService.retrySync).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          operationName: "TestOperation",
          maxAttempts: 3,
        })
      );
    });

    it("should map exceptions to FoundryError", () => {
      const operation = vi.fn(() => ok("test-result"));
      vi.mocked(mockRetryService.retrySync).mockImplementation((fn, options) => {
        if (options.mapException) {
          const mapped = options.mapException(new Error("Test error"), 1);
          expect(mapped).toEqual({
            code: "OPERATION_FAILED",
            message: "TestOperation failed: Error: Test error",
            cause: expect.any(Error),
          });
        }
        return ok("test-result");
      });

      retryable.execute(operation, "TestOperation");

      expect(mockRetryService.retrySync).toHaveBeenCalled();
    });

    it("should propagate errors from RetryService", () => {
      const operation = vi.fn(() => ok("test-result"));
      const error: FoundryError = {
        code: "OPERATION_FAILED",
        message: "All retries failed",
      };
      vi.mocked(mockRetryService.retrySync).mockReturnValue(err(error));

      const result = retryable.execute(operation, "TestOperation");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
    });
  });

  describe("executeAsync", () => {
    it("should delegate to RetryService.retry with correct parameters", async () => {
      const operation = vi.fn(async () => ok("test-result"));
      vi.mocked(mockRetryService.retry).mockResolvedValue(ok("test-result"));

      const result = await retryable.executeAsync(operation, "TestOperation");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test-result");
      }
      expect(mockRetryService.retry).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          operationName: "TestOperation",
          maxAttempts: 2,
          delayMs: 100,
          mapException: expect.any(Function),
        })
      );
    });

    it("should use custom maxAttempts when provided", async () => {
      const operation = vi.fn(async () => ok("test-result"));
      vi.mocked(mockRetryService.retry).mockResolvedValue(ok("test-result"));

      await retryable.executeAsync(operation, "TestOperation", 3);

      expect(mockRetryService.retry).toHaveBeenCalledWith(
        operation,
        expect.objectContaining({
          operationName: "TestOperation",
          maxAttempts: 3,
          delayMs: 100,
        })
      );
    });

    it("should map exceptions to FoundryError in async operations", async () => {
      const operation = vi.fn(async () => ok("test-result"));
      vi.mocked(mockRetryService.retry).mockImplementation(async (fn, options) => {
        if (options.mapException) {
          const mapped = options.mapException(new Error("Test error"), 1);
          expect(mapped).toEqual({
            code: "OPERATION_FAILED",
            message: "TestOperation failed: Error: Test error",
            cause: expect.any(Error),
          });
        }
        return ok("test-result");
      });

      await retryable.executeAsync(operation, "TestOperation");

      expect(mockRetryService.retry).toHaveBeenCalled();
    });

    it("should propagate errors from RetryService in async operations", async () => {
      const operation = vi.fn(async () => ok("test-result"));
      const error: FoundryError = {
        code: "OPERATION_FAILED",
        message: "All retries failed",
      };
      vi.mocked(mockRetryService.retry).mockResolvedValue(err(error));

      const result = await retryable.executeAsync(operation, "TestOperation");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
    });

    it("should map non-Error exceptions to FoundryError (cause should be undefined)", async () => {
      const operation = vi.fn(async () => ok("test-result"));
      vi.mocked(mockRetryService.retry).mockImplementation(async (fn, options) => {
        if (options.mapException) {
          // Test with a non-Error exception (e.g., string)
          const mapped = options.mapException("String error", 1);
          expect(mapped).toEqual({
            code: "OPERATION_FAILED",
            message: "TestOperation failed: String error",
            cause: undefined,
          });
        }
        return ok("test-result");
      });

      await retryable.executeAsync(operation, "TestOperation");

      expect(mockRetryService.retry).toHaveBeenCalled();
    });
  });
});
