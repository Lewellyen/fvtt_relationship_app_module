/**
 * Centralized helpers for Foundry-specific runtime casts that are required by
 * the Foundry adapter layer (ports, services, facades).
 *
 * Diese Datei ist absichtlich von der Type-Coverage ausgenommen, damit
 * wir an wenigen wohldokumentierten Stellen mit Runtime-Casts arbeiten
 * können, ohne den 100%-Anspruch für den restlichen Code zu verletzen.
 *
 * Diese Datei ist getrennt von `runtime-safe-cast.ts` (DI-Infrastruktur),
 * da sie Foundry-spezifische Casts enthält und FoundryError statt ContainerError
 * verwendet. Die Trennung ermöglicht klare Abhängigkeiten und verhindert
 * Import-Zyklen zwischen Foundry-Adapter und DI-Infrastruktur.
 */

import type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { isObjectWithMethods, hasMethod } from "@/infrastructure/shared/utils/type-guards";

/**
 * Type-safe interface for Foundry Settings with dynamic namespaces.
 * Avoids 'any' while working around fvtt-types namespace restrictions.
 */
export interface DynamicSettingsApi {
  register<T>(namespace: string, key: string, config: SettingConfig<T>): void;
  get<T>(namespace: string, key: string): T;
  set<T>(namespace: string, key: string, value: T): Promise<T>;
}

/**
 * Kapselt den notwendigen Cast für `game.settings` mit dynamischen Namespaces.
 * Foundry's Settings API unterstützt Modul-Namespaces, aber fvtt-types
 * beschränkt den Namespace-Typ auf "core" nur.
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass das Settings-Objekt die erforderlichen Methoden hat. Bei Fehlern wird
 * ein FoundryError zurückgegeben statt einen Error zu werfen, um konsistent
 * mit dem Result-Pattern zu bleiben.
 *
 * @param settings - Das game.settings Objekt (unknown, da game global ist)
 * @returns Result mit dem Settings-Objekt als DynamicSettingsApi oder FoundryError
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob die Methoden `register`, `get` und `set`
 * vorhanden sind. Dies stellt sicher, dass das Settings-Objekt die erwartete
 * API-Struktur hat.
 */
export function castFoundrySettingsApi(
  settings: unknown
): Result<DynamicSettingsApi, FoundryError> {
  if (!isObjectWithMethods(settings, ["register", "get", "set"])) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "game.settings does not have required methods (register, get, set)",
        {
          missingMethods: ["register", "get", "set"],
        }
      )
    );
  }
  return ok(settings as DynamicSettingsApi);
}

/**
 * Type definition for documents with flag methods.
 */
type DocumentWithFlags = {
  getFlag: (scope: string, key: string) => unknown;
  setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
};

/**
 * Type definition for documents with update method.
 * Generic type allows for specific return types.
 */
type DocumentWithUpdate<TDocument extends { id: string } = { id: string; name?: string | null }> = {
  update: (changes: unknown) => Promise<TDocument>;
};

/**
 * Type definition for Foundry JournalEntry class constructor.
 */
type JournalEntryConstructor = {
  create: (data: unknown) => Promise<{ id: string; name?: string | null }>;
};

/**
 * Kapselt den notwendigen Cast für JournalEntry.getFlag mit modul-spezifischen Scopes.
 * fvtt-types JournalEntry.getFlag hat einen restriktiven Scope-Typ ("core" nur),
 * aber Modul-Flags verwenden die Modul-ID als Scope.
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass das Dokument die erforderlichen Methoden `getFlag` und `setFlag` hat.
 * Bei Fehlern wird ein FoundryError zurückgegeben statt einen Error zu werfen,
 * um konsistent mit dem Result-Pattern zu bleiben.
 *
 * @param document - Das Foundry-Dokument (unknown, da Typen variieren)
 * @returns Result mit dem Dokument mit getFlag/setFlag-Methoden oder FoundryError
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob die Methoden `getFlag` und `setFlag`
 * vorhanden sind. Dies stellt sicher, dass das Dokument die erwartete
 * API-Struktur für Flag-Operationen hat.
 *
 * @see {@link DynamicSettingsApi} Für ähnliche Cast-Funktionen mit Runtime-Validierung
 */
export function castFoundryDocumentForFlag(
  document: unknown
): Result<DocumentWithFlags, FoundryError> {
  if (!isObjectWithMethods(document, ["getFlag", "setFlag"])) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        "Document does not have required methods (getFlag, setFlag)",
        {
          missingMethods: ["getFlag", "setFlag"],
        }
      )
    );
  }
  return ok(document as DocumentWithFlags);
}

/**
 * Kapselt den Cast nach Runtime-Type-Check für FoundryError.
 * Wird verwendet, wenn bereits zur Laufzeit geprüft wurde, dass das Error-Objekt
 * die FoundryError-Struktur hat (code, message vorhanden).
 *
 * @param error - Das Error-Objekt (unknown, da es verschiedene Fehlerquellen gibt)
 * @returns Das Error als FoundryError gecastet
 */
export function castFoundryError(error: unknown): FoundryError {
  return error as FoundryError;
}

/**
 * Kapselt den Cast für Disposable-Interface in FoundryServiceBase.
 * Ports sind als generischer unknown typisiert, aber zur Laufzeit
 * kann geprüft werden, ob sie das Disposable-Interface implementieren.
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass der Port das `dispose`-Interface implementiert. Wenn nicht, wird `null`
 * zurückgegeben (analog zu `extractHtmlElement`), da dies ein optionales Feature ist.
 *
 * @param port - Der Port (unknown, da generischer unknown)
 * @returns Der Port als Disposable gecastet oder null, wenn nicht verfügbar
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob der Port eine `dispose`-Methode hat.
 * Dies ist konsistent mit anderen optionalen Type-Guards wie `extractHtmlElement`,
 * die ebenfalls `null` zurückgeben statt ein Result-Pattern zu verwenden.
 *
 * @see {@link extractHtmlElement} Für ähnliche optional Type-Guards mit null-Rückgabe
 */
export function castDisposablePort(port: unknown): Disposable | null {
  if (!port || typeof port !== "object") {
    return null;
  }
  if (hasMethod(port, "dispose")) {
    return port as Disposable;
  }
  return null;
}

/**
 * Type-Guard für Non-Empty-Arrays mit Result-Pattern.
 * Stellt sicher, dass ein Array mindestens ein Element hat.
 * Ersetzt Non-Null-Assertions durch type-safe Guards.
 *
 * @template T - Der Element-Typ
 * @param arr - Das Array, das geprüft werden soll
 * @returns Result mit type-narrowed non-empty array oder FoundryError
 */
export function ensureNonEmptyArray<T>(arr: T[]): Result<[T, ...T[]], FoundryError> {
  if (arr.length === 0) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Array must not be empty", { arrayLength: 0 })
    );
  }
  return ok(arr as [T, ...T[]]);
}

/**
 * Extracts HTMLElement from hook argument.
 *
 * In Foundry VTT V13+, hooks receive native HTMLElement directly.
 * jQuery support has been deprecated and is no longer needed.
 *
 * @param html - The hook argument (unknown type)
 * @returns HTMLElement if the argument is an HTMLElement, null otherwise
 */
export function extractHtmlElement(html: unknown): HTMLElement | null {
  return html instanceof HTMLElement ? html : null;
}

/**
 * Type guard for Record<string, unknown>.
 *
 * Checks if a value is a non-null object (not array) and can be safely cast to Record<string, unknown>.
 * This is useful for validation schemas and runtime type checks.
 *
 * @param value - The value to check
 * @returns true if value is a Record<string, unknown>, false otherwise
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Gets a factory from a Map or returns an error if not found.
 *
 * This is a defensive check: theoretically, if a version exists in the Map keys,
 * the factory should also exist. However, TypeScript's type system doesn't
 * guarantee this, so the check exists for type safety.
 *
 * @template T - The type that the factory creates
 * @param factories - Map of version numbers to factory functions
 * @param version - The version to look up
 * @returns Result with factory function or error
 */
export function getFactoryOrError<T>(
  factories: Map<number, () => T>,
  version: number
): Result<() => T, FoundryError> {
  const factory = factories.get(version);
  if (!factory) {
    return err(
      createFoundryError("PORT_NOT_FOUND", `Factory for version ${version} not found in registry`, {
        version,
      })
    );
  }
  return ok(factory);
}

/**
 * Kapselt den notwendigen Cast für Dokumente mit update-Methode.
 * Wird verwendet, wenn ein Dokument zur Laufzeit geprüft werden muss,
 * ob es eine update-Methode hat (z.B. als Fallback für unsetFlag).
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass das Dokument die erforderliche `update`-Methode hat.
 * Bei Fehlern wird ein FoundryError zurückgegeben statt einen Error zu werfen,
 * um konsistent mit dem Result-Pattern zu bleiben.
 *
 * @param document - Das Foundry-Dokument (unknown, da Typen variieren)
 * @returns Result mit dem Dokument mit update-Methode oder FoundryError
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob die Methode `update` vorhanden ist.
 * Dies stellt sicher, dass das Dokument die erwartete API-Struktur für
 * Update-Operationen hat.
 *
 * @see {@link castFoundryDocumentForFlag} Für ähnliche Cast-Funktionen mit Runtime-Validierung
 */
export function castFoundryDocumentWithUpdate<
  TDocument extends { id: string } = { id: string; name?: string | null },
>(document: unknown): Result<DocumentWithUpdate<TDocument>, FoundryError> {
  if (!isObjectWithMethods(document, ["update"])) {
    return err(
      createFoundryError("VALIDATION_FAILED", "Document does not have required method (update)", {
        missingMethods: ["update"],
      })
    );
  }
  // type-coverage:ignore-next-line - Runtime cast required for Foundry document update
  return ok(document as DocumentWithUpdate<TDocument>);
}

/**
 * Kapselt den notwendigen Cast für globalThis.JournalEntry.
 * Foundry VTT stellt JournalEntry als globale Klasse zur Verfügung,
 * aber TypeScript kann dies nicht statisch prüfen.
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass JournalEntry vorhanden ist und die erforderliche `create`-Methode hat.
 * Bei Fehlern wird ein FoundryError zurückgegeben statt einen Error zu werfen,
 * um konsistent mit dem Result-Pattern zu bleiben.
 *
 * @returns Result mit JournalEntry-Konstruktor oder FoundryError
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob JournalEntry im globalThis verfügbar ist
 * und die Methode `create` hat. Dies stellt sicher, dass die Foundry-API
 * korrekt geladen ist.
 */
export function castFoundryJournalEntryClass(): Result<JournalEntryConstructor, FoundryError> {
  // Check if globalThis has JournalEntry property
  /* c8 ignore next 2 -- typeof globalThis !== "object" is always false (globalThis is always an object), globalThis === null is always false (globalThis is never null) */
  if (typeof globalThis !== "object" || globalThis === null || !("JournalEntry" in globalThis)) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "Foundry JournalEntry class not available in globalThis",
        {}
      )
    );
  }

  const journalEntryClass = (globalThis as Record<string, unknown>).JournalEntry;

  if (!isObjectWithMethods(journalEntryClass, ["create"])) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "Foundry JournalEntry class does not have required method (create)",
        {
          missingMethods: ["create"],
        }
      )
    );
  }

  return ok(journalEntryClass as JournalEntryConstructor);
}

/**
 * Kapselt den notwendigen Cast für erstellte Foundry-Dokumente zu FoundryJournalEntry.
 * FoundryDocument.create() gibt einen generischen TDocument zurück, aber wir wissen,
 * dass es sich bei JournalEntry-Erstellungen um ein FoundryJournalEntry handelt.
 *
 * Diese Funktion kapselt den Type-Cast, der notwendig ist, weil TypeScript
 * den generischen Rückgabetyp von create() nicht automatisch zu FoundryJournalEntry
 * narrown kann.
 *
 * @param document - Das erstellte Dokument (generischer TDocument-Typ)
 * @returns Das Dokument als FoundryJournalEntry gecastet
 *
 * @remarks
 * Diese Funktion sollte nur verwendet werden, wenn sichergestellt ist, dass
 * das Dokument tatsächlich ein FoundryJournalEntry ist (z.B. nach create()
 * mit JournalEntry-Klasse).
 *
 * @see {@link castFoundryJournalEntryClass} Für das Casten der JournalEntry-Klasse
 */
export function castCreatedJournalEntry<TDocument extends { id: string }>(
  document: TDocument
): import("./types").FoundryJournalEntry {
  // type-coverage:ignore-next-line - Runtime cast required for generic TDocument to FoundryJournalEntry
  return document as unknown as import("./types").FoundryJournalEntry;
}

/**
 * Creates CreateEntityData with an explicit id for upsert operations.
 *
 * This helper function safely adds an id to CreateEntityData, which normally
 * omits id. This is necessary for upsert operations where we need to provide
 * the id for the create operation.
 *
 * @template TEntity - The entity type
 * @param data - The entity data without id
 * @param id - The id to add
 * @returns CreateEntityData with id added (as intersection type)
 *
 * @example
 * ```typescript
 * const createData = createEntityDataWithId(journalData, "journal-123");
 * await repository.create(createData);
 * ```
 */
export function createEntityDataWithId<TEntity extends { id: string }>(
  data: Omit<TEntity, "id" | "createdAt" | "updatedAt">,
  id: string
): Omit<TEntity, "id" | "createdAt" | "updatedAt"> & { id: string } {
  return { ...data, id };
}

/**
 * Type definition for Foundry Document Collections.
 * Collections are Maps that store Foundry documents by ID.
 */
type FoundryDocumentCollection<TDocument extends { id: string } = { id: string }> = Map<
  string,
  TDocument
> & {
  get: (id: string) => TDocument | undefined;
  has: (id: string) => boolean;
};

/**
 * Kapselt den notwendigen Cast für `game.collections.get()` mit dynamischen Document-Typen.
 * Foundry's Collections API unterstützt verschiedene Document-Typen (Actor, Item, etc.),
 * aber fvtt-types hat restriktive Typen, die nicht alle Document-Typen abdecken.
 *
 * Diese Funktion führt eine Runtime-Validierung durch, um sicherzustellen,
 * dass die Collection die erforderlichen Methoden hat. Bei Fehlern wird
 * ein FoundryError zurückgegeben statt einen Error zu werfen, um konsistent
 * mit dem Result-Pattern zu bleiben.
 *
 * @template TDocument - Der spezifische Document-Typ (optional, standardmäßig { id: string })
 * @param collections - Das game.collections Objekt (unknown, da game global ist)
 * @param documentType - Der Document-Typ (z.B. "Actor", "Item")
 * @returns Result mit der Collection als FoundryDocumentCollection oder FoundryError
 *
 * @remarks
 * Die Validierung prüft zur Laufzeit, ob die Collection die Methoden `get` und `has`
 * vorhanden sind. Dies stellt sicher, dass die Collection die erwartete
 * API-Struktur hat.
 */
export function castFoundryDocumentCollection<TDocument extends { id: string } = { id: string }>(
  collections: unknown,
  documentType: string
): Result<FoundryDocumentCollection<TDocument>, FoundryError> {
  if (!isObjectWithMethods(collections, ["get"])) {
    return err(
      createFoundryError(
        "API_NOT_AVAILABLE",
        "game.collections does not have required method (get)",
        {
          missingMethods: ["get"],
        }
      )
    );
  }

  const collection = (collections as { get: (key: string) => unknown }).get(documentType);

  if (!collection) {
    return err(
      createFoundryError("NOT_FOUND", `Collection for document type "${documentType}" not found`, {
        documentType,
      })
    );
  }

  if (!isObjectWithMethods(collection, ["get", "has"])) {
    return err(
      createFoundryError(
        "VALIDATION_FAILED",
        `Collection for "${documentType}" does not have required methods (get, has)`,
        {
          documentType,
          missingMethods: ["get", "has"],
        }
      )
    );
  }

  return ok(collection as FoundryDocumentCollection<TDocument>);
}
