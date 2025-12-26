import type { Result } from "@/domain/types/result";
import type { SettingsError } from "@/domain/types/settings-error";

/**
 * Platform-agnostic validation schema interface.
 *
 * Provides a domain-layer abstraction for validation schemas,
 * allowing the domain to be independent of specific validation libraries
 * (e.g., valibot, zod, yup).
 *
 * This interface follows the Dependency Inversion Principle (DIP):
 * Domain defines the abstraction, Infrastructure provides the implementation.
 *
 * @example
 * ```typescript
 * const schema: ValidationSchema<number> = {
 *   validate: (value: unknown): Result<number, SettingsError> => {
 *     if (typeof value === "number" && !isNaN(value)) {
 *       return { ok: true, value };
 *     }
 *     return {
 *       ok: false,
 *       error: {
 *         code: "SETTING_VALIDATION_FAILED",
 *         message: "Value is not a valid number",
 *       },
 *     };
 *   }
 * };
 *
 * const result = schema.validate(userInput);
 * if (result.ok) {
 *   console.log(result.value.toFixed(2));
 * }
 * ```
 */
export interface ValidationSchema<T> {
  /**
   * Validates a value and returns a Result.
   *
   * @param value - The value to validate
   * @returns Result with validated value or validation error
   */
  validate(value: unknown): Result<T, SettingsError>;
}
