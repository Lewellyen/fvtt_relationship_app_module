import type { Result } from "@/types/result";
import { ok, err } from "@/utils/result";
import { createFoundryError, type FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Validates a journal entry ID.
 *
 * Fast manual validation optimized for hot-path operations.
 * Validates format, length, and character constraints.
 *
 * Rules:
 * - Must be a non-empty string
 * - Maximum 100 characters
 * - Only alphanumeric characters, hyphens, and underscores
 *
 * @param id - Journal entry ID to validate
 * @returns Result with validated ID or FoundryError
 *
 * @example
 * ```typescript
 * const result = validateJournalId("journal-entry-123");
 * if (result.ok) {
 *   // Safe to use result.value
 * }
 * ```
 */
export function validateJournalId(id: string): Result<string, FoundryError> {
  /* c8 ignore next 3 -- TypeScript ensures id is string at compile time; runtime check is defensive */
  if (typeof id !== "string") {
    return err(createFoundryError("VALIDATION_FAILED", "ID must be a string"));
  }

  if (id.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "ID cannot be empty"));
  }

  if (id.length > 100) {
    return err(createFoundryError("VALIDATION_FAILED", "ID too long (max 100 characters)"));
  }

  if (!/^[a-zA-Z0-9-_]+$/.test(id)) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "ID contains invalid characters (allowed: a-z, A-Z, 0-9, -, _)",
        { id }
      )
    );
  }

  return ok(id);
}

/**
 * Validates a journal entry name.
 *
 * Rules:
 * - Must be a non-empty string
 * - Maximum 255 characters
 *
 * @param name - Journal entry name to validate
 * @returns Result with validated name or FoundryError
 */
export function validateJournalName(name: string): Result<string, FoundryError> {
  if (typeof name !== "string" || name.length === 0) {
    return err(createFoundryError("VALIDATION_FAILED", "Name cannot be empty"));
  }

  if (name.length > 255) {
    return err(createFoundryError("VALIDATION_FAILED", "Name too long (max 255 characters)"));
  }

  return ok(name);
}

/**
 * Validates a module flag key.
 *
 * Rules:
 * - Must be a non-empty string
 * - Maximum 100 characters
 * - Only alphanumeric characters and underscores
 *
 * @param key - Flag key to validate
 * @returns Result with validated key or FoundryError
 */
export function validateFlagKey(key: string): Result<string, FoundryError> {
  if (typeof key !== "string" || key.length === 0 || key.length > 100) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key length"));
  }

  if (!/^[a-zA-Z0-9_]+$/.test(key)) {
    return err(createFoundryError("VALIDATION_FAILED", "Invalid flag key format"));
  }

  return ok(key);
}
