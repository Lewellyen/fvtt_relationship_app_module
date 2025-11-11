import type { Result } from "@/types/result";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { tryCatch, err, fromPromise } from "@/utils/functional/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { validateSettingConfig } from "@/foundry/validation/schemas";
import * as v from "valibot";

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
        // Type-safe cast for dynamic namespaces: Foundry's Settings API supports module namespaces, but fvtt-types restricts namespace to "core" only
        /* type-coverage:ignore-next-line -- Type widening: fvtt-types restrictive definition, cast safe for dynamic module namespaces */
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

  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, FoundryError> {
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return tryCatch(
      () => {
        /* type-coverage:ignore-next-line -- Type widening: fvtt-types restrictive definition, cast safe for dynamic module namespaces */
        const rawValue = (game.settings.get as (ns: string, key: string) => unknown)(
          namespace,
          key
        );

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
          /* type-coverage:ignore-next-line -- Runtime type check ensures FoundryError structure before cast */
          return error as FoundryError;
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
    if (typeof game === "undefined" || !game?.settings) {
      return err(createFoundryError("API_NOT_AVAILABLE", "Foundry settings API not available"));
    }

    return fromPromise(
      /* type-coverage:ignore-next-line -- Type widening: fvtt-types restrictive definition, cast safe for dynamic module namespaces */
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

  /* c8 ignore start -- Lifecycle: No resources to clean up, no-op method */
  dispose(): void {
    // No resources to clean up
  }
  /* c8 ignore stop */
}
