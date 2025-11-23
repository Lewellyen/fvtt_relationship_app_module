import * as v from "valibot";
import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

/**
 * Type guard to check if value is string based on expectedType check.
 * Used after runtime type validation to narrow unknown to string.
 *
 * @param value - The value to check
 * @param expectedType - The expected type
 * @returns True if expectedType is "string" and value is actually a string
 */
function isStringValue(value: unknown, expectedType: string): value is string {
  return expectedType === "string" && typeof value === "string";
}

/**
 * Valibot schema for JournalEntry validation.
 * Validates that objects from Foundry API conform to expected structure.
 */
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
 * Valibot schema for validating setting values based on their type.
 * Provides type-safe validation for Foundry settings.
 */

/**
 * Validates a setting value against expected types and constraints.
 *
 * @param key - Setting key for error messages
 * @param value - Value to validate
 * @param expectedType - Expected type (string, number, boolean, or specific values)
 * @param choices - Optional array of allowed values
 * @returns Result with validated value or FoundryError
 *
 * @example
 * ```typescript
 * // Validate log level
 * const result = validateSettingValue("logLevel", "DEBUG", "string", ["DEBUG", "INFO", "WARN", "ERROR"]);
 * if (result.ok) {
 *   // value is valid
 * }
 * ```
 */
export function validateSettingValue(
  key: string,
  value: unknown,
  expectedType: "string" | "number" | "boolean",
  choices?: readonly string[]
): Result<unknown, FoundryError> {
  // Type validation
  if (expectedType === "string" && typeof value !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected string, got ${typeof value}`,
        { key, value, expectedType }
      )
    );
  }

  if (expectedType === "number" && typeof value !== "number") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected number, got ${typeof value}`,
        { key, value, expectedType }
      )
    );
  }

  if (expectedType === "boolean" && typeof value !== "boolean") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting ${key}: Expected boolean, got ${typeof value}`,
        { key, value, expectedType }
      )
    );
  }

  // Choice validation (only for strings)
  if (choices && isStringValue(value, expectedType)) {
    if (!choices.includes(value)) {
      return err(
        createFoundryError(
          "VALIDATION_FAILED",
          `Setting ${key}: Invalid value "${value}". Allowed: ${choices.join(", ")}`,
          { key, value, choices }
        )
      );
    }
  }

  return ok(value);
}

/**
 * Valibot schema for Foundry setting configuration.
 * Validates the structure and types of setting registration config.
 */
export const SettingConfigSchema = v.object({
  name: v.optional(v.string()),
  hint: v.optional(v.string()),
  scope: v.optional(v.picklist(["world", "client", "user"])),
  config: v.optional(v.boolean()),
  type: v.optional(v.any()), // typeof String, Number, Boolean - cannot validate constructors
  default: v.optional(v.any()), // Default value depends on type
  choices: v.optional(v.record(v.string(), v.string())), // Record keys must be string in TS
  onChange: v.optional(v.custom<(value: unknown) => void>((val) => typeof val === "function")),
});

/**
 * Validates setting registration config using Valibot schema.
 *
 * @param namespace - Module namespace
 * @param key - Setting key
 * @param config - Setting configuration object
 * @returns Result with validated config or FoundryError
 *
 * @example
 * ```typescript
 * const result = validateSettingConfig("my-module", "logLevel", {
 *   name: "Log Level",
 *   scope: "world",
 *   config: true,
 *   type: Number,
 *   default: 1
 * });
 * ```
 */
export function validateSettingConfig(
  namespace: string,
  key: string,
  config: unknown
): Result<unknown, FoundryError> {
  // Namespace validation
  if (!namespace || typeof namespace !== "string") {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Invalid setting namespace: must be non-empty string",
        { namespace, key }
      )
    );
  }

  // Key validation
  if (!key || typeof key !== "string") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting key: must be non-empty string", {
        namespace,
        key,
      })
    );
  }

  // Config validation (must be object)
  if (!config || typeof config !== "object") {
    return err(
      createFoundryError("VALIDATION_FAILED", "Invalid setting config: must be object", {
        namespace,
        key,
      })
    );
  }

  // Validate config structure with Valibot
  const result = v.safeParse(SettingConfigSchema, config);

  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Setting config validation failed for ${namespace}.${key}: ${result.issues.map((i) => i.message).join(", ")}`,
        { namespace, key, config, issues: result.issues }
      )
    );
  }

  return ok(result.output);
}

// Re-export SettingConfig type for convenience
export type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

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

/**
 * Valibot schema for validating Foundry Application objects in hooks.
 * Validates minimal required properties for safe hook processing.
 */
export const FoundryApplicationSchema = v.object({
  // Application should have a string ID
  id: v.string(),
  // Application should have object property (typed as record instead of any)
  object: v.optional(v.record(v.string(), v.unknown())),
  // Application should have options property
  options: v.optional(v.record(v.string(), v.unknown())),
});

/**
 * Type for validated Foundry Application.
 */
export type ValidatedFoundryApplication = v.InferOutput<typeof FoundryApplicationSchema>;

/**
 * Validates a hook app parameter.
 *
 * @param app - Unknown app object to validate
 * @returns Result with validated app or FoundryError
 *
 * @example
 * ```typescript
 * const result = validateHookApp(app);
 * if (result.ok) {
 *   // app is validated and safe to use
 * }
 * ```
 */
export function validateHookApp(app: unknown): Result<ValidatedFoundryApplication, FoundryError> {
  // Null/undefined check
  if (app === null || app === undefined) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter is null or undefined",
        undefined,
        undefined
      )
    );
  }

  const result = v.safeParse(FoundryApplicationSchema, app);

  if (!result.success) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Hook app parameter validation failed",
        undefined,
        result.issues
      )
    );
  }

  return ok(result.output);
}
