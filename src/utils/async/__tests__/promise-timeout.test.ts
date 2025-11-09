import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withTimeout, TimeoutError } from "@/utils/async/promise-timeout";

describe("Promise Timeout Utilities", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("withTimeout", () => {
    it("should resolve if promise completes before timeout", async () => {
      const promise = Promise.resolve(42);

      const resultPromise = withTimeout(promise, 1000);
      vi.advanceTimersByTime(500);

      const result = await resultPromise;
      expect(result).toBe(42);
    });

    it("should reject with TimeoutError if promise takes too long", async () => {
      const promise = new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      const resultPromise = withTimeout(promise, 1000);

      vi.advanceTimersByTime(1001);

      await expect(resultPromise).rejects.toThrow(TimeoutError);
      await expect(resultPromise).rejects.toThrow("Operation timed out after 1000ms");
    });

    it("should reject with original error if promise rejects before timeout", async () => {
      const originalError = new Error("Original error");
      const promise = Promise.reject(originalError);

      const resultPromise = withTimeout(promise, 1000);
      vi.advanceTimersByTime(500);

      await expect(resultPromise).rejects.toThrow("Original error");
      await expect(resultPromise).rejects.not.toThrow(TimeoutError);
    });

    it("should handle promise that resolves exactly at timeout boundary", async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve("success"), 1000);
      });

      const resultPromise = withTimeout(promise, 1000);

      vi.advanceTimersByTime(1000);

      // Race condition: Either resolves or times out depending on timer order
      // Both outcomes are acceptable at exact boundary
      try {
        const result = await resultPromise;
        expect(result).toBe("success");
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
      }
    });

    it("should preserve promise result type", async () => {
      const promise = Promise.resolve({ data: "test", count: 123 });

      const resultPromise = withTimeout(promise, 1000);
      vi.advanceTimersByTime(500);

      const result = await resultPromise;
      expect(result).toEqual({ data: "test", count: 123 });
    });

    it("should handle void promises", async () => {
      const promise = Promise.resolve();

      const resultPromise = withTimeout(promise, 1000);
      vi.advanceTimersByTime(500);

      await expect(resultPromise).resolves.toBeUndefined();
    });

    it("should have correct error name", async () => {
      const promise = new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      const resultPromise = withTimeout(promise, 1000);
      vi.advanceTimersByTime(1001);

      try {
        await resultPromise;
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).name).toBe("TimeoutError");
      }
    });

    it("should clear timeout and not cause unhandled rejection when promise resolves early", async () => {
      // Setup: Track unhandled rejections
      const unhandledRejections: unknown[] = [];
      const rejectionHandler = (event: PromiseRejectionEvent): void => {
        unhandledRejections.push(event.reason);
      };
      globalThis.addEventListener("unhandledrejection", rejectionHandler);

      try {
        // Promise that resolves quickly
        const promise = new Promise((resolve) => {
          setTimeout(() => resolve("success"), 100);
        });

        const resultPromise = withTimeout(promise, 1000);

        // Advance time to resolve promise (but before timeout)
        vi.advanceTimersByTime(100);
        const result = await resultPromise;
        expect(result).toBe("success");

        // Now advance past the timeout point to ensure timer was cleared
        vi.advanceTimersByTime(1000);

        // Run all pending timers/promises
        await vi.runAllTimersAsync();

        // Verify no unhandled rejections occurred
        expect(unhandledRejections).toHaveLength(0);
      } finally {
        globalThis.removeEventListener("unhandledrejection", rejectionHandler);
      }
    });
  });

  describe("TimeoutError", () => {
    it("should have correct message format", () => {
      const error = new TimeoutError(5000);
      expect(error.message).toBe("Operation timed out after 5000ms");
      expect(error.name).toBe("TimeoutError");
    });

    it("should be instanceof Error", () => {
      const error = new TimeoutError(1000);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
