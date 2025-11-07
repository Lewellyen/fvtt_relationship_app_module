import type { Result } from "@/types/result";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { tryCatch, err, fromPromise } from "@/utils/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { validateSettingConfig } from "@/foundry/validation/schemas";

/**
 * Type-safe interface for Foundry Settings with dynamic namespaces.
 * Avoids 'any' while working around fvtt-types namespace restrictions.
 */
interface DynamicSettingsApi {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): void;
  get<T>(namespace: string, key: string): T;
  set<T>(namespace: string, key: string, value: T): Promise<T>;
}

/**
 * v13 implementation of FoundrySettings interface.
 * Encapsulates Foundry v13-specific settings API access.
 *
 * Supports all three setting scopes:
 * - world: Shared across all users in the world
 * - client: Browser/device-specific
 * - user: User-specific within a world (new in v13)
 */
export class FoundrySettingsPortV13 implements FoundrySettings {
  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    // Validate config before attempting registration
    const configValidation = validateSettingConfig(namespace, key, config);
    /* c8 ignore start -- Error propagation: validateSettingConfig tested in schemas.test.ts */
    if (!configValidation.ok) {
      return err(configValidation.error);
    }
    /* c8 ignore stop */

    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return tryCatch(
      () => {
        // Type-safe cast for dynamic namespaces
        // Foundry's Settings API supports module namespaces, but fvtt-types
        // restricts namespace to "core" only
        /* type-coverage:ignore-next-line */
        (game.settings as DynamicSettingsApi).register(namespace, key, config);
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

  get<T>(namespace: string, key: string): Result<T, FoundryError> {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return tryCatch(
      () =>
        /* type-coverage:ignore-next-line */
        (game.settings.get as (ns: string, key: string) => unknown)(namespace, key) as T,
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to get setting ${namespace}.${key}`,
          { namespace, key },
          error
        )
    );
  }

  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>> {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return fromPromise(
      /* type-coverage:ignore-next-line */
      (game.settings.set as (ns: string, key: string, val: unknown) => Promise<unknown>)(
        namespace,
        key,
        value
      ).then(() => undefined),
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to set setting ${namespace}.${key}`,
          { namespace, key, value },
          error
        )
    );
  }
}
