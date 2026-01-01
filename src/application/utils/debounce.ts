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
