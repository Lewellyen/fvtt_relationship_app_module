import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for Foundry's async and timeout utilities.
 *
 * Wraps Foundry VTT's `foundry.utils.*` async functions to enable:
 * - Port-based abstraction for testability
 * - Result-pattern instead of exceptions
 * - Type-safe error handling
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.com/api/modules/foundry.utils.html
 */
export interface FoundryUtilsAsyncPort extends Disposable {
  /**
   * Fetch a resource with a timeout.
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to Result with Response or error
   *
   * @example
   * ```typescript
   * const result = await utils.fetchWithTimeout("/api/data", {}, 5000);
   * if (result.ok) {
   *   const data = await result.value.json();
   *   console.log(data);
   * }
   * ```
   */
  fetchWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<Response, FoundryError>>;

  /**
   * Fetch JSON data with a timeout.
   *
   * @param url - URL to fetch
   * @param options - Fetch options
   * @param timeoutMs - Timeout in milliseconds
   * @returns Promise resolving to Result with parsed JSON or error
   *
   * @example
   * ```typescript
   * const result = await utils.fetchJsonWithTimeout("/api/data", {}, 5000);
   * if (result.ok) {
   *   console.log(result.value); // Parsed JSON object
   * }
   * ```
   */
  fetchJsonWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<unknown, FoundryError>>;
}
