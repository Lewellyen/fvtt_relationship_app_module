import type { Result } from "@/domain/types/result";
import type { FoundrySettings, SettingConfig } from "../../interfaces/FoundrySettings";
import type { FoundryError } from "../../errors/FoundryErrors";
import { tryCatch, err, fromPromise } from "@/infrastructure/shared/utils/result";
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
 */
export class FoundryV13SettingsPort implements FoundrySettings {
  #disposed = false;

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

    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return settingsResult; // Propagate error
    }
    const settings = settingsResult.value;

    return tryCatch(
      () => {
        settings.register(namespace, key, config);
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
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return settingsResult; // Propagate error
    }
    const settings = settingsResult.value;

    return tryCatch(
      () => {
        const rawValue = settings.get(namespace, key);

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
        // Check if it's already a FoundryError (from validation)
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return castFoundryError(error);
        }
        // Otherwise wrap as OPERATION_FAILED
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
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    const settingsResult = castFoundrySettingsApi(game.settings);
    if (!settingsResult.ok) {
      return Promise.resolve(settingsResult); // Propagate error
    }
    const settings = settingsResult.value;

    return fromPromise(
      settings.set(namespace, key, value).then(() => undefined),
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
