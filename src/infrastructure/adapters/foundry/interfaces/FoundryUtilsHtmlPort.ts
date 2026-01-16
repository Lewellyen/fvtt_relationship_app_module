import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for Foundry's HTML manipulation utilities.
 *
 * Wraps Foundry VTT's `foundry.utils.*` HTML functions to enable:
 * - Port-based abstraction for testability
 * - Result-pattern instead of exceptions
 * - Type-safe error handling
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.com/api/modules/foundry.utils.html
 */
export interface FoundryUtilsHtmlPort extends Disposable {
  /**
   * Clean HTML string by removing potentially dangerous content.
   *
   * @param html - HTML string to clean
   * @returns Result with cleaned HTML string or error
   *
   * @example
   * ```typescript
   * const dirty = "<script>alert('xss')</script><p>Safe</p>";
   * const result = utils.cleanHTML(dirty);
   * if (result.ok) {
   *   console.log(result.value); // "<p>Safe</p>"
   * }
   * ```
   */
  cleanHTML(html: string): Result<string, FoundryError>;

  /**
   * Escape HTML special characters.
   *
   * This function never fails, so it returns a string directly (no Result).
   *
   * @param str - String to escape
   * @returns Escaped string
   *
   * @example
   * ```typescript
   * const escaped = utils.escapeHTML("<div>Test</div>");
   * console.log(escaped); // "&lt;div&gt;Test&lt;/div&gt;"
   * ```
   */
  escapeHTML(str: string): string;

  /**
   * Unescape HTML entities.
   *
   * This function never fails, so it returns a string directly (no Result).
   *
   * @param str - String to unescape
   * @returns Unescaped string
   *
   * @example
   * ```typescript
   * const unescaped = utils.unescapeHTML("&lt;div&gt;Test&lt;/div&gt;");
   * console.log(unescaped); // "<div>Test</div>"
   * ```
   */
  unescapeHTML(str: string): string;
}
