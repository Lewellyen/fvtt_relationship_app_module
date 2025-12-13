import type { Result } from "@/domain/types/result";
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";

/**
 * Platform-agnostic port for application settings.
 *
 * Provides setting registration, get, and set operations.
 * Platform-agnostic - works with any VTT system or persistence layer.
 *
 * Platform mappings:
 * - Foundry: game.settings.register/get/set
 * - Roll20: state object persistence
 * - Fantasy Grounds: DB.setValue/getValue
 * - CSV: JSON file storage (settings.json)
 *
 * @example
 * ```typescript
 * // Register setting
 * settings.register("my-module", "enabled", {
 *   name: "Enable Feature",
 *   scope: "world",
 *   type: Boolean,
 *   default: true,
 * });
 *
 * // Get setting
 * const result = settings.get("my-module", "enabled", booleanSchema);
 * if (result.ok) {
 *   console.log(`Enabled: ${result.value}`);
 * }
 *
 * // Set setting
 * await settings.set("my-module", "enabled", false);
 * ```
 */
export interface PlatformSettingsPort {
  /**
   * Register a new setting.
   *
   * Must be called during initialization phase (before platform is ready).
   * Some platforms (e.g., Foundry) only allow registration during init hook.
   *
   * @param namespace - Module/app identifier (e.g., "my-module")
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration
   * @returns Success or error
   *
   * @example
   * ```typescript
   * settings.register("my-module", "debugMode", {
   *   name: "Debug Mode",
   *   hint: "Enable detailed logging",
   *   scope: "client",
   *   config: true,
   *   type: Boolean,
   *   default: false,
   *   onChange: (value) => console.log(`Debug mode: ${value}`),
   * });
   * ```
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError>;

  /**
   * Get current value of a setting with runtime validation.
   *
   * Uses a platform-agnostic validation schema to validate the setting value at runtime.
   * This ensures type safety even when settings are persisted/loaded.
   *
   * @param namespace - Module identifier
   * @param key - Setting key
   * @param schema - Validation schema for runtime validation
   * @returns Setting value or validation error
   *
   * @example
   * ```typescript
   * const numberSchema: ValidationSchema<number> = {
   *   validate: (value: unknown): value is number => typeof value === "number"
   * };
   * const result = settings.get("my-module", "maxItems", numberSchema);
   * if (result.ok) {
   *   console.log(`Max items: ${result.value}`);
   * } else {
   *   console.error(`Invalid setting: ${result.error.message}`);
   * }
   * ```
   */
  get<T>(namespace: string, key: string, schema: ValidationSchema<T>): Result<T, SettingsError>;

  /**
   * Set value of a setting.
   *
   * Persists value to platform storage and triggers onChange callbacks.
   * Asynchronous because some platforms (e.g., Foundry) persist asynchronously.
   *
   * @param namespace - Module identifier
   * @param key - Setting key
   * @param value - New setting value
   * @returns Success or error (async)
   *
   * @example
   * ```typescript
   * const result = await settings.set("my-module", "theme", "dark");
   * if (!result.ok) {
   *   console.error(`Failed to save setting: ${result.error.message}`);
   * }
   * ```
   */
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>>;
}

/**
 * Platform-agnostic setting configuration.
 *
 * Defines how a setting should be registered, displayed, and persisted.
 */
export interface PlatformSettingConfig<T> {
  /**
   * Display name for the setting (localized).
   */
  name: string;

  /**
   * Optional hint/description for the setting (localized).
   */
  hint?: string;

  /**
   * Scope of the setting.
   *
   * - "world": Shared across all users in this world/game
   * - "client": Per-user, per-browser setting
   * - "user": Per-user setting (synchronized across browsers)
   *
   * Platform mappings:
   * - Foundry: "world", "client", "user" (v13+)
   * - Roll20: "world" → campaign state, "client" → localStorage
   * - CSV: "world" → shared.json, "client" → local.json
   */
  scope: "world" | "client" | "user";

  /**
   * Whether to show this setting in the config UI.
   *
   * If false, setting is hidden from UI but still accessible via API.
   */
  config: boolean;

  /**
   * Data type of the setting.
   *
   * Platform mappings:
   * - Foundry: String/Number/Boolean constructors
   * - Roll20: string representation
   * - CSV: JSON type
   */
  type: SettingType;

  /**
   * Optional choices for enum-like settings.
   *
   * If provided, UI should show dropdown/select instead of free input.
   *
   * @example
   * ```typescript
   * choices: {
   *   "auto": "Automatic",
   *   "manual": "Manual",
   *   "disabled": "Disabled",
   * }
   * ```
   */
  choices?: Record<string | number, string>;

  /**
   * Default value if setting is not yet persisted.
   */
  default: T;

  /**
   * Optional callback triggered when setting changes.
   *
   * Called after value is persisted successfully.
   */
  onChange?: (value: T) => void;
}

/**
 * Platform-agnostic setting type.
 *
 * Supports both constructor types (typeof String) and string types ("String")
 * for maximum compatibility.
 */
export type SettingType =
  | typeof String
  | typeof Number
  | typeof Boolean
  | "String"
  | "Number"
  | "Boolean";

/**
 * Platform-agnostic error for settings operations.
 */
export interface SettingsError {
  code:
    | "SETTING_NOT_REGISTERED" // Trying to get/set unregistered setting
    | "SETTING_VALIDATION_FAILED" // Setting value failed validation
    | "SETTING_REGISTRATION_FAILED" // Platform rejected registration
    | "PLATFORM_NOT_AVAILABLE"; // Platform not initialized yet
  message: string;
  details?: unknown;
}
