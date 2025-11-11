import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type * as v from "valibot";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Setting configuration for Foundry module settings.
 * Type-safe wrapper around Foundry's SettingConfig.
 *
 * Foundry v13 supports three scopes:
 * - world: Shared across all users in the world
 * - client: Specific to browser/device
 * - user: Specific to user within a world (new in v13)
 *
 * @see https://foundryvtt.com/article/settings/
 */
export interface SettingConfig<T> {
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
 * Interface for Foundry's settings system.
 * Abstracts setting registration and access.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * Based on Foundry VTT v13 Settings API.
 */
export interface FoundrySettings extends Disposable {
  /**
   * Registers a new module setting.
   * Must be called during 'init' hook or earlier.
   *
   * @param namespace - Module ID
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration
   * @returns Result indicating success or FoundryError
   *
   * @example
   * ```typescript
   * settings.register("my-module", "myKey", {
   *   name: "My Setting",
   *   scope: "world",
   *   config: true,
   *   type: Number,
   *   default: 42
   * });
   * ```
   */
  register<T>(namespace: string, key: string, config: SettingConfig<T>): Result<void, FoundryError>;

  /**
   * Gets the current value of a setting with runtime validation.
   *
   * SECURITY: Settings are external input and must be validated!
   * Schema validation prevents injection attacks and type mismatches.
   *
   * @param namespace - Module ID
   * @param key - Setting key
   * @param schema - Valibot schema for runtime validation
   * @returns Result with validated setting value or FoundryError
   *
   * @example
   * ```typescript
   * import * as v from "valibot";
   *
   * const LogLevelSchema = v.picklist([0, 1, 2, 3]);
   * const result = settings.get("my-module", "logLevel", LogLevelSchema);
   * if (result.ok) {
   *   console.log(`Validated log level: ${result.value}`);
   * }
   * ```
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, FoundryError>;

  /**
   * Sets the value of a setting.
   * Updates are persisted to database and trigger onChange callbacks.
   *
   * @param namespace - Module ID
   * @param key - Setting key
   * @param value - New value
   * @returns Async Result indicating success or FoundryError
   *
   * @example
   * ```typescript
   * const result = await settings.set("my-module", "myKey", 123);
   * if (result.ok) {
   *   console.log("Setting updated");
   * }
   * ```
   */
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>>;
}
