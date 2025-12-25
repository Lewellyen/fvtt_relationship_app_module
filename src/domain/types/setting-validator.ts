/**
 * Type guard function for validating setting values.
 *
 * Domain-neutral alternative to Valibot schemas.
 * Implementations can use any validation library internally.
 */
export type SettingValidator<T> = (value: unknown) => value is T;
