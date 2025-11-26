/**
 * Platform-agnostic HTML sanitization utilities.
 *
 * These functions provide safe string handling for HTML contexts,
 * preventing XSS attacks and ensuring safe display of user-provided content.
 */

/**
 * Sanitizes a string for display in HTML.
 * Escapes HTML entities to prevent XSS attacks.
 *
 * Uses DOM-based sanitization for robust handling of all edge cases.
 *
 * @param text - The text to sanitize
 * @returns HTML-safe text
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

/**
 * Sanitizes a string for use in HTML/CSS selectors.
 * Removes all characters except alphanumeric, hyphens, and underscores.
 * Prevents CSS injection attacks.
 *
 * @param id - The ID to sanitize
 * @returns Sanitized ID safe for use in selectors
 *
 * @example
 * ```typescript
 * sanitizeId("journal-123");  // "journal-123"
 * sanitizeId("../../../etc/passwd");  // "etcpasswd"
 * sanitizeId("<script>alert('xss')</script>");  // "scriptalertxssscript"
 * ```
 */
export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "");
}
