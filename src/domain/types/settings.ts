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
 * Registry interface for managing setting validators.
 *
 * Provides methods to register and retrieve custom validators
 * while maintaining backward compatibility with direct property access.
 */
export interface SettingValidatorRegistry {
  /**
   * Registers a new validator with the given name.
   *
   * @param name - Validator name (must be a valid identifier)
   * @param validator - Validator function
   * @throws {Error} If name is invalid or conflicts with built-in validators
   */
  register<T>(name: string, validator: SettingValidator<T>): void;

  /**
   * Gets a validator by name.
   *
   * @param name - Validator name
   * @returns Validator function or undefined if not found
   */
  get<T>(name: string): SettingValidator<T> | undefined;

  /**
   * Checks if a validator with the given name exists.
   *
   * @param name - Validator name
   * @returns True if validator exists, false otherwise
   */
  has(name: string): boolean;
}

/**
 * Standard validators that are always available.
 */
interface StandardValidators {
  /**
   * Validates that value is a boolean.
   */
  boolean: SettingValidator<boolean>;

  /**
   * Validates that value is a number.
   */
  number: SettingValidator<number>;

  /**
   * Validates that value is a non-negative number.
   */
  nonNegativeNumber: SettingValidator<number>;

  /**
   * Validates that value is a non-negative integer.
   */
  nonNegativeInteger: SettingValidator<number>;

  /**
   * Validates that value is a positive integer (greater than 0).
   */
  positiveInteger: SettingValidator<number>;

  /**
   * Validates that value is a string.
   */
  string: SettingValidator<string>;

  /**
   * Validates that value is a non-empty string.
   */
  nonEmptyString: SettingValidator<string>;

  /**
   * Validates that value is a number between 0 and 1 (inclusive).
   */
  samplingRate: SettingValidator<number>;

  /**
   * Creates a validator for enum values.
   */
  oneOf: <T extends string | number>(validValues: readonly T[]) => SettingValidator<T>;
}

/**
 * Extended type that combines standard validators with registry functionality.
 */
type SettingValidatorsType = StandardValidators & SettingValidatorRegistry;

/**
 * Creates an extensible validators registry with standard validators.
 *
 * Maintains backward compatibility: All standard validators are accessible
 * as direct properties (e.g., `SettingValidators.boolean()`).
 * Additional validators can be registered via the `register()` method.
 *
 * Useful for creating isolated registry instances in tests.
 */
export function createSettingValidators(): SettingValidatorsType {
  const customValidators = new Map<string, SettingValidator<unknown>>();

  // Define standard validators
  const standardValidators: StandardValidators = {
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
    oneOf: <T extends string | number>(validValues: readonly T[]): SettingValidator<T> => {
      return (value: unknown): value is T =>
        (typeof value === "string" || typeof value === "number") &&
        (validValues as readonly (string | number)[]).includes(value);
    },
  };

  // Create registry methods
  const registry: SettingValidatorRegistry = {
    register<T>(name: string, validator: SettingValidator<T>): void {
      // Prevent overriding standard validators
      if (name in standardValidators) {
        throw new Error(
          `Cannot override built-in validator: ${name}. Use a different name for your custom validator.`
        );
      }

      // Validate identifier format (basic check)
      if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
        throw new Error(`Invalid validator name: ${name}. Must be a valid JavaScript identifier.`);
      }

      customValidators.set(name, validator as SettingValidator<unknown>);
    },

    get<T>(name: string): SettingValidator<T> | undefined {
      // Check standard validators first
      /* type-coverage:ignore-next-line -- Proxy pattern: Dynamic property access on standard validators object requires cast */
      const standard = standardValidators[name as keyof StandardValidators];
      if (standard) {
        /* type-coverage:ignore-next-line -- Generic type narrowing: Validator runtime type matches T, but TypeScript cannot infer from runtime check */
        return standard as SettingValidator<T>;
      }

      // Check custom validators
      /* type-coverage:ignore-next-line -- Generic type narrowing: Map.get returns unknown, but validator is registered with type T */
      return customValidators.get(name) as SettingValidator<T> | undefined;
    },

    has(name: string): boolean {
      return name in standardValidators || customValidators.has(name);
    },
  };

  // Combine standard validators with registry methods using Proxy for dynamic property access
  return new Proxy({ ...standardValidators, ...registry } as SettingValidatorsType, {
    get(target, prop: string | symbol) {
      // Handle symbol properties (e.g., Symbol.iterator)
      if (typeof prop === "symbol") {
        /* type-coverage:ignore-next-line -- Proxy pattern: Symbol properties require cast to access target object properties */
        return (target as unknown as Record<string | symbol, unknown>)[prop];
      }

      // Try standard validators first
      if (prop in standardValidators) {
        /* type-coverage:ignore-next-line -- Proxy pattern: Dynamic property access on standard validators object requires cast */
        return standardValidators[prop as keyof StandardValidators];
      }

      // Try registry methods
      if (prop in registry) {
        /* type-coverage:ignore-next-line -- Proxy pattern: Dynamic property access on registry object requires cast */
        return registry[prop as keyof SettingValidatorRegistry];
      }

      // Try custom validators
      const custom = customValidators.get(prop);
      if (custom) {
        return custom;
      }

      // Fallback to target property (for other properties like prototype)
      /* type-coverage:ignore-next-line -- Proxy pattern: Fallback property access requires cast for prototype/other properties */
      return target[prop as keyof SettingValidatorsType];
    },
  });
}

/**
 * Pre-defined validators for common setting types.
 *
 * Extensible via the `register()` method while maintaining backward compatibility
 * with direct property access (e.g., `SettingValidators.boolean()`).
 *
 * @example
 * ```typescript
 * // Use standard validators (backward compatible)
 * const isValid = SettingValidators.boolean(true);
 *
 * // Register custom validator
 * SettingValidators.register("custom", (v): v is CustomType => {
 *   // validation logic
 * });
 *
 * // Use custom validator
 * const customValidator = SettingValidators.get("custom");
 * ```
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- PascalCase intentional for namespace-like object
export const SettingValidators = createSettingValidators();
