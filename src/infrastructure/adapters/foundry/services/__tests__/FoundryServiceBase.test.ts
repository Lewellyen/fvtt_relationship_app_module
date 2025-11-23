import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryServiceBase } from "@/infrastructure/adapters/foundry/services/FoundryServiceBase";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { ok, err } from "@/infrastructure/shared/utils/result";

// Mock port for testing
class MockPort implements FoundryGame {
  getJournalEntries = vi.fn();
  getJournalEntryById = vi.fn();
  invalidateCache = vi.fn();
  dispose = vi.fn();
}

// Test service extending FoundryServiceBase
class TestService extends FoundryServiceBase<FoundryGame> {
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryGame>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  // Expose protected methods for testing
  public testWithRetry<T>(
    operation: () => Result<T, FoundryError>,
    operationName?: string
  ): Result<T, FoundryError> {
    return this.withRetry(operation, operationName || "TestAdapter");
  }

  public async testWithRetryAsync<T>(
    operation: () => Promise<Result<T, FoundryError>>,
    operationName?: string
  ): Promise<Result<T, FoundryError>> {
    return this.withRetryAsync(operation, operationName || "TestAdapter");
  }
}

describe("FoundryServiceBase", () => {
  let mockPortSelector: PortSelector;
  let mockPortRegistry: PortRegistry<FoundryGame>;
  let mockRetryService: RetryService;
  let service: TestService;

  beforeEach(() => {
    mockPortSelector = {
      selectPort: vi.fn(),
    } as unknown as PortSelector;

    mockPortRegistry = {
      get: vi.fn(),
    } as unknown as PortRegistry<FoundryGame>;

    mockRetryService = {
      retrySync: vi.fn(),
      retry: vi.fn(),
    } as unknown as RetryService;

    service = new TestService(mockPortSelector, mockPortRegistry, mockRetryService);
  });

  describe("withRetry", () => {
    it("should delegate to RetryService.retrySync with correct operation", () => {
      const operation = vi.fn(() => ok("test-result"));
      vi.mocked(mockRetryService.retrySync).mockReturnValue(ok("test-result"));

      const result = service.testWithRetry(operation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test-result");
      }
      expect(mockRetryService.retrySync).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ operationName: "TestAdapter", maxAttempts: 2 })
      );
    });

    it("should propagate errors from RetryService", () => {
      const operation = vi.fn(() => err({ code: "OPERATION_FAILED" as const, message: "failed" }));
      const error = { code: "OPERATION_FAILED" as const, message: "All retries failed" };
      vi.mocked(mockRetryService.retrySync).mockReturnValue(err(error));

      const result = service.testWithRetry(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockRetryService.retrySync).toHaveBeenCalled();
    });

    it("should pass context to RetryService", () => {
      const operation = vi.fn(() => ok(42));
      vi.mocked(mockRetryService.retrySync).mockReturnValue(ok(42));

      service.testWithRetry(operation, "CustomContext");

      expect(mockRetryService.retrySync).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ operationName: "CustomContext" })
      );
    });

    it("should handle operations that return complex objects", () => {
      const complexResult = { data: [1, 2, 3], meta: { count: 3 } };
      const operation = vi.fn(() => ok(complexResult));
      vi.mocked(mockRetryService.retrySync).mockReturnValue(ok(complexResult));

      const result = service.testWithRetry(operation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(complexResult);
      }
    });

    it("should map exceptions through mapException handler", () => {
      const operation = vi.fn();

      // Simulate RetryService calling the operation wrapper which triggers mapException
      vi.mocked(mockRetryService.retrySync).mockImplementation((fn, options) => {
        // Simulate an exception being thrown and caught by RetryService
        try {
          throw new Error("Test exception");
        } catch (error) {
          // Call mapException as RetryService would (with attempt number)
          const mappedError = options.mapException?.(error, 1);
          return err(
            mappedError || { code: "OPERATION_FAILED" as const, message: "Unknown error" }
          );
        }
      });

      const result = service.testWithRetry(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("TestAdapter failed");
        expect(result.error.message).toContain("Test exception");
      }
    });

    it("should handle non-Error exceptions (cause branch coverage)", () => {
      const operation = vi.fn();

      // Simulate RetryService catching a non-Error exception (e.g., string, number)
      vi.mocked(mockRetryService.retrySync).mockImplementation((fn, options) => {
        try {
          throw "String error"; // Non-Error exception
        } catch (error) {
          const mappedError = options.mapException?.(error, 1);
          return err(mappedError || { code: "OPERATION_FAILED" as const, message: "Unknown" });
        }
      });

      const result = service.testWithRetry(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.cause).toBeUndefined(); // Non-Error → cause is undefined
      }
    });
  });

  describe("withRetryAsync", () => {
    it("should delegate to RetryService.retry with correct operation", async () => {
      const operation = vi.fn(async () => ok("async-result"));
      vi.mocked(mockRetryService.retry).mockResolvedValue(ok("async-result"));

      const result = await service.testWithRetryAsync(operation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("async-result");
      }
      expect(mockRetryService.retry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ operationName: "TestAdapter", maxAttempts: 2, delayMs: 100 })
      );
    });

    it("should propagate errors from RetryService", async () => {
      const operation = vi.fn(async () =>
        err({ code: "OPERATION_FAILED" as const, message: "failed" })
      );
      const error = { code: "OPERATION_FAILED" as const, message: "All async retries failed" };
      vi.mocked(mockRetryService.retry).mockResolvedValue(err(error));

      const result = await service.testWithRetryAsync(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(error);
      }
      expect(mockRetryService.retry).toHaveBeenCalled();
    });

    it("should pass context to RetryService", async () => {
      const operation = vi.fn(async () => ok("value"));
      vi.mocked(mockRetryService.retry).mockResolvedValue(ok("value"));

      await service.testWithRetryAsync(operation, "AsyncContext");

      expect(mockRetryService.retry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ operationName: "AsyncContext" })
      );
    });

    it("should handle async operations that return promises", async () => {
      const operation = vi.fn(async () => ok({ status: "success" }));
      vi.mocked(mockRetryService.retry).mockResolvedValue(ok({ status: "success" }));

      const result = await service.testWithRetryAsync(operation);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ status: "success" });
      }
    });

    it("should map exceptions through mapException handler in async context", async () => {
      const operation = vi.fn();

      // Simulate RetryService calling the operation wrapper which triggers mapException
      vi.mocked(mockRetryService.retry).mockImplementation(async (fn, options) => {
        // Simulate an exception being thrown and caught by RetryService
        try {
          throw new Error("Async test exception");
        } catch (error) {
          // Call mapException as RetryService would (with attempt number)
          const mappedError = options.mapException?.(error, 1);
          return err(
            mappedError || { code: "OPERATION_FAILED" as const, message: "Unknown error" }
          );
        }
      });

      const result = await service.testWithRetryAsync(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("TestAdapter failed");
        expect(result.error.message).toContain("Async test exception");
      }
    });

    it("should handle non-Error exceptions in async (cause branch coverage)", async () => {
      const operation = vi.fn();

      // Simulate RetryService catching a non-Error exception (e.g., string, object)
      vi.mocked(mockRetryService.retry).mockImplementation(async (fn, options) => {
        try {
          throw { message: "Object error" }; // Non-Error exception
        } catch (error) {
          const mappedError = options.mapException?.(error, 1);
          return err(mappedError || { code: "OPERATION_FAILED" as const, message: "Unknown" });
        }
      });

      const result = await service.testWithRetryAsync(operation);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.cause).toBeUndefined(); // Non-Error → cause is undefined
      }
    });
  });

  describe("dispose", () => {
    it("should call dispose on port if it implements Disposable", () => {
      const mockPort = new MockPort();

      // Inject port via protected property (for testing)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).port = mockPort;

      service.dispose();

      expect(mockPort.dispose).toHaveBeenCalled();
    });

    it("should set port to null after disposal", () => {
      const mockPort = new MockPort();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).port = mockPort;

      service.dispose();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).port).toBeNull();
    });

    it("should not throw if port is already null", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).port = null;

      expect(() => service.dispose()).not.toThrow();
    });

    it("should not throw if port does not have dispose method", () => {
      const portWithoutDispose = { getJournalEntries: vi.fn() };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).port = portWithoutDispose;

      expect(() => service.dispose()).not.toThrow();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((service as any).port).toBeNull();
    });
  });
});
