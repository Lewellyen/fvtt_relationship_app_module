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
 *   validate: (value: unknown): value is number => {
 *     return typeof value === "number" && !isNaN(value);
 *   }
 * };
 *
 * if (schema.validate(userInput)) {
 *   // TypeScript knows userInput is number here
 *   console.log(userInput.toFixed(2));
 * }
 * ```
 */
export interface ValidationSchema<T> {
  /**
   * Validates a value and returns a type predicate.
   *
   * @param value - The value to validate
   * @returns Type predicate indicating if value is of type T
   */
  validate(value: unknown): value is T;
}
