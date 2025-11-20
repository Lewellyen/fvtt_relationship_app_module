/**
 * Formats deprecation replacement information for console warnings.
 *
 * @param replacement - The replacement token name, or null if no replacement is available
 * @returns Formatted replacement message, or empty string if no replacement
 */
export function formatReplacementInfo(replacement: string | null): string {
  return replacement ? `Use "${replacement}" instead.\n` : "";
}
