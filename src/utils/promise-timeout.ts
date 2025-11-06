/**
 * Promise timeout utility.
 * Wraps a promise with a timeout, rejecting if the promise doesn't resolve in time.
 */

/**
 * Error thrown when a promise times out.
 */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Wraps a promise with a timeout.
 *
 * If the promise doesn't resolve/reject within the specified time,
 * it rejects with a TimeoutError.
 *
 * @template T - Type of the promise result
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects with TimeoutError if timeout is exceeded
 *
 * @example
 * ```typescript
 * try {
 *   const result = await withTimeout(fetchData(), 5000);
 *   console.log("Got result:", result);
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.error("Operation timed out");
 *   }
 * }
 * ```
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(timeoutMs));
      }, timeoutMs);
    }),
  ]);
}
