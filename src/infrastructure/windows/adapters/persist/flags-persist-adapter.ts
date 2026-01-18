import type { IPersistAdapter } from "@/domain/windows/ports/persist-adapter-port.interface";
import type { PersistConfig, PersistMeta } from "@/domain/windows/types/persist-config.interface";
import type { PersistError } from "@/domain/windows/types/errors/persist-error.interface";
import { ok, err } from "@/domain/utils/result";
import {
  castFoundryDocumentCollection,
  castFoundryDocumentWithUpdate,
  castFoundryDocumentForFlag,
  isRecord,
} from "@/infrastructure/adapters/foundry/runtime-casts";
import { castToRecord } from "@/infrastructure/di/types/utilities/type-casts";

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

      // Type-safe cast: Use runtime cast helper for Foundry documents with update method
      const documentWithUpdateResult = castFoundryDocumentWithUpdate(doc);
      if (!documentWithUpdateResult.ok) {
        return err({
          code: "OPERATION_FAILED",
          message: `Document does not support update: ${documentWithUpdateResult.error.message}`,
          cause: documentWithUpdateResult.error,
        });
      }
      const documentWithUpdate = documentWithUpdateResult.value;

      // Foundry update: changes als erstes Argument, options als zweites
      const changes: Record<string, unknown> = {
        [`flags.${config.namespace}.${config.key}`]: data,
      };

      const options: Record<string, unknown> = {
        render: meta?.render ?? false, // Kein Rerender (in options, nicht in changes!)
        windowFrameworkOrigin: meta, // Origin-Meta für Hook-Bridge
      };

      // Foundry's update method accepts optional second parameter, but our type definition doesn't include it
      // Cast to the actual Foundry signature
      await (
        documentWithUpdate.update as (changes: unknown, options?: unknown) => Promise<unknown>
      )(changes, options);

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

      // Type-safe cast: Use runtime cast helper for Foundry documents with flag methods
      const documentResult = castFoundryDocumentForFlag(doc);
      let flags: Record<string, unknown> | undefined;

      if (documentResult.ok) {
        // Use getFlag method if available
        try {
          const flagValue = documentResult.value.getFlag(config.namespace, config.key);
          if (isRecord(flagValue)) {
            flags = flagValue;
          }
        } catch {
          // Fallback if getFlag fails
          flags = undefined;
        }
      }

      // Fallback: access flags directly from document
      if (!flags) {
        // Defensive: treat document as a record and validate the flags shape at runtime
        if (doc !== null && doc !== undefined && typeof doc === "object") {
          const docRecord = castToRecord(doc);
          const flagsValue = docRecord.flags;
          if (isRecord(flagsValue)) {
            const namespaceValue = flagsValue[config.namespace];
            if (isRecord(namespaceValue) && config.key in namespaceValue) {
              const flagValue = namespaceValue[config.key];
              if (isRecord(flagValue)) {
                flags = flagValue;
              }
            }
          }
        }
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
