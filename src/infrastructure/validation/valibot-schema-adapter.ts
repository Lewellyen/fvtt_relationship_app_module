import type { ValidationSchema } from "@/domain/types/validation-schema.interface";
import * as v from "valibot";

/**
 * Valibot-specific implementation of ValidationSchema that stores the original valibot schema.
 *
 * This allows adapters to access the original valibot schema when needed
 * (e.g., when calling FoundrySettings which still uses valibot).
 *
 * This class is in the infrastructure layer, so it's OK for it to depend on valibot.
 */
export class ValibotValidationSchema<T> implements ValidationSchema<T> {
  constructor(private readonly valibotSchema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>) {}

  validate(value: unknown): value is T {
    const result = v.safeParse(this.valibotSchema, value);
    return result.success;
  }

  /**
   * Gets the original valibot schema.
   * Only available in infrastructure layer - not part of ValidationSchema interface.
   */
  getValibotSchema(): v.BaseSchema<unknown, T, v.BaseIssue<unknown>> {
    return this.valibotSchema;
  }
}

/**
 * Adapter that converts Valibot schemas to domain-layer ValidationSchema interface.
 *
 * This adapter bridges the gap between Infrastructure (valibot) and Domain (ValidationSchema),
 * following the Dependency Inversion Principle (DIP).
 *
 * Returns a ValibotValidationSchema instance that implements ValidationSchema
 * and stores the original valibot schema for use in infrastructure adapters.
 *
 * @example
 * ```typescript
 * import * as v from "valibot";
 * import { toValidationSchema } from "@/infrastructure/validation/valibot-schema-adapter";
 *
 * const valibotSchema = v.number();
 * const domainSchema = toValidationSchema(valibotSchema);
 *
 * // Now domainSchema can be used with PlatformSettingsPort
 * const result = settings.get("my-module", "myKey", domainSchema);
 * ```
 */
export function toValidationSchema<T>(
  valibotSchema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
): ValidationSchema<T> {
  return new ValibotValidationSchema(valibotSchema);
}
