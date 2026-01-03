import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import type { PersistError } from "@/domain/windows/types/errors/persist-error.interface";
import { ok, err } from "@/domain/utils/result";
import { castFoundryDocumentCollection } from "@/infrastructure/adapters/foundry/runtime-casts";

/**
 * FlagsPersistAdapter - IPersistAdapter für Flags
 */
export class FlagsPersistAdapter implements IPersistAdapter {
  async save(
    config: PersistConfig,
    data: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<import("@/domain/types/result").Result<void, PersistError>> {
    if (config.type !== "flag") {
      return err({ code: "InvalidType", message: "Not a flag persist config" });
    }

    if (!config.documentId || !config.namespace || !config.key) {
      return err({
        code: "InvalidConfig",
        message: "Flag config requires documentId, namespace, and key",
      });
    }

    try {
      if (typeof game === "undefined") {
        return err({ code: "GameNotAvailable", message: "Foundry game object not available" });
      }
      const documentType = config.documentId.split(".")[0]; // Extract type from ID like "Actor.123"
      if (!documentType) {
        return err({ code: "InvalidConfig", message: "Invalid document ID format" });
      }

      // Type-safe cast: Use runtime cast helper for Foundry collections
      const collectionResult = castFoundryDocumentCollection(game.collections, documentType);
      if (!collectionResult.ok) {
        return err({
          code: "DocumentNotFound",
          message: `Document collection not found: ${collectionResult.error.message}`,
        });
      }
      const collection = collectionResult.value;

      const doc = collection.get(config.documentId);
      if (!doc) {
        return err({
          code: "DocumentNotFound",
          message: `Document ${config.documentId} not found`,
        });
      }

      // Type-safe cast: Foundry documents have update method
      // The collection returns documents with update/getFlag methods
      // type-coverage:ignore-next-line
      const documentWithUpdate = doc as {
        id: string;
        update: (changes: unknown, options?: unknown) => Promise<unknown>;
      };

      // Foundry update: changes als erstes Argument, options als zweites
      const changes: Record<string, unknown> = {
        [`flags.${config.namespace}.${config.key}`]: data,
      };

      const options: Record<string, unknown> = {
        render: meta?.render ?? false, // Kein Rerender (in options, nicht in changes!)
        windowFrameworkOrigin: meta, // Origin-Meta für Hook-Bridge
      };

      await documentWithUpdate.update(changes, options);

      return ok(undefined);
    } catch (error) {
      return err({
        code: "SaveFailed",
        message: `Failed to save flag: ${String(error)}`,
        cause: error,
      });
    }
  }

  async load(
    config: PersistConfig
  ): Promise<import("@/domain/types/result").Result<Record<string, unknown>, PersistError>> {
    if (config.type !== "flag") {
      return err({ code: "InvalidType", message: "Not a flag persist config" });
    }

    if (!config.documentId || !config.namespace || !config.key) {
      return err({
        code: "InvalidConfig",
        message: "Flag config requires documentId, namespace, and key",
      });
    }

    try {
      if (typeof game === "undefined") {
        return err({ code: "GameNotAvailable", message: "Foundry game object not available" });
      }
      const documentType = config.documentId.split(".")[0]; // Extract type from ID like "Actor.123"
      if (!documentType) {
        return err({ code: "InvalidConfig", message: "Invalid document ID format" });
      }

      // Type-safe cast: Use runtime cast helper for Foundry collections
      const collectionResult = castFoundryDocumentCollection(game.collections, documentType);
      if (!collectionResult.ok) {
        return err({
          code: "DocumentNotFound",
          message: `Document collection not found: ${collectionResult.error.message}`,
        });
      }
      const collection = collectionResult.value;

      const doc = collection.get(config.documentId);
      if (!doc) {
        return err({
          code: "DocumentNotFound",
          message: `Document ${config.documentId} not found`,
        });
      }

      // Type-safe cast: Foundry documents have getFlag method and flags property
      // The collection returns documents with getFlag/flags methods
      const documentWithFlags = doc as {
        id: string;
        getFlag?: (scope: string, key: string) => unknown;
        flags?: Record<string, Record<string, unknown>>;
      };

      // Use getFlag method if available, otherwise access flags directly
      let flags: Record<string, unknown> | undefined;
      if (typeof documentWithFlags.getFlag === "function") {
        try {
          // type-coverage:ignore-next-line
          flags = documentWithFlags.getFlag(config.namespace, config.key) as
            | Record<string, unknown>
            | undefined;
        } catch {
          // Fallback if getFlag fails
          flags = undefined;
        }
      }

      // Fallback: access flags directly
      if (!flags) {
        const docFlags = documentWithFlags.flags?.[config.namespace];
        // Foundry flags Type-Cast ist notwendig, da Foundry-Typen nicht vollständig verfügbar sind
        // type-coverage:ignore-next-line
        flags = docFlags?.[config.key] as Record<string, unknown> | undefined;
      }

      return ok(flags || {});
    } catch (error) {
      return err({
        code: "LoadFailed",
        message: `Failed to load flag: ${String(error)}`,
        cause: error,
      });
    }
  }
}
