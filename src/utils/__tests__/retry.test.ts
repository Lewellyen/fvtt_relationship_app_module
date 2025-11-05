import { describe, it, expect, vi } from "vitest";
import { withRetry, withRetrySync } from "../retry";
import { ok, err } from "../result";

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
  });
});
