/**
 * Domain model for setting configuration.
 *
 * Platform-agnostic representation of a module setting.
 * This type is used by the domain layer and does not depend on
 * any infrastructure-specific types (like Valibot schemas).
 */
export interface DomainSettingConfig<T> {
  /** Display name shown in settings UI */
  name: string;

  /** Help text shown below the setting */
  hint?: string;

  /** Scope determines where the setting is stored */
  scope: "world" | "client" | "user";

  /** Whether to show in module configuration UI */
  config: boolean;

  /** Type constructor (String, Number, Boolean) */
  type: typeof String | typeof Number | typeof Boolean;

  /** Available choices for select dropdown */
  choices?: Record<string | number, string>;

  /** Default value */
  default: T;

  /** Callback when setting changes (called immediately with new value) */
  onChange?: (value: T) => void;
}

/**
 * Domain error for settings operations.
 *
 * Platform-agnostic error type that can be mapped from/to
 * platform-specific errors.
 */
export interface DomainSettingsError {
  code:
    | "SETTING_REGISTRATION_FAILED"
    | "SETTING_READ_FAILED"
    | "SETTING_WRITE_FAILED"
    | "INVALID_SETTING_VALUE"
    | "SETTING_NOT_FOUND"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}

/**
 * Type guard function for validating setting values.
 *
 * Domain-neutral alternative to Valibot schemas.
 * Implementations can use any validation library internally.
 */
export type SettingValidator<T> = (value: unknown) => value is T;

/**
 * Pre-defined validators for common setting types.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- PascalCase intentional for namespace-like object
export const SettingValidators = {
  /**
   * Validates that value is a boolean.
   */
  boolean: (value: unknown): value is boolean => typeof value === "boolean",

  /**
   * Validates that value is a number.
   */
  number: (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value),

  /**
   * Validates that value is a non-negative number.
   */
  nonNegativeNumber: (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value) && value >= 0,

  /**
   * Validates that value is a non-negative integer.
   */
  nonNegativeInteger: (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value >= 0,

  /**
   * Validates that value is a positive integer (greater than 0).
   */
  positiveInteger: (value: unknown): value is number =>
    typeof value === "number" && Number.isInteger(value) && value > 0,

  /**
   * Validates that value is a string.
   */
  string: (value: unknown): value is string => typeof value === "string",

  /**
   * Validates that value is a non-empty string.
   */
  nonEmptyString: (value: unknown): value is string =>
    typeof value === "string" && value.length > 0,

  /**
   * Validates that value is a number between 0 and 1 (inclusive).
   */
  samplingRate: (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value) && value >= 0 && value <= 1,

  /**
   * Creates a validator for enum values.
   */
  oneOf:
    <T extends string | number>(validValues: readonly T[]) =>
    (value: unknown): value is T =>
      (typeof value === "string" || typeof value === "number") &&
      (validValues as readonly (string | number)[]).includes(value),
} as const;
