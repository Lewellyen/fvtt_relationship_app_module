import type { Result } from "@/domain/types/result";
import type {
  PlatformSettingsPort,
  PlatformSettingConfig,
} from "@/domain/ports/platform-settings-port.interface";
import type { DomainSettingsError } from "@/domain/types/settings";
import type { SettingsError } from "@/domain/types/settings-error";
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";
import type {
  FoundrySettings,
  SettingConfig,
} from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import * as v from "valibot";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { settingTypeMapperToken } from "@/infrastructure/shared/tokens/foundry/setting-type-mapper.token";
import { settingsErrorMapperToken } from "@/infrastructure/shared/tokens/foundry/settings-error-mapper.token";
import type { SettingTypeMapper } from "./mappers/setting-type-mapper.interface";
import type { SettingsErrorMapper } from "./mappers/settings-error-mapper.interface";

/**
 * Maps DomainSettingsError to SettingsError for PlatformSettingsPort compatibility.
 */
function mapDomainErrorToSettingsError(error: DomainSettingsError): SettingsError {
  let code: SettingsError["code"];
  switch (error.code) {
    case "SETTING_REGISTRATION_FAILED":
      code = "SETTING_REGISTRATION_FAILED";
      break;
    case "SETTING_NOT_FOUND":
      code = "SETTING_NOT_REGISTERED";
      break;
    case "INVALID_SETTING_VALUE":
      code = "SETTING_VALIDATION_FAILED";
      break;
    case "SETTING_READ_FAILED":
    case "SETTING_WRITE_FAILED":
      // For read/write failures, check if it's a "not found" scenario
      if (
        error.message.toLowerCase().includes("not found") ||
        error.message.toLowerCase().includes("not registered")
      ) {
        code = "SETTING_NOT_REGISTERED";
      } else {
        code = "SETTING_VALIDATION_FAILED";
      }
      break;
    case "PLATFORM_NOT_AVAILABLE":
      code = "PLATFORM_NOT_AVAILABLE";
      break;
    default:
      code = "SETTING_REGISTRATION_FAILED";
  }
  return {
    code,
    message: error.message,
    details: error.details,
  };
}

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
 * const result = adapter.get("my-module", "enabled", booleanSchema);
 * ```
 */
export class FoundrySettingsAdapter implements PlatformSettingsPort {
  constructor(
    private readonly foundrySettings: FoundrySettings,
    private readonly typeMapper: SettingTypeMapper,
    private readonly errorMapper: SettingsErrorMapper
  ) {}

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
    const typeResult = this.typeMapper.map(config.type);
    if (!typeResult.ok) {
      return {
        ok: false,
        error: mapDomainErrorToSettingsError(typeResult.error),
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
      const domainError = this.errorMapper.map(result.error, {
        operation: "register",
        namespace,
        key,
      });
      return {
        ok: false,
        error: mapDomainErrorToSettingsError(domainError),
      };
    }

    return { ok: true, value: undefined };
  }

  /**
   * Get setting value from Foundry with validation.
   *
   * Uses a permissive valibot schema (v.unknown()) to retrieve the raw value,
   * then validates it using the provided ValidationSchema. This allows any
   * ValidationSchema implementation to be used, not just ValibotValidationSchema.
   */
  get<T>(namespace: string, key: string, schema: ValidationSchema<T>): Result<T, SettingsError> {
    // Get raw value using permissive schema (allows any value)
    const rawResult = this.foundrySettings.get(namespace, key, v.unknown());

    if (!rawResult.ok) {
      const domainError = this.errorMapper.map(rawResult.error, {
        operation: "get",
        namespace,
        key,
      });
      return {
        ok: false,
        error: mapDomainErrorToSettingsError(domainError),
      };
    }

    // Validate using the provided schema (schema-agnostic)
    const validationResult = schema.validate(rawResult.value);
    if (!validationResult.ok) {
      // ValidationSchema.validate returns Result<T, SettingsError>, so we can return it directly
      return validationResult;
    }
    return validationResult;
  }

  /**
   * Set setting value in Foundry.
   *
   * Persists to Foundry's database and triggers onChange.
   */
  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);

    if (!result.ok) {
      const domainError = this.errorMapper.map(result.error, {
        operation: "set",
        namespace,
        key,
      });
      return {
        ok: false,
        error: mapDomainErrorToSettingsError(domainError),
      };
    }

    return { ok: true, value: undefined };
  }
}

/**
 * DI-enabled wrapper for FoundrySettingsAdapter.
 */
export class DIFoundrySettingsAdapter extends FoundrySettingsAdapter {
  static dependencies = [
    foundrySettingsToken,
    settingTypeMapperToken,
    settingsErrorMapperToken,
  ] as const;

  constructor(
    foundrySettings: FoundrySettings,
    typeMapper: SettingTypeMapper,
    errorMapper: SettingsErrorMapper
  ) {
    super(foundrySettings, typeMapper, errorMapper);
  }
}
