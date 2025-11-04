import * as v from "valibot";
import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { ok, err } from "@/utils/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Valibot schema for JournalEntry validation.
 * Validates that objects from Foundry API conform to expected structure.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- Schemas use PascalCase
export const JournalEntrySchema = v.object({
  id: v.string(),
  name: v.optional(v.string()),
  flags: v.optional(v.record(v.string(), v.unknown())),
  getFlag: v.optional(
    v.custom<(scope: string, key: string) => unknown>((val) => typeof val === "function")
  ),
  setFlag: v.optional(
    v.custom<(scope: string, key: string, value: unknown) => Promise<unknown>>(
      (val) => typeof val === "function"
    )
  ),
});

/**
 * Type for validated journal entries.
 */
export type ValidatedJournalEntry = v.InferOutput<typeof JournalEntrySchema>;

/**
 * Validates an array of journal entries against the schema.
 *
 * @param entries - Array of unknown objects to validate
 * @returns Result with validated entries or FoundryError
 *
 * @example
 * ```typescript
 * const entries = Array.from(game.journal.contents);
 * const result = validateJournalEntries(entries);
 * if (result.ok) {
 *   // entries are validated
 * }
 * ```
 */
export function validateJournalEntries(
  entries: unknown[]
): Result<ValidatedJournalEntry[], FoundryError> {
  const result = v.safeParse(v.array(JournalEntrySchema), entries);

  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Journal entry validation failed",
        undefined,
        result.issues
      )
    );
  }

  return ok(result.output);
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

/**
 * Sanitizes a string for display in HTML.
 * Escapes HTML entities to prevent XSS attacks.
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
