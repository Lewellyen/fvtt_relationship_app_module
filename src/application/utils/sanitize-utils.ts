/**
 * Application-layer string sanitization utilities.
 *
 * These functions provide safe string handling for HTML contexts,
 * preventing XSS attacks and ensuring safe display of user-provided content.
 */

/**
 * Sanitizes a string for display in HTML or logs.
 * Escapes HTML entities to prevent XSS attacks and log injection.
 *
 * Uses DOM-based sanitization for robust handling of all edge cases.
 *
 * @param text - The text to sanitize
 * @returns HTML-safe text with escaped entities
 *
 * @example
 * ```typescript
 * sanitizeHtml("<script>alert('xss')</script>");
 * // "&lt;script&gt;alert('xss')&lt;/script&gt;"
 *
 * sanitizeHtml("Normal text");
 * // "Normal text"
 * ```
 */
export function sanitizeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

