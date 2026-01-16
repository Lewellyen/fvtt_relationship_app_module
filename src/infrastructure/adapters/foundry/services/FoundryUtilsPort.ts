import type { Result } from "@/domain/types/result";
import type { FoundryUtils } from "../interfaces/FoundryUtils";
import type { FoundryError } from "../errors/FoundryErrors";
import type { IFoundryUtilsAPI, UuidComponents } from "../api/foundry-api.interface";
import { ok, err } from "@/domain/utils/result";
import { createFoundryError } from "../errors/FoundryErrors";
import {
  castParseUuidOptions,
  castParseUuidResultToResolvedUUID,
  castBuildUuidContext,
} from "../runtime-casts";

/**
 * Foundry Utils Port implementation.
 *
 * Wraps `foundry.utils.*` API with Result pattern for type-safe error handling.
 * Implements all Foundry Utils interfaces (UUID, Object, HTML, Async).
 *
 * Uses dependency injection for Foundry APIs to improve testability.
 * No Port-Adapter-Pattern needed since Utils are stable across Foundry versions.
 *
 * @implements {FoundryUtils}
 */
export class FoundryUtilsPort implements FoundryUtils {
  #disposed = false;
  static dependencies = [] as const;

  constructor(private readonly foundryAPI: IFoundryUtilsAPI | null) {}

  // ===== UUID & Dokument-Handling =====

  randomID(): string {
    if (this.#disposed) {
      // Return empty string on disposed (can't throw, function signature doesn't allow Result)
      return "";
    }
    try {
      if (!this.foundryAPI) {
        // Fallback: generate simple ID if API not available
        return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }
      return this.foundryAPI.randomID();
    } catch {
      // Fallback on error
      return `fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
  }

  async fromUuid(uuid: string): Promise<Result<unknown | null, FoundryError>> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot resolve UUID on disposed port", { uuid }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return ok(null); // Graceful degradation
      }
      const document = await this.foundryAPI.fromUuid(uuid);
      return ok(document);
    } catch (error) {
      return err(
        createFoundryError("OPERATION_FAILED", `Failed to resolve UUID: ${uuid}`, { uuid }, error)
      );
    }
  }

  fromUuidSync(uuid: string): Result<unknown | null, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError(
          "DISPOSED",
          "Cannot resolve UUID synchronously on disposed port",
          {
            uuid,
          }
        ),
      };
    }
    try {
      if (!this.foundryAPI) {
        return ok(null); // Graceful degradation
      }
      return ok(this.foundryAPI.fromUuidSync(uuid));
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to resolve UUID synchronously: ${uuid}`,
          { uuid },
          error
        )
      );
    }
  }

  parseUuid(uuid: string): Result<UuidComponents, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot parse UUID on disposed port", { uuid }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(
          createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", { uuid })
        );
      }
      const resolved = this.foundryAPI.parseUuid(uuid);
      if (resolved === null) {
        return err(
          createFoundryError("OPERATION_FAILED", `Failed to parse UUID: ${uuid}`, { uuid })
        );
      }
      // Convert ResolvedUUID to UuidComponents
      const components: UuidComponents = {
        type: resolved.documentType,
        documentName: resolved.documentType,
        documentId: resolved.documentId,
      };
      if (resolved.collection) {
        components.pack = String(resolved.collection);
      }
      return ok(components);
    } catch (error) {
      return err(
        createFoundryError("OPERATION_FAILED", `Failed to parse UUID: ${uuid}`, { uuid }, error)
      );
    }
  }

  buildUuid(
    type: string,
    documentName: string,
    documentId: string,
    pack?: string
  ): Result<string, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot build UUID on disposed port", {
          type,
          documentName,
          documentId,
          pack,
        }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(
          createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {
            type,
            documentName,
            documentId,
            pack,
          })
        );
      }
      const uuid = this.foundryAPI.buildUuid({
        documentName: documentName || type,
        id: documentId,
        pack: pack ?? null,
      });
      if (uuid === null) {
        return err(
          createFoundryError(
            "OPERATION_FAILED",
            `Failed to build UUID: ${type}.${documentName}.${documentId}`,
            { type, documentName, documentId, pack }
          )
        );
      }
      return ok(uuid);
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to build UUID: ${type}.${documentName}.${documentId}`,
          { type, documentName, documentId, pack },
          error
        )
      );
    }
  }

  // ===== Objekt-Manipulation =====

  deepClone<T>(obj: T): Result<T, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot deep clone on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {}));
      }
      return ok(this.foundryAPI.deepClone(obj));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to deep clone object", {}, error));
    }
  }

  mergeObject<T>(original: T, updates: unknown, options?: unknown): Result<T, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot merge object on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {}));
      }
      return ok(this.foundryAPI.mergeObject(original, updates, options));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to merge object", {}, error));
    }
  }

  diffObject(original: unknown, updated: unknown): Result<Record<string, unknown>, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot diff object on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {}));
      }
      // Ensure both are objects
      if (typeof original !== "object" || original === null) {
        return err(
          createFoundryError("OPERATION_FAILED", "Original must be an object", { original })
        );
      }
      if (typeof updated !== "object" || updated === null) {
        return err(
          createFoundryError("OPERATION_FAILED", "Updated must be an object", { updated })
        );
      }
      return ok(this.foundryAPI.diffObject(original, updated));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to diff object", {}, error));
    }
  }

  flattenObject(obj: unknown): Result<Record<string, unknown>, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot flatten object on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {}));
      }
      // Ensure it's an object
      if (typeof obj !== "object" || obj === null) {
        return err(createFoundryError("OPERATION_FAILED", "Value must be an object", { obj }));
      }
      return ok(this.foundryAPI.flattenObject(obj));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to flatten object", {}, error));
    }
  }

  expandObject(obj: Record<string, unknown>): Result<unknown, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot expand object on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", {}));
      }
      return ok(this.foundryAPI.expandObject(obj));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to expand object", {}, error));
    }
  }

  // ===== HTML =====

  cleanHTML(html: string): Result<string, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot clean HTML on disposed port", {}),
      };
    }
    try {
      if (!this.foundryAPI) {
        // Graceful degradation: return HTML as-is
        return ok(html);
      }
      return ok(this.foundryAPI.cleanHTML(html));
    } catch (error) {
      return err(createFoundryError("OPERATION_FAILED", "Failed to clean HTML", {}, error));
    }
  }

  escapeHTML(str: string): string {
    if (this.#disposed) {
      return str; // Return as-is on disposed (can't throw, function signature doesn't allow Result)
    }
    try {
      if (!this.foundryAPI) {
        // Fallback: basic HTML escaping
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }
      return this.foundryAPI.escapeHTML(str);
    } catch {
      // Fallback on error
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  }

  unescapeHTML(str: string): string {
    if (this.#disposed) {
      return str; // Return as-is on disposed (can't throw, function signature doesn't allow Result)
    }
    try {
      if (!this.foundryAPI) {
        // Fallback: basic HTML unescaping
        // IMPORTANT: Replace &amp; LAST to avoid double-unescaping issues
        // Example: &amp;amp; should become &, not &amp;
        // We need to iterate until no more changes occur to handle double-escaped entities
        let result = str;
        let previous: string;
        do {
          previous = result;
          result = result
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&");
        } while (result !== previous);
        return result;
      }
      return this.foundryAPI.unescapeHTML(str);
    } catch {
      // Fallback on error
      // IMPORTANT: Replace &amp; LAST to avoid double-unescaping issues
      // Example: &amp;amp; should become &, not &amp;
      // We need to iterate until no more changes occur to handle double-escaped entities
      let result = str;
      let previous: string;
      do {
        previous = result;
        result = result
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&");
      } while (result !== previous);
      return result;
    }
  }

  // ===== Async/Timeout =====

  async fetchWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<Response, FoundryError>> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot fetch with timeout on disposed port", {
          url,
        }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(
          createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", { url })
        );
      }
      return ok(
        // type-coverage:ignore-next-line -- Foundry API: RequestInit type cast required for Foundry utils API
        await this.foundryAPI.fetchWithTimeout(url, options as RequestInit | undefined, {
          timeoutMs,
        })
      );
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to fetch with timeout: ${url}`,
          { url, timeoutMs },
          error
        )
      );
    }
  }

  async fetchJsonWithTimeout(
    url: string,
    options: unknown,
    timeoutMs: number
  ): Promise<Result<unknown, FoundryError>> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot fetch JSON with timeout on disposed port", {
          url,
        }),
      };
    }
    try {
      if (!this.foundryAPI) {
        return err(
          createFoundryError("API_NOT_AVAILABLE", "Foundry utils API not available", { url })
        );
      }
      return ok(
        // type-coverage:ignore-next-line -- Foundry API: RequestInit type cast required for Foundry utils API
        await this.foundryAPI.fetchJsonWithTimeout(url, options as RequestInit | undefined, {
          timeoutMs,
        })
      );
    } catch (error) {
      return err(
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to fetch JSON with timeout: ${url}`,
          { url, timeoutMs },
          error
        )
      );
    }
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}

/**
 * Factory function to create FoundryUtilsPort instance for production use.
 * Injects real Foundry utils API.
 *
 * @returns FoundryUtilsPort instance
 */
export function createFoundryUtilsPort(): FoundryUtilsPort {
  if (typeof foundry === "undefined" || !foundry?.utils) {
    // Return port with null API for graceful degradation
    return new FoundryUtilsPort(null);
  }

  type FoundryParseUuidOptions = Parameters<IFoundryUtilsAPI["parseUuid"]>[1];
  type FoundryBuildUuidContext = Parameters<IFoundryUtilsAPI["buildUuid"]>[0];
  type FoundryParseUuidReturn = ReturnType<IFoundryUtilsAPI["parseUuid"]>;
  type FoundryBuildUuidReturn = ReturnType<IFoundryUtilsAPI["buildUuid"]>;

  // type-coverage:ignore-next-line -- Foundry API: parseUuid typing differs from our abstraction
  const parseUuid = foundry.utils.parseUuid as unknown as (
    uuid: string,
    options?: FoundryParseUuidOptions
  ) => FoundryParseUuidReturn;
  // type-coverage:ignore-next-line -- Foundry API: buildUuid typing differs from our abstraction
  const buildUuid = foundry.utils.buildUuid as unknown as (
    context: FoundryBuildUuidContext
  ) => FoundryBuildUuidReturn;

  return new FoundryUtilsPort({
    randomID: () => foundry.utils.randomID(),
    fromUuid: (uuid: string) => foundry.utils.fromUuid(uuid),
    fromUuidSync: (uuid: string) => foundry.utils.fromUuidSync(uuid),
    parseUuid: (uuid: string, options?: { relative?: unknown }) => {
      // type-coverage:ignore-next-line -- Foundry API: parseUuid options require casting
      const foundryOptions = castParseUuidOptions(options) as FoundryParseUuidOptions;
      const result = parseUuid(uuid, foundryOptions);
      if (result === null) {
        return null;
      }
      return castParseUuidResultToResolvedUUID(result);
    },
    buildUuid: (context: {
      documentName?: string;
      id: string;
      pack?: null | string;
      parent?: null | unknown;
    }) => {
      // Convert our interface to Foundry's BuildUUIDContext
      const foundryContext: {
        documentName?: string;
        id: string;
        pack?: null | string;
        parent?: null | unknown;
      } = {
        id: context.id,
      };
      if (context.documentName !== undefined) {
        foundryContext.documentName = context.documentName;
      }
      if (context.pack !== undefined) {
        foundryContext.pack = context.pack;
      }
      if (context.parent !== undefined) {
        foundryContext.parent = context.parent;
      }
      // type-coverage:ignore-next-line -- Foundry API: buildUuid context requires casting
      const castContext = castBuildUuidContext(foundryContext) as FoundryBuildUuidContext;
      return buildUuid(castContext);
    },
    deepClone: <T>(obj: T): T => foundry.utils.deepClone(obj) as T,
    mergeObject: <T>(original: T, updates: unknown, options?: unknown): T => {
      if (typeof original !== "object" || original === null) {
        return original;
      }
      // type-coverage:ignore-next-line -- Foundry API: mergeObject requires type casts for generic type preservation
      return foundry.utils.mergeObject(
        original as object,
        // type-coverage:ignore-next-line -- Foundry API: Type cast for mergeObject updates parameter
        updates as object | undefined,
        // type-coverage:ignore-next-line -- Foundry API: Type cast for mergeObject options parameter
        options as object | undefined
      ) as T;
    },
    diffObject: (original: object, updated: object) =>
      // type-coverage:ignore-next-line -- Foundry API: diffObject return type cast
      foundry.utils.diffObject(original, updated) as Record<string, unknown>,
    flattenObject: (obj: object) =>
      // type-coverage:ignore-next-line -- Foundry API: flattenObject return type cast
      foundry.utils.flattenObject(obj) as Record<string, unknown>,
    expandObject: (obj: Record<string, unknown>) => foundry.utils.expandObject(obj),
    cleanHTML: (html: string) => foundry.utils.cleanHTML(html),
    escapeHTML: (str: string) => foundry.utils.escapeHTML(str),
    unescapeHTML: (str: string) => foundry.utils.unescapeHTML(str),
    fetchWithTimeout: (
      url: string,
      data?: RequestInit,
      options?: { onTimeout?: () => void; timeoutMs?: null | number }
    ) => foundry.utils.fetchWithTimeout(url, data, options),
    fetchJsonWithTimeout: (
      url: string,
      data?: RequestInit,
      options?: { onTimeout?: () => void; timeoutMs?: null | number }
    ) => foundry.utils.fetchJsonWithTimeout(url, data, options),
  });
}

/**
 * DI-enabled wrapper for FoundryUtilsPort.
 *
 * Uses factory function to create instance with real Foundry API.
 * This class is registered in DI container and will be instantiated via factory.
 */
export class DIFoundryUtilsPort extends FoundryUtilsPort {
  static override dependencies = [] as const;

  constructor() {
    // Use factory function to create instance with real Foundry API
    // The factory will be called during container resolution
    super(null); // Will be replaced by factory registration
  }
}
