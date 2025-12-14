import type { Result } from "@/domain/types/result";
import type { FoundrySettings, SettingConfig } from "../../interfaces/FoundrySettings";
import type { FoundryError } from "../../errors/FoundryErrors";
import type { IFoundrySettingsAPI } from "../../api/foundry-api.interface";
import { tryCatch, err, fromPromise } from "@/domain/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { validateSettingConfig } from "../../validation/schemas";
import { castFoundrySettingsApi, castFoundryError } from "../../runtime-casts";
import * as v from "valibot";

/**
 * v13 implementation of FoundrySettings interface.
 * Encapsulates Foundry v13-specific settings API access.
 *
 * Supports all three setting scopes:
 * - world: Shared across all users in the world
 * - client: Browser/device-specific
 * - user: User-specific within a world (new in v13)
 *
 * Uses dependency injection for Foundry APIs to improve testability.
 */
export class FoundryV13SettingsPort implements FoundrySettings {
  #disposed = false;

  constructor(private readonly foundryAPI: IFoundrySettingsAPI | null) {}

  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot register setting on disposed port", {
          namespace,
          key,
        })
      );
    }
    // Validate config before attempting registration
    const configValidation = validateSettingConfig(namespace, key, config);
    if (!configValidation.ok) {
      return err(configValidation.error);
    }

    if (!this.foundryAPI) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    const api = this.foundryAPI;
    return tryCatch(
      () => {
        api.register(namespace, key, config);
        return undefined;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to register setting ${namespace}.${key}`,
          { namespace, key },
          error
        )
    );
  }

  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, FoundryError> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot get setting on disposed port", { namespace, key })
      );
    }
    if (!this.foundryAPI) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    const api = this.foundryAPI;
    return tryCatch(
      () => {
        const rawValue = api.get(namespace, key);

        // Runtime validation with Valibot
        const parseResult = v.safeParse(schema, rawValue);

        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Setting ${namespace}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { namespace, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }

        return parseResult.output;
      },
      (error) => {
        // Check if it's a VALIDATION_FAILED error (from our own validation)
        // These should be preserved as-is
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "VALIDATION_FAILED"
        ) {
          return castFoundryError(error);
        }
        // All other errors (including API errors) should be wrapped as OPERATION_FAILED
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get setting ${namespace}.${key}`,
          { namespace, key },
          error
        );
      }
    );
  }

  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot set setting on disposed port", { namespace, key })
      );
    }
    if (!this.foundryAPI) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return fromPromise(
      this.foundryAPI.set(namespace, key, value).then(() => undefined),
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to set setting ${namespace}.${key}`,
          { namespace, key, value },
          error
        )
    );
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}

/**
 * Factory function to create FoundryV13SettingsPort instance for production use.
 * Injects real Foundry settings API.
 *
 * @returns FoundryV13SettingsPort instance
 */
export function createFoundryV13SettingsPort(): FoundryV13SettingsPort {
  // Create port even if API is not available - port will return API_NOT_AVAILABLE errors
  if (typeof game === "undefined" || game === null || game.settings === undefined) {
    return new FoundryV13SettingsPort(null);
  }

  // Try to cast game.settings if it exists (even if it's null or invalid)
  // This allows castFoundrySettingsApi to handle the validation and return appropriate errors
  const settingsResult = castFoundrySettingsApi(game.settings);
  if (!settingsResult.ok) {
    // Return port with error-throwing API when cast fails - will return OPERATION_FAILED errors
    const castError = settingsResult.error;
    return new FoundryV13SettingsPort({
      register: () => {
        throw castError;
      },
      get: () => {
        throw castError;
      },
      set: async () => {
        throw castError;
      },
    });
  }
  const settings = settingsResult.value;

  return new FoundryV13SettingsPort({
    register: <T>(namespace: string, key: string, config: SettingConfig<T>) => {
      settings.register(namespace, key, config);
    },
    get: <T>(namespace: string, key: string) => {
      return settings.get<T>(namespace, key);
    },
    set: (namespace: string, key: string, value: unknown) => {
      return settings.set(namespace, key, value).then(() => undefined);
    },
  });
}
