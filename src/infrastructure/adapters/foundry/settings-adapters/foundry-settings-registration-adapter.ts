import type { Result } from "@/domain/types/result";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type {
  DomainSettingConfig,
  DomainSettingType,
  DomainSettingsError,
} from "@/domain/types/settings";
import type { SettingValidator } from "@/domain/types/setting-validator";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import * as v from "valibot";

/**
 * Foundry-specific adapter for PlatformSettingsRegistrationPort.
 *
 * Translates between domain types (DomainSettingConfig, SettingValidator) and
 * Foundry types (SettingConfig, Valibot schemas).
 *
 * This adapter encapsulates all Valibot usage, keeping the domain layer
 * free from validation library dependencies.
 *
 * @example
 * ```typescript
 * const adapter = new FoundrySettingsRegistrationAdapter(foundrySettings);
 *
 * adapter.registerSetting("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   config: true,
 *   type: Boolean,
 *   default: true,
 * });
 *
 * const result = adapter.getSettingValue(
 *   "my-module",
 *   "enabled",
 *   (v): v is boolean => typeof v === "boolean"
 * );
 * ```
 */
export class FoundrySettingsRegistrationAdapter implements PlatformSettingsRegistrationPort {
  constructor(private readonly foundrySettings: FoundrySettings) {}

  registerSetting<T>(
    namespace: string,
    key: string,
    config: DomainSettingConfig<T>
  ): Result<void, DomainSettingsError> {
    // Map domain config to Foundry config
    const foundryConfig: SettingConfig<T> = {
      name: config.name,
      ...(config.hint !== undefined && { hint: config.hint }),
      scope: config.scope,
      config: config.config,
      type: this.mapDomainTypeToFoundryType(config.type),
      ...(config.choices !== undefined && { choices: config.choices }),
      default: config.default,
      ...(config.onChange !== undefined && { onChange: config.onChange }),
    };

    const result = this.foundrySettings.register(namespace, key, foundryConfig);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "register", key),
      };
    }

    return { ok: true, value: undefined };
  }

  getSettingValue<T>(
    namespace: string,
    key: string,
    validator: SettingValidator<T>
  ): Result<T, DomainSettingsError> {
    // Use a permissive Valibot schema to get the raw value
    // Then validate with the provided validator function
    const permissiveSchema = v.unknown();

    const result = this.foundrySettings.get(namespace, key, permissiveSchema);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "get", key),
      };
    }

    // Validate with provided validator
    if (!validator(result.value)) {
      return {
        ok: false,
        error: {
          code: "INVALID_SETTING_VALUE",
          message: `Setting "${namespace}.${key}" has invalid value type`,
          details: { value: result.value },
        },
      };
    }

    return { ok: true, value: result.value };
  }

  async setSettingValue<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, DomainSettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryError(result.error, "set", key),
      };
    }

    return { ok: true, value: undefined };
  }

  // ===== Private Helpers =====

  /**
   * Maps domain-agnostic setting type (string literal) to Foundry constructor type.
   *
   * This mapping encapsulates the platform-specific detail of using constructor types
   * instead of string literals, keeping the domain layer platform-agnostic.
   */
  private mapDomainTypeToFoundryType(
    domainType: DomainSettingType
  ): typeof String | typeof Number | typeof Boolean {
    switch (domainType) {
      case "string":
        return String;
      case "number":
        return Number;
      case "boolean":
        return Boolean;
      default:
        /* c8 ignore start -- Defensive Programming: Exhaustive check, unreachable in practice due to TypeScript types */
        // This should never happen due to TypeScript's type system, but provides
        // a runtime fallback for safety
        const exhaustiveCheck: never = domainType;
        throw new Error(`Unknown domain setting type: ${exhaustiveCheck}`);
      /* c8 ignore stop */
    }
  }

  private mapFoundryError(
    foundryError: FoundryError,
    operation: "register" | "get" | "set",
    key: string
  ): DomainSettingsError {
    let code: DomainSettingsError["code"];

    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "INVALID_SETTING_VALUE";
        break;
      case "OPERATION_FAILED":
        if (operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else if (operation === "get") {
          code = "SETTING_READ_FAILED";
        } else {
          code = "SETTING_WRITE_FAILED";
        }
        break;
      default:
        code =
          operation === "register"
            ? "SETTING_REGISTRATION_FAILED"
            : operation === "get"
              ? "SETTING_READ_FAILED"
              : "SETTING_WRITE_FAILED";
    }

    return {
      code,
      message: `Failed to ${operation} setting "${key}": ${foundryError.message}`,
      details: foundryError,
    };
  }
}

/**
 * DI-enabled wrapper for FoundrySettingsRegistrationAdapter.
 */
export class DIFoundrySettingsRegistrationAdapter extends FoundrySettingsRegistrationAdapter {
  static dependencies = [foundrySettingsToken] as const;

  constructor(foundrySettings: FoundrySettings) {
    super(foundrySettings);
  }
}
