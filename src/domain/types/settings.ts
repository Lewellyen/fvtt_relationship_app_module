/**
 * Domain model for setting configuration.
 *
 * Platform-agnostic representation of a module setting.
 * This type is used by the domain layer and does not depend on
 * any infrastructure-specific types (like Valibot schemas or constructor types).
 */
export type DomainSettingType = "string" | "number" | "boolean";
export type DomainSettingScope = "world" | "client" | "user";

export interface DomainSettingConfig<T> {
  /** Display name shown in settings UI */
  name: string;

  /** Help text shown below the setting */
  hint?: string;

  /** Scope determines where the setting is stored */
  scope: DomainSettingScope;

  /** Whether to show in module configuration UI */
  config: boolean;

  /** Platform-agnostic type (mapped to constructor types in infrastructure layer) */
  type: DomainSettingType;

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

// Re-exports for backward compatibility
// Validator types and implementations have been moved to separate files
// to follow Single Responsibility Principle (SRP)
export type { SettingValidator } from "./setting-validator";
export {
  SettingValidators,
  createSettingValidators,
  type SettingValidatorRegistry,
} from "@/domain/utils/setting-validators";
