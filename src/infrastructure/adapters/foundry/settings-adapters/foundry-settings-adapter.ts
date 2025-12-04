import type { Result } from "@/domain/types/result";
import type {
  PlatformSettingsPort,
  PlatformSettingConfig,
  SettingsError,
  SettingType,
} from "@/domain/ports/platform-settings-port.interface";
import type {
  FoundrySettings,
  SettingConfig,
} from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type * as v from "valibot";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry.tokens";

/**
 * Foundry-specific implementation of PlatformSettingsPort.
 *
 * Maps Foundry's game.settings API to platform-agnostic settings port.
 *
 * @example
 * ```typescript
 * const adapter = new FoundrySettingsAdapter(foundrySettings);
 *
 * adapter.register("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   type: Boolean,
 *   default: true,
 * });
 *
 * const result = adapter.get("my-module", "enabled", v.boolean());
 * ```
 */
export class FoundrySettingsAdapter implements PlatformSettingsPort {
  constructor(private readonly foundrySettings: FoundrySettings) {}

  /**
   * Register a setting in Foundry.
   *
   * Maps platform config → Foundry config.
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError> {
    // Map Platform config → Foundry config
    const typeResult = this.mapSettingType(config.type);
    if (!typeResult.ok) {
      return {
        ok: false,
        error: typeResult.error,
      };
    }

    const foundryConfig: SettingConfig<T> = {
      name: config.name,
      ...(config.hint !== undefined && { hint: config.hint }),
      scope: config.scope,
      config: config.config,
      type: typeResult.value,
      ...(config.choices !== undefined && { choices: config.choices }),
      default: config.default,
      ...(config.onChange !== undefined && { onChange: config.onChange }),
    };

    const result = this.foundrySettings.register(namespace, key, foundryConfig);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "register", namespace, key),
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Get setting value from Foundry with validation.
   *
   * Uses Valibot schema to validate at runtime.
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError> {
    const result = this.foundrySettings.get(namespace, key, schema);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "get", namespace, key),
      };
    }

    return { ok: true, value: result.value };
  }

  /**
   * Set setting value in Foundry.
   *
   * Persists to Foundry's database and triggers onChange.
   */
  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);

    if (!result.ok) {
      return {
        ok: false,
        error: this.mapFoundryErrorToSettingsError(result.error, "set", namespace, key),
      };
    }

    return { ok: true, value: undefined };
  }

  // ===== Private Helpers =====

  /**
   * Map platform type to Foundry type.
   *
   * Handles both constructor types and string types.
   * Returns Result to comply with Result-Pattern instead of throwing exceptions.
   */
  private mapSettingType(
    type: SettingType
  ): Result<typeof String | typeof Number | typeof Boolean, SettingsError> {
    if (type === "String" || type === String) {
      return { ok: true, value: String };
    }
    if (type === "Number" || type === Number) {
      return { ok: true, value: Number };
    }
    if (type === "Boolean" || type === Boolean) {
      return { ok: true, value: Boolean };
    }
    return {
      ok: false,
      error: {
        code: "SETTING_REGISTRATION_FAILED",
        message: `Unknown setting type: ${type}. Supported types are: String, Number, Boolean`,
        details: { type },
      },
    };
  }

  /**
   * Maps FoundryError to SettingsError.
   *
   * Maps Foundry-specific error codes to platform-agnostic settings error codes.
   */
  private mapFoundryErrorToSettingsError(
    foundryError: FoundryError,
    operation: "register" | "get" | "set",
    namespace: string,
    key: string
  ): SettingsError {
    // Map Foundry error codes to Settings error codes
    let code: SettingsError["code"];
    switch (foundryError.code) {
      case "API_NOT_AVAILABLE":
        code = "PLATFORM_NOT_AVAILABLE";
        break;
      case "VALIDATION_FAILED":
        code = "SETTING_VALIDATION_FAILED";
        break;
      case "OPERATION_FAILED":
        // Check if it's a registration failure
        if (operation === "register") {
          code = "SETTING_REGISTRATION_FAILED";
        } else {
          // For get/set, could be unregistered setting or other issue
          // Check error message for hints
          const message = foundryError.message.toLowerCase();
          if (message.includes("not registered") || message.includes("not found")) {
            code = "SETTING_NOT_REGISTERED";
          } else {
            code = "SETTING_VALIDATION_FAILED";
          }
        }
        break;
      default:
        // Default to registration failed for register, validation failed for get/set
        code =
          operation === "register" ? "SETTING_REGISTRATION_FAILED" : "SETTING_VALIDATION_FAILED";
    }

    return {
      code,
      message: `Failed to ${operation} setting "${namespace}.${key}": ${foundryError.message}`,
      details: foundryError,
    };
  }
}

/**
 * DI-enabled wrapper for FoundrySettingsAdapter.
 */
export class DIFoundrySettingsAdapter extends FoundrySettingsAdapter {
  static dependencies = [foundrySettingsToken] as const;

  constructor(foundrySettings: FoundrySettings) {
    super(foundrySettings);
  }
}
