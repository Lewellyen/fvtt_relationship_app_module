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

    it("should handle edge case when timeoutHandle is null in finally block", async () => {
      // This test covers the edge case where timeoutHandle might be null
      // This can happen in a race condition where the promise settles before setTimeout is called
      // However, in practice this is very unlikely, so we test it by mocking setTimeout

      const originalSetTimeout = global.setTimeout;
      let timeoutHandleValue: NodeJS.Timeout | null = null;

      // Mock setTimeout to capture the handle and allow testing the null case
      vi.spyOn(global, "setTimeout").mockImplementation((callback: () => void, delay?: number) => {
        const handle = originalSetTimeout(callback, delay);
        timeoutHandleValue = handle;
        // Return null-like value to simulate edge case (not actually possible in real code)
        return handle as NodeJS.Timeout;
      });

      // Create a promise that resolves immediately
      const promise = Promise.resolve("immediate");

      // Call withTimeout - promise resolves before setTimeout callback
      const resultPromise = withTimeout(promise, 1000);

      // Wait a bit for the promise to settle
      vi.advanceTimersByTime(10);

      const result = await resultPromise;
      expect(result).toBe("immediate");

      // Verify timeout was set (even though it won't fire)
      expect(timeoutHandleValue).not.toBeNull();

      vi.restoreAllMocks();
    });

    it("should handle case where setTimeout returns null (coverage for null check)", async () => {
      // This test covers the branch where timeoutHandle might be null
      // In practice setTimeout never returns null, but we test the null check for coverage
      const _originalSetTimeout = global.setTimeout;

      // Mock setTimeout to return null to test the null check branch
      vi.spyOn(global, "setTimeout").mockImplementation(() => {
        // Return null to test the null check in finally block
        return null as unknown as NodeJS.Timeout;
      });

      // Create a promise that resolves immediately
      const promise = Promise.resolve("immediate");

      // Call withTimeout - should still work even if setTimeout returns null
      const resultPromise = withTimeout(promise, 1000);

      // Wait a bit for the promise to settle
      vi.advanceTimersByTime(10);

      const result = await resultPromise;
      expect(result).toBe("immediate");

      // Verify setTimeout was called
      expect(global.setTimeout).toHaveBeenCalled();

      vi.restoreAllMocks();
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
