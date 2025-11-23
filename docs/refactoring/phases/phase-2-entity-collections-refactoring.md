# Phase 2: Entity-Collections Refactoring

**Datum:** 2025-01-27  
**Priorität:** 🟠 HOCH  
**Geschätzter Aufwand:** 8-12 Stunden  
**Komplexität:** Mittel  
**Risiko:** Niedrig  
**Dependencies:** Phase 1 empfohlen (aber nicht zwingend)

---

## 🎯 Ziel dieser Phase

Entity-Collection-Zugriffe von direkten Foundry-Abhängigkeiten befreien und wiederverwendbar machen:

1. ✅ Generischen `PlatformEntityCollectionPort<T>` erstellen
2. ✅ Spezialisierten `JournalCollectionPort` erstellen
3. ✅ `FoundryJournalCollectionAdapter` implementieren
4. ✅ Services und Facades von `FoundryGame` entkoppeln
5. ✅ Tests ohne Foundry-Globals

---

## 📊 IST-Zustand (Probleme)

```typescript
// ❌ PROBLEM 1: Nur Journal-spezifisch, nicht wiederverwendbar
interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], Error>;
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, Error>;
  invalidateCache(): void;
}

// ❌ PROBLEM 2: Wenn Actor-Collections hinzukommen → MASSIVE DUPLIKATION!
interface FoundryGame {
  // Journals
  getJournalEntries(): Result<...>;
  getJournalEntryById(id: string): Result<...>;
  
  // Actors - DUPLIKAT-CODE!
  getActorEntries(): Result<...>;
  getActorEntryById(id: string): Result<...>;
  
  // Items - DUPLIKAT-CODE!
  getItemEntries(): Result<...>;
  getItemEntryById(id: string): Result<...>;
  
  // Scenes - DUPLIKAT-CODE!
  getSceneEntries(): Result<...>;
  getSceneEntryById(id: string): Result<...>;
}

// ❌ PROBLEM 3: Services hängen direkt von FoundryGame ab
class JournalVisibilityService {
  constructor(
    private readonly foundryGame: FoundryGame,  // ❌ Infrastructure!
  ) {}

  async getHiddenJournals(): Promise<Result<JournalEntry[], Error>> {
    const result = this.foundryGame.getJournalEntries();  // ❌ Foundry-specific
    // ...
  }
}
```

**Konsequenzen:**
- 🔴 Massive Code-Duplikation bei weiteren Entity-Typen
- 🔴 Services kennen Foundry-Details
- 🔴 Nicht wiederverwendbar für andere Plattformen
- 🔴 Tests benötigen vollständige FoundryGame-Mocks

---

## ✅ SOLL-Zustand (Ziel)

```typescript
// ✅ ZIEL 1: Generischer Port für alle Entity-Typen
interface PlatformEntityCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityCollectionError>;
  getById(id: string): Result<TEntity | null, EntityCollectionError>;
  invalidateCache(): void;
}

// ✅ ZIEL 2: Spezialisierungen nutzen Generic (KEINE Duplikation)
interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {}
interface ItemCollectionPort extends PlatformEntityCollectionPort<Item> {}

// ✅ ZIEL 3: Services nutzen Domain-Ports
class JournalVisibilityService {
  constructor(
    private readonly journalCollection: JournalCollectionPort,  // ✅ Domain Port!
  ) {}

  async getHiddenJournals(): Promise<Result<JournalEntry[], Error>> {
    const result = this.journalCollection.getAll();  // ✅ Platform-agnostic
    // ...
  }
}
```

**Vorteile:**
- ✅ Kein Duplikations-Code bei weiteren Entity-Typen
- ✅ Services sind platform-agnostisch
- ✅ Wiederverwendbar: Roll20, Fantasy Grounds, CSV
- ✅ Tests mit einfachen Mock-Ports

---

## 📋 Detaillierte Schritte

### Step 1: Ordnerstruktur erstellen

```bash
mkdir -p src/domain/ports/collections
mkdir -p src/infrastructure/adapters/foundry/collection-adapters
```

**Erwartetes Ergebnis:**
```
src/
├─ domain/
│   └─ ports/
│       ├─ events/          (aus Phase 1)
│       └─ collections/     (NEU)
└─ infrastructure/
    └─ adapters/
        └─ foundry/
            ├─ event-adapters/         (aus Phase 1)
            └─ collection-adapters/    (NEU)
```

---

### Step 2: Generischen Basis-Port erstellen

**Datei:** `src/domain/ports/collections/platform-entity-collection-port.interface.ts`

```typescript
import type { Result } from "@/domain/types/result";

/**
 * Generic port for entity collection access.
 * 
 * Provides CRUD operations for any entity type (Journal, Actor, Item, Scene...).
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 * 
 * @template TEntity - The entity type this collection manages
 * 
 * @example
 * ```typescript
 * // Journal Collection
 * interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
 * 
 * // Actor Collection
 * interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {}
 * ```
 */
export interface PlatformEntityCollectionPort<TEntity> {
  /**
   * Get all entities in the collection.
   * 
   * Platform mappings:
   * - Foundry: game.journal.contents, game.actors.contents
   * - Roll20: findObjs({_type: "handout"}), findObjs({_type: "character"})
   * - CSV: readdir + parse all files
   * 
   * @returns All entities or error
   */
  getAll(): Result<TEntity[], EntityCollectionError>;

  /**
   * Get a specific entity by its ID.
   * 
   * Platform mappings:
   * - Foundry: game.journal.get(id), game.actors.get(id)
   * - Roll20: getObj("handout", id), getObj("character", id)
   * - CSV: readFile(id.json) + parse
   * 
   * @param id - Entity ID
   * @returns Entity or null if not found, or error
   */
  getById(id: string): Result<TEntity | null, EntityCollectionError>;

  /**
   * Invalidate any cached collection data.
   * 
   * Forces next getAll() call to fetch fresh data from platform.
   * Some platforms (like Roll20) might not cache, making this a no-op.
   */
  invalidateCache(): void;
}

/**
 * Platform-agnostic error for entity collection operations.
 */
export interface EntityCollectionError {
  code: 
    | "COLLECTION_NOT_AVAILABLE"      // Platform not initialized
    | "ENTITY_NOT_FOUND"               // Specific entity not found
    | "INVALID_ENTITY_DATA"            // Entity data corrupted
    | "PLATFORM_ERROR";                // Generic platform error
  message: string;
  details?: unknown;
}
```

**Erfolgskriterien:**
- ✅ Interface ist generisch (`<TEntity>`)
- ✅ Keine Foundry-Typen
- ✅ Dokumentation erklärt Mapping zu verschiedenen Plattformen
- ✅ CRUD-Operationen (Read-only für jetzt)
- ✅ Cache-Invalidierung

---

### Step 3: Spezialisierte Ports erstellen

**Datei:** `src/domain/ports/collections/journal-collection-port.interface.ts`

```typescript
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";

/**
 * Specialized port for journal entry collections.
 * 
 * Extends generic collection port with journal-specific operations (if needed).
 * Currently just type-safe wrapper around generic port.
 * 
 * @example
 * ```typescript
 * const journals = await journalCollection.getAll();
 * if (journals.ok) {
 *   console.log(`Found ${journals.value.length} journals`);
 * }
 * ```
 */
export interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {
  // Aktuell keine journal-spezifischen Erweiterungen nötig
  // Bei Bedarf später hinzufügen, z.B.:
  // getByFolder(folderId: string): Result<JournalEntry[], EntityCollectionError>;
  // getByPermission(permission: Permission): Result<JournalEntry[], EntityCollectionError>;
}
```

**Erfolgskriterien:**
- ✅ Erweitert `PlatformEntityCollectionPort<JournalEntry>`
- ✅ Domain-Entity-Type (`JournalEntry`)
- ✅ Dokumentation erklärt Zweck
- ✅ Platz für zukünftige Erweiterungen

**Optional: Actor/Item/Scene Ports (für Zukunft)**

**Datei:** `src/domain/ports/collections/actor-collection-port.interface.ts`

```typescript
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";
import type { EntityCollectionError } from "./platform-entity-collection-port.interface";
import type { Result } from "@/domain/types/result";

/**
 * Domain entity for actors.
 * TODO: Move to @/domain/entities/actor.ts
 */
export interface Actor {
  id: string;
  name: string | null;
  type: ActorType;
}

export type ActorType = "character" | "npc" | "vehicle" | string;

/**
 * Specialized port for actor collections.
 * 
 * Extends generic collection port with actor-specific operations.
 */
export interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {
  /**
   * Get actors by type (character, npc, etc.)
   * 
   * Actor-specific extension of generic collection port.
   * 
   * Platform mappings:
   * - Foundry: game.actors.contents.filter(a => a.type === type)
   * - Roll20: findObjs({_type: "character", character_type: type})
   */
  getByType(type: ActorType): Result<Actor[], EntityCollectionError>;
}
```

---

### Step 4: Foundry-Adapter implementieren

**Datei:** `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts`

```typescript
import type { Result } from "@/domain/types/result";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { EntityCollectionError } from "@/domain/ports/collections/platform-entity-collection-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";

/**
 * Foundry-specific implementation of JournalCollectionPort.
 * 
 * Maps Foundry's game.journal collection to platform-agnostic journal port.
 * 
 * @example
 * ```typescript
 * const adapter = new FoundryJournalCollectionAdapter(foundryGame);
 * 
 * const journals = adapter.getAll();
 * if (journals.ok) {
 *   console.log(`Found ${journals.value.length} journals`);
 * }
 * ```
 */
export class FoundryJournalCollectionAdapter implements JournalCollectionPort {
  constructor(
    private readonly foundryGame: FoundryGame
  ) {}

  /**
   * Get all journal entries from Foundry.
   * 
   * Maps Foundry types → Domain types.
   */
  getAll(): Result<JournalEntry[], EntityCollectionError> {
    const result = this.foundryGame.getJournalEntries();
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "COLLECTION_NOT_AVAILABLE",
          message: `Failed to get journals from Foundry: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    // Map Foundry types → Domain types
    const entries: JournalEntry[] = result.value.map(foundryEntry => ({
      id: foundryEntry.id,
      name: foundryEntry.name ?? null,
    }));

    return { ok: true, value: entries };
  }

  /**
   * Get a specific journal entry by ID.
   * 
   * Maps Foundry types → Domain types.
   */
  getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
    const result = this.foundryGame.getJournalEntryById(id);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: `Failed to get journal ${id} from Foundry: ${result.error.message}`,
          details: result.error,
        },
      };
    }

    // Not found → return null (not an error)
    if (!result.value) {
      return { ok: true, value: null };
    }

    // Map Foundry type → Domain type
    const entry: JournalEntry = {
      id: result.value.id,
      name: result.value.name ?? null,
    };

    return { ok: true, value: entry };
  }

  /**
   * Invalidate Foundry's journal cache.
   * 
   * Delegates to FoundryGame's cache invalidation.
   */
  invalidateCache(): void {
    this.foundryGame.invalidateCache();
  }
}
```

**DI-Wrapper:**

```typescript
import { foundryGameToken } from "@/infrastructure/di/tokens/foundry-tokens";

/**
 * DI-enabled wrapper for FoundryJournalCollectionAdapter.
 */
export class DIFoundryJournalCollectionAdapter extends FoundryJournalCollectionAdapter {
  static dependencies = [foundryGameToken] as const;

  constructor(foundryGame: FoundryGame) {
    super(foundryGame);
  }
}
```

**Erfolgskriterien:**
- ✅ Implementiert `JournalCollectionPort`
- ✅ Nutzt `FoundryGame` (nicht direkt `game.journal`)
- ✅ Mapping von Foundry-Types zu Domain-Types
- ✅ Error-Handling mit Result-Pattern
- ✅ `null` vs. Error unterscheiden (not found vs. platform error)
- ✅ DI-Wrapper für Container-Registration

---

### Step 5: DI-Token und Registration

**Datei:** `src/infrastructure/di/tokens/collection-tokens.ts`

```typescript
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { ActorCollectionPort } from "@/domain/ports/collections/actor-collection-port.interface";

export const journalCollectionPortToken = Symbol.for("JournalCollectionPort");
export const actorCollectionPortToken = Symbol.for("ActorCollectionPort");

export interface CollectionPortTokens {
  [journalCollectionPortToken]: JournalCollectionPort;
  [actorCollectionPortToken]: ActorCollectionPort;
}
```

**Datei:** `src/infrastructure/di/container.ts` (Registration)

```typescript
import { journalCollectionPortToken } from "./tokens/collection-tokens";
import { DIFoundryJournalCollectionAdapter } from "@/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter";

// In registerPorts() oder registerAdapters():
container.registerSingleton(
  journalCollectionPortToken,
  DIFoundryJournalCollectionAdapter
);
```

---

### Step 6: Services refactoren

**Datei:** `src/application/services/JournalVisibilityService.ts`

```typescript
// VORHER:
class JournalVisibilityService {
  constructor(
    private readonly foundryGame: FoundryGame,  // ❌ Infrastructure!
    private readonly foundryFlags: FoundryFlags,
    // ...
  ) {}

  async getHiddenJournals(): Promise<Result<JournalEntry[], Error>> {
    const result = this.foundryGame.getJournalEntries();  // ❌ Foundry-specific
    if (!result.ok) return result;

    const journals = result.value;
    // ...
  }
}

// NACHHER:
class JournalVisibilityService {
  constructor(
    private readonly journalCollection: JournalCollectionPort,  // ✅ Domain Port!
    private readonly documentFlags: PlatformDocumentPort,
    // ...
  ) {}

  async getHiddenJournals(): Promise<Result<JournalEntry[], Error>> {
    const result = this.journalCollection.getAll();  // ✅ Platform-agnostic
    if (!result.ok) {
      return {
        ok: false,
        error: new Error(result.error.message),
      };
    }

    const journals = result.value;
    // ...
  }
}
```

**DI-Wrapper aktualisieren:**

```typescript
import { journalCollectionPortToken } from "@/infrastructure/di/tokens/collection-tokens";
import { platformDocumentPortToken } from "@/infrastructure/di/tokens/document-tokens";

export class DIJournalVisibilityService extends JournalVisibilityService {
  static dependencies = [
    journalCollectionPortToken,
    platformDocumentPortToken,
    notificationCenterToken,
    cacheServiceToken,
  ] as const;

  constructor(
    journalCollection: JournalCollectionPort,
    documentFlags: PlatformDocumentPort,
    notificationCenter: NotificationCenter,
    cache: CacheService,
  ) {
    super(journalCollection, documentFlags, notificationCenter, cache);
  }
}
```

---

### Step 7: Facades aktualisieren (optional)

**Datei:** `src/infrastructure/adapters/foundry/facades/foundry-journal-facade.ts`

```typescript
// VORHER:
class FoundryJournalFacade {
  constructor(
    private readonly foundryGame: FoundryGame,
    private readonly foundryFlags: FoundryFlags,
  ) {}

  getAll(): Result<JournalEntry[], Error> {
    return this.foundryGame.getJournalEntries();
  }
}

// NACHHER (vereinfacht oder gelöscht):
// Facade ist jetzt überflüssig, weil JournalCollectionPort direkt genutzt wird
// Option 1: Facade löschen
// Option 2: Facade als Alias behalten für Backward-Compatibility

class FoundryJournalFacade {
  constructor(
    private readonly journalCollection: JournalCollectionPort,
  ) {}

  getAll(): Result<JournalEntry[], Error> {
    return this.journalCollection.getAll();
  }
}
```

---

### Step 8: Tests erstellen

**Datei:** `src/domain/ports/collections/__tests__/journal-collection-port.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";
import type { JournalCollectionPort } from "../journal-collection-port.interface";

describe("JournalCollectionPort (Contract Test)", () => {
  it("should define all required methods", () => {
    const mockPort: JournalCollectionPort = {
      getAll: vi.fn(),
      getById: vi.fn(),
      invalidateCache: vi.fn(),
    };

    expect(mockPort.getAll).toBeDefined();
    expect(mockPort.getById).toBeDefined();
    expect(mockPort.invalidateCache).toBeDefined();
  });
});
```

**Datei:** `src/infrastructure/adapters/foundry/collection-adapters/__tests__/foundry-journal-collection-adapter.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryJournalCollectionAdapter } from "../foundry-journal-collection-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";

describe("FoundryJournalCollectionAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let adapter: FoundryJournalCollectionAdapter;

  beforeEach(() => {
    mockFoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
    };

    adapter = new FoundryJournalCollectionAdapter(mockFoundryGame);
  });

  describe("getAll", () => {
    it("should return all journals from Foundry", () => {
      const foundryJournals = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue({
        ok: true,
        value: foundryJournals,
      });

      const result = adapter.getAll();

      expect(result.ok).toBe(true);
      expect(result.value).toEqual([
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ]);
    });

    it("should return error when Foundry fails", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue({
        ok: false,
        error: new Error("Foundry not ready"),
      });

      const result = adapter.getAll();

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("getById", () => {
    it("should return journal by ID", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue({
        ok: true,
        value: { id: "journal-1", name: "Journal 1" },
      });

      const result = adapter.getById("journal-1");

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: "journal-1", name: "Journal 1" });
    });

    it("should return null when journal not found", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue({
        ok: true,
        value: null,
      });

      const result = adapter.getById("nonexistent");

      expect(result.ok).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe("invalidateCache", () => {
    it("should delegate to FoundryGame", () => {
      adapter.invalidateCache();

      expect(mockFoundryGame.invalidateCache).toHaveBeenCalled();
    });
  });
});
```

**Datei:** `src/application/services/__tests__/JournalVisibilityService.test.ts` (aktualisieren)

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { JournalVisibilityService } from "../JournalVisibilityService";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";

describe("JournalVisibilityService", () => {
  let mockJournalCollection: JournalCollectionPort;
  let mockDocumentFlags: any;
  let service: JournalVisibilityService;

  beforeEach(() => {
    mockJournalCollection = {
      getAll: vi.fn().mockReturnValue({
        ok: true,
        value: [
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
        ],
      }),
      getById: vi.fn(),
      invalidateCache: vi.fn(),
    };

    mockDocumentFlags = {
      getFlag: vi.fn(),
      setFlag: vi.fn(),
    };

    service = new JournalVisibilityService(
      mockJournalCollection,
      mockDocumentFlags,
      // ... other deps
    );
  });

  it("should get journals from collection port", async () => {
    await service.getHiddenJournals();

    expect(mockJournalCollection.getAll).toHaveBeenCalled();
  });

  // Weitere Tests...
});
```

---

## ✅ Checkliste

### Preparation
- [ ] Phase 1 abgeschlossen (empfohlen, aber nicht zwingend)
- [ ] Backup erstellen (`git commit -m "Before Phase 2: Entity Collections Refactoring"`)
- [ ] Ordnerstruktur erstellen
- [ ] Dependencies überprüfen

### Domain Layer
- [ ] `PlatformEntityCollectionPort<T>` erstellt
- [ ] `JournalCollectionPort` erstellt
- [ ] `EntityCollectionError` definiert
- [ ] Dokumentation vollständig (Platform-Mappings)

### Infrastructure Layer
- [ ] `FoundryJournalCollectionAdapter` erstellt
- [ ] Foundry-Game-Mapping implementiert
- [ ] Error-Handling mit Result-Pattern
- [ ] DI-Wrapper erstellt

### Application Layer
- [ ] `JournalVisibilityService` refactored (nutzt Port)
- [ ] Andere Services refactored (falls vorhanden)
- [ ] Facades aktualisiert oder gelöscht

### DI Container
- [ ] Tokens erstellt (`journalCollectionPortToken`)
- [ ] Adapter registriert
- [ ] Services aktualisiert (Dependencies)

### Tests
- [ ] Port-Contract-Tests geschrieben
- [ ] Adapter-Tests geschrieben
- [ ] Service-Tests aktualisiert (nutzen Port-Mocks)
- [ ] Alle Tests grün: `npm run test`

### Validation
- [ ] `npm run check:types` ✅
- [ ] `npm run check:lint` ✅
- [ ] `npm run check:format` ✅
- [ ] `npm run test` ✅
- [ ] `npm run check:all` ✅

### Documentation
- [ ] CHANGELOG.md aktualisiert (Unreleased → Changed)
- [ ] Code-Kommentare vollständig
- [ ] Commit: `refactor(collections): implement platform-agnostic entity collections`

---

## 🎯 Erfolgskriterien

Nach Abschluss dieser Phase:

- ✅ **Keine direkten FoundryGame-Abhängigkeiten** in Services
- ✅ **JournalCollectionPort** definiert und implementiert
- ✅ **Generischer Port** wiederverwendbar für Actor/Item/Scene
- ✅ **Services entkoppelt** von Foundry
- ✅ **Tests ohne Foundry-Globals** lauffähig
- ✅ **Alle Checks grün:** `npm run check:all`

---

## 🚨 Häufige Probleme

### Problem 1: null vs. Error unterscheiden

```typescript
// ❌ FEHLER: "Not found" als Error behandeln
getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
  const result = this.foundryGame.getJournalEntryById(id);
  if (!result.value) {
    return { ok: false, error: { code: "ENTITY_NOT_FOUND", ... } };  // ❌ Falsch!
  }
}
```

**Lösung:**
```typescript
// ✅ RICHTIG: "Not found" ist OK (null), nur Platform-Fehler sind Errors
getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
  const result = this.foundryGame.getJournalEntryById(id);
  if (!result.ok) {
    return { ok: false, error: { code: "PLATFORM_ERROR", ... } };
  }
  
  // null ist valid (Entity not found)
  if (!result.value) {
    return { ok: true, value: null };
  }

  return { ok: true, value: this.mapToEntity(result.value) };
}
```

### Problem 2: Type-Mapping vergessen

```typescript
// ❌ FEHLER: Foundry-Types direkt zurückgeben
getAll(): Result<JournalEntry[], EntityCollectionError> {
  const result = this.foundryGame.getJournalEntries();
  return result;  // ❌ Foundry-Types statt Domain-Types!
}
```

**Lösung:**
```typescript
// ✅ RICHTIG: Mapping Foundry → Domain
getAll(): Result<JournalEntry[], EntityCollectionError> {
  const result = this.foundryGame.getJournalEntries();
  if (!result.ok) return this.mapError(result.error);

  const entries: JournalEntry[] = result.value.map(foundryEntry => ({
    id: foundryEntry.id,
    name: foundryEntry.name ?? null,
  }));

  return { ok: true, value: entries };
}
```

---

## 🔄 Erweiterungen (Optional)

### Actor-Collections hinzufügen

Nach gleichem Muster:

1. `ActorCollectionPort` erstellen
2. `FoundryActorCollectionAdapter` implementieren
3. Token registrieren
4. Services refactoren

**Zeitaufwand:** ~2-3 Stunden (da Pattern bereits etabliert)

---

## 📚 Nächste Schritte

Nach Abschluss dieser Phase:

1. ✅ **Phase 3 starten:** Settings-System Refactoring
2. ✅ **Actor-Collections erweitern:** `ActorCollectionPort` (optional)
3. ✅ **Item-Collections erweitern:** `ItemCollectionPort` (optional)

**Geschätzte Zeit bis Phase 3:** 0 Tage (parallel möglich)

---

**Status:** ⏳ Bereit zur Umsetzung  
**Review erforderlich:** Nach Step 8  
**Zeitaufwand:** 8-12 Stunden

