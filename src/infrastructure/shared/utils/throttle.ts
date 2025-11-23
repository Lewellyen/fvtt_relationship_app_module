/**
 * Throttles a function to only execute once per specified time window.
 *
 * Useful for rate-limiting high-frequency events (e.g. Foundry hooks).
 * First call executes immediately, subsequent calls within the window are ignored.
 *
 * Supports both synchronous and asynchronous functions.
 *
 * @param fn - Function to throttle (can be async)
 * @param windowMs - Time window in milliseconds
 * @returns Throttled function
 *
 * @example
 * ```typescript
 * const throttled = throttle(() => console.log("fired"), 1000);
 * throttled(); // Executes immediately
 * throttled(); // Ignored (within 1000ms window)
 * setTimeout(throttled, 1500); // Executes (window expired)
 * ```
 */
export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void | Promise<void>,
  windowMs: number
): (...args: Args) => void {
  let isThrottled = false;

  return function throttled(...args: Args): void {
    if (!isThrottled) {
      // First call or window expired - execute immediately
      // Note: Promise from async functions is intentionally not awaited
      // to maintain non-blocking behavior
      fn(...args);
      isThrottled = true;

      // Reset throttle after window
      setTimeout(() => {
        isThrottled = false;
      }, windowMs);
    }
    // Subsequent calls within window are ignored
  };
}

/**
 * Debounces a function to only execute after a specified delay of inactivity.
 *
 * Each call resets the delay timer. Only executes when no calls occur
 * for the specified delay period.
 *
 * @param fn - Function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function with cancel method
 *
 * @example
 * ```typescript
 * const debounced = debounce(() => console.log("fired"), 500);
 * debounced(); // Starts 500ms timer
 * debounced(); // Resets timer
 * debounced(); // Resets timer
 * // After 500ms of no calls: "fired" is logged
 *
 * // Cancel pending execution:
 * debounced.cancel();
 * ```
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
): ((...args: Args) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Args): void {
    // Clear existing timer
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timer
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };

  debounced.cancel = function (): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
