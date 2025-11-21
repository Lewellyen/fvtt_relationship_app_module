# Clean Architecture Multi-Platform Refactoring Plan

**Datum:** 2025-01-27 (Aktualisiert: 2025-11-21)  
**Ziel:** Vollständige Platform-Agnostizität durch Clean Architecture mit generischen und spezialisierten Ports  
**Scope:** Event-System, Entity-Collections, Settings-System, UI-Operations  
**Status:** Phase 1 ✅ Abgeschlossen

---

## 🎯 Vision

Das Modul soll **vollständig platform-agnostisch** werden, sodass es mit minimalem Aufwand auf andere VTT-Plattformen portiert werden kann:

- ✅ **Foundry VTT** (aktuelle Implementierung)
- 🎯 **Roll20** (zukünftig möglich)
- 🎯 **Fantasy Grounds** (zukünftig möglich)
- 🎯 **CSV/File-based** (für Testing)

---

## 🏗️ Clean Architecture Prinzipien

### Dependency Rule

```
┌─────────────────────────────────────────────────┐
│ Application Layer (Use-Cases)                   │
│  └─ Business-Logik nutzt Ports (Interfaces)    │
└──────────────────┬────────────────────────────────┘
                   │ depends on (Interface only)
┌──────────────────▼────────────────────────────────┐
│ Domain Layer (Ports & Entities)                  │
│  ├─ Generische Basis-Ports                       │
│  ├─ Spezialisierte Entity-Ports                  │
│  └─ Platform-agnostic Entities                   │
└──────────────────△────────────────────────────────┘
                   │ implements (Concrete Class)
┌──────────────────┴────────────────────────────────┐
│ Infrastructure Layer (Adapters)                   │
│  └─ Platform-spezifische Implementierungen       │
│      ├─ FoundryXxxAdapter                        │
│      ├─ Roll20XxxAdapter                         │
│      └─ CSVXxxAdapter                            │
└───────────────────────────────────────────────────┘
```

**Kernregel:** Abhängigkeiten zeigen immer **nach innen** (zu Domain), niemals nach außen!

---

## 📋 Port-Architektur: Generisch + Spezialisiert

### Muster 1: Generisch mit Spezialisierungen

**Wann nutzen?**
- Mehrere Entity-Typen mit ähnlichen Operationen (Journal, Actor, Item, Scene...)
- Gemeinsame Basis-Funktionalität (CRUD, Events, Collections)
- Code-Wiederverwendung sinnvoll

**Struktur:**
```typescript
// GENERISCH - Basis-Port (Domain Layer)
interface PlatformEventPort<TEvent> {
  registerListener(...): Result<...>;
  unregisterListener(...): Result<...>;
}

// SPEZIALISIERT - Entity-spezifische Ports (Domain Layer)
interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  onJournalCreated(...): Result<...>;
  onJournalUpdated(...): Result<...>;
}

interface ActorEventPort extends PlatformEventPort<ActorEvent> {
  onActorCreated(...): Result<...>;
  onActorUpdated(...): Result<...>;
}
```

### Muster 2: Bereits Generisch

**Wann nutzen?**
- Funktionalität ist universell (Settings, Flags)
- Keine Entity-spezifischen Variationen nötig
- Ein Port für alle Use-Cases genügt

**Struktur:**
```typescript
// GENERISCH - Ein Port für alles (Domain Layer)
interface PlatformSettingsPort {
  register<T>(...): Result<...>;
  get<T>(...): Result<...>;
  set<T>(...): Result<...>;
}

// Keine Spezialisierung nötig!
```

---

## 🎯 Refactoring-Übersicht

### Port-Kategorien

| Port-Kategorie | Pattern | Priorität | Status | Aufwand |
|---------------|---------|-----------|--------|---------|
| **Event-System** | Generisch + Spezialisiert | 🔴 Höchste | ✅ **FERTIG** | Hoch |
| **Entity-Collections** | Generisch + Spezialisiert | 🟠 Hoch | ❌ Zu tun | Mittel |
| **Document-Flags** | Bereits Generisch | 🟡 Niedrig | ✅ Fertig | - |
| **Settings-System** | Bereits Generisch | 🟠 Hoch | ⚠️ Partiell | Mittel |
| **UI-Operations** | Generisch mit entityType | 🟡 Mittel | ❌ Zu tun | Niedrig |

---

## 📦 Phase 1: Event-System Refactoring ✅ ABGESCHLOSSEN

### ✅ Status: Erfolgreich implementiert am 2025-11-21

**Detaillierte Dokumentation:** [phase-1-event-system-refactoring.md](phases/phase-1-event-system-refactoring.md)

**Was wurde umgesetzt:**
- ✅ `PlatformEventPort<T>` - Generischer Basis-Port für Event-Systeme
- ✅ `JournalEventPort` - Spezialisierter Port mit platform-agnostischen Event-Types
- ✅ `FoundryJournalEventAdapter` - Foundry-spezifische Implementierung
- ✅ `InvalidateJournalCacheOnChangeUseCase` - Ersetzt `JournalCacheInvalidationHook`
- ✅ `ProcessJournalDirectoryOnRenderUseCase` - Ersetzt `RenderJournalDirectoryHook`
- ✅ `EventRegistrar` Interface - Ersetzt `HookRegistrar`
- ✅ `ModuleEventRegistrar` - Ersetzt `ModuleHookRegistrar`
- ✅ Vollständige Unit-Tests für alle Komponenten
- ✅ DI-Integration und Token-Registrierung
- ✅ Dokumentation (CHANGELOG, ARCHITECTURE)

### 🔴 Priorität: HÖCHSTE (✅ Erledigt!)

### Problem (IST-Zustand)

```typescript
// ❌ Use-Cases hängen direkt von Infrastructure ab
class RenderJournalDirectoryHook {
  constructor(
    private readonly foundryHooks: FoundryHooks,  // ❌ Infrastructure!
    // ...
  ) {}
}

class JournalCacheInvalidationHook {
  constructor(
    private readonly hooks: FoundryHooks,  // ❌ Infrastructure!
    private readonly foundryGame: FoundryGame,  // ❌ Infrastructure!
    // ...
  ) {}
}
```

### Ziel (SOLL-Zustand)

```typescript
// ✅ Use-Cases nutzen nur Domain-Ports
class InvalidateJournalCacheOnChangeUseCase {
  constructor(
    private readonly journalEvents: JournalEventPort,  // ✅ Domain Port!
    private readonly cache: CacheService,
    // ...
  ) {}
}
```

---

### 1.1 Generischer Basis-Port

**Datei:** `src/domain/ports/events/platform-event-port.interface.ts`

```typescript
/**
 * Generic port for platform event systems.
 * 
 * Platform-agnostic abstraction over event registration systems like:
 * - Foundry VTT Hooks
 * - Roll20 on:change events
 * - Fantasy Grounds event listeners
 * - File system polling
 * 
 * @template TEvent - The event type this port handles
 */
export interface PlatformEventPort<TEvent> {
  /**
   * Register a listener for platform events.
   * 
   * @param eventType - Generic event identifier
   * @param callback - Callback to execute when event fires
   * @returns Registration ID for cleanup
   */
  registerListener(
    eventType: string,
    callback: (event: TEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Unregister a previously registered listener.
   */
  unregisterListener(
    registrationId: EventRegistrationId
  ): Result<void, PlatformEventError>;
}

export type EventRegistrationId = string | number;

export interface PlatformEventError {
  code: 
    | "EVENT_REGISTRATION_FAILED" 
    | "EVENT_UNREGISTRATION_FAILED" 
    | "INVALID_EVENT_TYPE"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}
```

---

### 1.2 Spezialisierter Journal-Event-Port

**Datei:** `src/domain/ports/events/journal-event-port.interface.ts`

```typescript
import type { PlatformEventPort, EventRegistrationId, PlatformEventError } from "./platform-event-port.interface";

/**
 * Specialized port for journal lifecycle events.
 * 
 * Extends the generic PlatformEventPort with journal-specific operations.
 * Still platform-agnostic - works with any VTT system.
 */
export interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  /**
   * Register listener for journal creation events.
   * 
   * Maps to:
   * - Foundry: "createJournalEntry" hook
   * - Roll20: "add:handout" event
   * - CSV: File creation in watched directory
   */
  onJournalCreated(
    callback: (event: JournalCreatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal update events.
   * 
   * Maps to:
   * - Foundry: "updateJournalEntry" hook
   * - Roll20: "change:handout" event
   * - CSV: File modification detected
   */
  onJournalUpdated(
    callback: (event: JournalUpdatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal deletion events.
   * 
   * Maps to:
   * - Foundry: "deleteJournalEntry" hook
   * - Roll20: "destroy:handout" event
   * - CSV: File deletion detected
   */
  onJournalDeleted(
    callback: (event: JournalDeletedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  /**
   * Register listener for journal directory UI render events.
   * 
   * NOTE: This is UI-specific and might not exist on all platforms.
   * Non-UI platforms (CSV, API) can return success without doing anything.
   * 
   * Maps to:
   * - Foundry: "renderJournalDirectory" hook
   * - Roll20: Sidebar tab activation event
   * - CSV: No-op (not applicable)
   */
  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;
}

// ===== Event Types (Platform-agnostic) =====

export interface JournalCreatedEvent {
  journalId: string;
  timestamp: number;
}

export interface JournalUpdatedEvent {
  journalId: string;
  changes: JournalChanges;
  timestamp: number;
}

export interface JournalDeletedEvent {
  journalId: string;
  timestamp: number;
}

export interface JournalDirectoryRenderedEvent {
  htmlElement: HTMLElement;  // DOM ist überall gleich
  timestamp: number;
}

export interface JournalChanges {
  flags?: Record<string, unknown>;
  name?: string;
  [key: string]: unknown;
}

export type JournalEvent = 
  | JournalCreatedEvent 
  | JournalUpdatedEvent 
  | JournalDeletedEvent 
  | JournalDirectoryRenderedEvent;
```

---

### 1.3 Foundry-Adapter (Implementierung)

**Datei:** `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

```typescript
import type { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/infrastructure/adapters/foundry/types";

/**
 * Foundry-specific implementation of JournalEventPort.
 * 
 * Maps Foundry's Hook system to platform-agnostic journal events.
 */
export class FoundryJournalEventAdapter implements JournalEventPort {
  private registrations = new Map<EventRegistrationId, () => void>();
  private nextId = 1;

  constructor(
    private readonly foundryHooks: FoundryHooks,
  ) {}

  onJournalCreated(
    callback: (event: JournalCreatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "createJournalEntry",  // Foundry-spezifischer Hook-Name
      (foundryEntry: unknown, options: unknown, userId: string) => {
        // Mapping: Foundry-Event → Domain-Event
        const event: JournalCreatedEvent = {
          journalId: this.extractId(foundryEntry),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalUpdated(
    callback: (event: JournalUpdatedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "updateJournalEntry",  // Foundry-spezifisch
      (foundryEntry: unknown, changes: unknown, options: unknown, userId: string) => {
        const event: JournalUpdatedEvent = {
          journalId: this.extractId(foundryEntry),
          changes: this.normalizeChanges(changes),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalDeleted(
    callback: (event: JournalDeletedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "deleteJournalEntry",
      (foundryEntry: unknown, options: unknown, userId: string) => {
        const event: JournalDeletedEvent = {
          journalId: this.extractId(foundryEntry),
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  onJournalDirectoryRendered(
    callback: (event: JournalDirectoryRenderedEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    return this.registerFoundryHook(
      "renderJournalDirectory",
      (app: unknown, html: unknown) => {
        const htmlElement = this.extractHtmlElement(html);
        if (!htmlElement) return;

        const event: JournalDirectoryRenderedEvent = {
          htmlElement,
          timestamp: Date.now(),
        };
        callback(event);
      }
    );
  }

  unregisterListener(
    registrationId: EventRegistrationId
  ): Result<void, PlatformEventError> {
    const cleanup = this.registrations.get(registrationId);
    if (!cleanup) {
      return {
        ok: false,
        error: {
          code: "EVENT_UNREGISTRATION_FAILED",
          message: `No registration found for ID ${registrationId}`,
        },
      };
    }

    cleanup();
    this.registrations.delete(registrationId);
    return { ok: true, value: undefined };
  }

  registerListener(
    eventType: string,
    callback: (event: JournalEvent) => void
  ): Result<EventRegistrationId, PlatformEventError> {
    // Fallback für generische registerListener
    // In der Praxis sollten die spezialisierten Methoden genutzt werden
    return this.registerFoundryHook(eventType, callback as FoundryHookCallback);
  }

  // ===== Private Helpers =====

  private registerFoundryHook(
    hookName: string,
    callback: FoundryHookCallback
  ): Result<EventRegistrationId, PlatformEventError> {
    const result = this.foundryHooks.on(hookName, callback);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "EVENT_REGISTRATION_FAILED",
          message: `Failed to register Foundry hook "${hookName}": ${result.error.message}`,
          details: result.error,
        },
      };
    }

    const foundryHookId = result.value;
    const registrationId = String(this.nextId++);

    // Store cleanup function
    this.registrations.set(registrationId, () => {
      this.foundryHooks.off(hookName, foundryHookId);
    });

    return { ok: true, value: registrationId };
  }

  private extractId(foundryEntry: unknown): string {
    return (foundryEntry as { id: string }).id;
  }

  private normalizeChanges(foundryChanges: unknown): JournalChanges {
    const changes = foundryChanges as Record<string, unknown>;
    return {
      flags: changes.flags as Record<string, unknown>,
      name: changes.name as string | undefined,
      ...changes,
    };
  }

  private extractHtmlElement(html: unknown): HTMLElement | null {
    if (html instanceof HTMLElement) return html;
    if (Array.isArray(html) && html[0] instanceof HTMLElement) return html[0];
    return null;
  }

  dispose(): void {
    for (const cleanup of this.registrations.values()) {
      cleanup();
    }
    this.registrations.clear();
  }
}

// DI-Wrapper
export class DIFoundryJournalEventAdapter extends FoundryJournalEventAdapter {
  static dependencies = [foundryHooksToken] as const;

  constructor(hooks: FoundryHooks) {
    super(hooks);
  }
}
```

---

### 1.4 Use-Cases refactoren

**Datei:** `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`

```typescript
/**
 * Use-Case: Invalidate journal cache when journal entries change.
 * 
 * Platform-agnostic - works with any JournalEventPort implementation.
 */
export class InvalidateJournalCacheOnChangeUseCase {
  private registrationIds: EventRegistrationId[] = [];

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly cache: CacheService,
    private readonly notificationCenter: NotificationCenter,
  ) {}

  execute(): Result<void, Error> {
    // Register for all journal change events
    const results = [
      this.journalEvents.onJournalCreated((event) => {
        this.invalidateCache("created", event.journalId);
      }),
      this.journalEvents.onJournalUpdated((event) => {
        this.invalidateCache("updated", event.journalId);
        
        // Check if hidden flag changed
        if (event.changes.flags?.["hidden"] !== undefined) {
          this.triggerUIUpdate(event.journalId);
        }
      }),
      this.journalEvents.onJournalDeleted((event) => {
        this.invalidateCache("deleted", event.journalId);
      }),
    ];

    // Collect registration IDs for cleanup
    for (const result of results) {
      if (result.ok) {
        this.registrationIds.push(result.value);
      } else {
        this.notificationCenter.error(
          "Failed to register journal event listener",
          result.error,
          { channels: ["ConsoleChannel"] }
        );
      }
    }

    return { ok: true, value: undefined };
  }

  private invalidateCache(reason: string, journalId: string): void {
    const removed = this.cache.invalidateWhere(meta =>
      meta.tags.includes("journal:hidden")
    );
    
    if (removed > 0) {
      this.notificationCenter.debug(
        `Invalidated ${removed} journal cache entries (${reason})`,
        { journalId },
        { channels: ["ConsoleChannel"] }
      );
    }
  }

  private triggerUIUpdate(journalId: string): void {
    this.notificationCenter.debug(
      "Journal hidden flag changed, UI update needed",
      { journalId },
      { channels: ["ConsoleChannel"] }
    );
  }

  dispose(): void {
    for (const id of this.registrationIds) {
      this.journalEvents.unregisterListener(id);
    }
    this.registrationIds = [];
  }
}
```

**Datei:** `src/application/use-cases/process-journal-directory-on-render.use-case.ts`

```typescript
/**
 * Use-Case: Process journal directory when it's rendered.
 * 
 * Platform-agnostic - works with any JournalEventPort implementation.
 */
export class ProcessJournalDirectoryOnRenderUseCase {
  private registrationId?: EventRegistrationId;

  constructor(
    private readonly journalEvents: JournalEventPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly notificationCenter: NotificationCenter,
  ) {}

  execute(): Result<void, Error> {
    const result = this.journalEvents.onJournalDirectoryRendered((event) => {
      this.notificationCenter.debug(
        "Journal directory rendered, processing visibility",
        { timestamp: event.timestamp },
        { channels: ["ConsoleChannel"] }
      );

      const processResult = this.journalVisibility.processJournalDirectory(
        event.htmlElement
      );

      if (!processResult.ok) {
        this.notificationCenter.error(
          "Failed to process journal directory",
          processResult.error,
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    if (result.ok) {
      this.registrationId = result.value;
    }

    return result.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: new Error(result.error.message) };
  }

  dispose(): void {
    if (this.registrationId) {
      this.journalEvents.unregisterListener(this.registrationId);
      this.registrationId = undefined;
    }
  }
}
```

---

### 1.5 Weitere Entity-Event-Ports (Zukunft)

**Datei:** `src/domain/ports/events/actor-event-port.interface.ts`

```typescript
import type { PlatformEventPort } from "./platform-event-port.interface";

export interface ActorEventPort extends PlatformEventPort<ActorEvent> {
  onActorCreated(callback: (event: ActorCreatedEvent) => void): Result<...>;
  onActorUpdated(callback: (event: ActorUpdatedEvent) => void): Result<...>;
  onActorDeleted(callback: (event: ActorDeletedEvent) => void): Result<...>;
}
```

**Datei:** `src/domain/ports/events/item-event-port.interface.ts`

```typescript
import type { PlatformEventPort } from "./platform-event-port.interface";

export interface ItemEventPort extends PlatformEventPort<ItemEvent> {
  onItemCreated(callback: (event: ItemCreatedEvent) => void): Result<...>;
  onItemUpdated(callback: (event: ItemUpdatedEvent) => void): Result<...>;
  onItemDeleted(callback: (event: ItemDeletedEvent) => void): Result<...>;
}
```

---

## 📦 Phase 2: Entity-Collections Refactoring

### 🟠 Priorität: HOCH (nach Phase 1)

### Problem (IST-Zustand)

```typescript
// ❌ Nur Journal-spezifisch, nicht wiederverwendbar
interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], Error>;
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, Error>;
  invalidateCache(): void;
}

// ❌ Wenn Actor-Collections hinzukommen: DUPLIKATION!
interface FoundryGame {
  getJournalEntries(): Result<...>;
  getJournalEntryById(id: string): Result<...>;
  
  getActorEntries(): Result<...>;        // DUPLIKAT!
  getActorEntryById(id: string): Result<...>;  // DUPLIKAT!
  
  getItemEntries(): Result<...>;         // DUPLIKAT!
  getItemEntryById(id: string): Result<...>;   // DUPLIKAT!
}
```

### Ziel (SOLL-Zustand)

```typescript
// ✅ Generisch - wiederverwendbar für alle Entity-Typen
interface PlatformEntityCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityError>;
  getById(id: string): Result<TEntity | null, EntityError>;
  invalidateCache(): void;
}

// ✅ Spezialisierungen nutzen Generic
interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {}
interface ItemCollectionPort extends PlatformEntityCollectionPort<Item> {}
```

---

### 2.1 Generischer Basis-Port

**Datei:** `src/domain/ports/collections/platform-entity-collection-port.interface.ts`

```typescript
/**
 * Generic port for entity collection access.
 * 
 * Provides CRUD operations for any entity type (Journal, Actor, Item, Scene...).
 * Platform-agnostic - works with Foundry, Roll20, CSV, etc.
 * 
 * @template TEntity - The entity type this collection manages
 */
export interface PlatformEntityCollectionPort<TEntity> {
  /**
   * Get all entities in the collection.
   * 
   * Maps to:
   * - Foundry: game.journal.contents, game.actors.contents
   * - Roll20: findObjs({_type: "handout"}), findObjs({_type: "character"})
   * - CSV: readdir + parse all files
   */
  getAll(): Result<TEntity[], EntityCollectionError>;

  /**
   * Get a specific entity by its ID.
   * 
   * Maps to:
   * - Foundry: game.journal.get(id), game.actors.get(id)
   * - Roll20: getObj("handout", id), getObj("character", id)
   * - CSV: readFile(id.json) + parse
   */
  getById(id: string): Result<TEntity | null, EntityCollectionError>;

  /**
   * Invalidate any cached collection data.
   * Forces next getAll() call to fetch fresh data.
   */
  invalidateCache(): void;
}

export interface EntityCollectionError {
  code: 
    | "COLLECTION_NOT_AVAILABLE"
    | "ENTITY_NOT_FOUND"
    | "INVALID_ENTITY_DATA"
    | "PLATFORM_ERROR";
  message: string;
  details?: unknown;
}
```

---

### 2.2 Spezialisierte Ports

**Datei:** `src/domain/ports/collections/journal-collection-port.interface.ts`

```typescript
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";

/**
 * Specialized port for journal entry collections.
 * 
 * Extends generic collection port with journal-specific operations (if needed).
 */
export interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {
  // Aktuell keine journal-spezifischen Erweiterungen nötig
  // Bei Bedarf später hinzufügen, z.B.:
  // getByFolder(folderId: string): Result<JournalEntry[], EntityCollectionError>;
}
```

**Datei:** `src/domain/ports/collections/actor-collection-port.interface.ts`

```typescript
import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";
import type { Actor } from "@/domain/entities/actor";

export interface ActorCollectionPort extends PlatformEntityCollectionPort<Actor> {
  /**
   * Get actors by type (character, npc, etc.)
   * Actor-specific extension of generic collection port.
   */
  getByType(type: ActorType): Result<Actor[], EntityCollectionError>;
}

export type ActorType = "character" | "npc" | "vehicle" | string;
```

---

### 2.3 Foundry-Adapter

**Datei:** `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter.ts`

```typescript
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";

export class FoundryJournalCollectionAdapter implements JournalCollectionPort {
  constructor(private readonly foundryGame: FoundryGame) {}

  getAll(): Result<JournalEntry[], EntityCollectionError> {
    const result = this.foundryGame.getJournalEntries();
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "COLLECTION_NOT_AVAILABLE",
          message: result.error.message,
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

  getById(id: string): Result<JournalEntry | null, EntityCollectionError> {
    const result = this.foundryGame.getJournalEntryById(id);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: result.error.message,
          details: result.error,
        },
      };
    }

    if (!result.value) {
      return { ok: true, value: null };
    }

    const entry: JournalEntry = {
      id: result.value.id,
      name: result.value.name ?? null,
    };

    return { ok: true, value: entry };
  }

  invalidateCache(): void {
    this.foundryGame.invalidateCache();
  }
}
```

---

## 📦 Phase 3: Settings-System Refactoring

### 🟠 Priorität: HOCH (parallel zu Phase 2)

### Problem

```typescript
// ❌ ModuleSettingsRegistrar nutzt direkt FoundrySettings
class ModuleSettingsRegistrar {
  constructor(
    private readonly foundrySettings: FoundrySettings,  // ❌ Infrastructure!
    // ...
  ) {}
}
```

### Ziel

```typescript
// ✅ Platform-agnostischer Port
class ModuleSettingsRegistrar {
  constructor(
    private readonly settings: PlatformSettingsPort,  // ✅ Domain Port!
    // ...
  ) {}
}
```

---

### 3.1 Platform-Settings-Port

**Datei:** `src/domain/ports/platform-settings-port.interface.ts`

```typescript
/**
 * Platform-agnostic port for application settings.
 * 
 * Maps to:
 * - Foundry: game.settings.register/get/set
 * - Roll20: state object persistence
 * - Fantasy Grounds: DB.setValue/getValue
 * - CSV: JSON file storage
 */
export interface PlatformSettingsPort {
  /**
   * Register a new setting.
   * Must be called during initialization.
   * 
   * @param namespace - Module/app identifier
   * @param key - Setting key (unique within namespace)
   * @param config - Setting configuration
   */
  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError>;

  /**
   * Get current value of a setting with validation.
   * 
   * @param namespace - Module identifier
   * @param key - Setting key
   * @param schema - Valibot schema for runtime validation
   */
  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError>;

  /**
   * Set value of a setting.
   * Triggers onChange callbacks and persists value.
   */
  set<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>>;
}

/**
 * Platform-agnostic setting configuration.
 */
export interface PlatformSettingConfig<T> {
  name: string;
  hint?: string;
  scope: "world" | "client" | "user";
  config: boolean;
  type: SettingType;
  choices?: Record<string | number, string>;
  default: T;
  onChange?: (value: T) => void;
}

export type SettingType = 
  | typeof String 
  | typeof Number 
  | typeof Boolean 
  | "String" 
  | "Number" 
  | "Boolean";

export interface SettingsError {
  code: 
    | "SETTING_NOT_REGISTERED"
    | "SETTING_VALIDATION_FAILED"
    | "SETTING_REGISTRATION_FAILED"
    | "PLATFORM_NOT_AVAILABLE";
  message: string;
  details?: unknown;
}
```

---

### 3.2 Foundry-Adapter

**Datei:** `src/infrastructure/adapters/foundry/settings-adapters/foundry-settings-adapter.ts`

```typescript
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

export class FoundrySettingsAdapter implements PlatformSettingsPort {
  constructor(private readonly foundrySettings: FoundrySettings) {}

  register<T>(
    namespace: string,
    key: string,
    config: PlatformSettingConfig<T>
  ): Result<void, SettingsError> {
    // Map Platform config → Foundry config
    const foundryConfig: FoundrySettingConfig<T> = {
      name: config.name,
      hint: config.hint,
      scope: config.scope,
      config: config.config,
      type: this.mapSettingType(config.type),
      choices: config.choices,
      default: config.default,
      onChange: config.onChange,
    };

    const result = this.foundrySettings.register(namespace, key, foundryConfig);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_REGISTRATION_FAILED",
          message: result.error.message,
          details: result.error,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, SettingsError> {
    const result = this.foundrySettings.get(namespace, key, schema);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "SETTING_VALIDATION_FAILED",
          message: result.error.message,
          details: result.error,
        },
      };
    }

    return { ok: true, value: result.value };
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T
  ): Promise<Result<void, SettingsError>> {
    const result = await this.foundrySettings.set(namespace, key, value);
    
    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: result.error.message,
          details: result.error,
        },
      };
    }

    return { ok: true, value: undefined };
  }

  private mapSettingType(type: SettingType): typeof String | typeof Number | typeof Boolean {
    if (type === "String" || type === String) return String;
    if (type === "Number" || type === Number) return Number;
    if (type === "Boolean" || type === Boolean) return Boolean;
    throw new Error(`Unknown setting type: ${type}`);
  }
}
```

---

## 📦 Phase 4: UI-Operations (Optional)

### 🟡 Priorität: MITTEL (nach Phase 1-3)

### Ansatz: Generisch mit entityType Parameter

**Datei:** `src/domain/ports/platform-ui-port.interface.ts`

```typescript
export interface PlatformUIPort {
  notify(
    message: string,
    level: "info" | "warning" | "error",
    options?: NotificationOptions
  ): Result<void, UIError>;

  removeEntityElement(
    entityType: EntityType,
    entityId: string,
    htmlContainer: HTMLElement
  ): Result<void, UIError>;

  rerenderDirectory(
    directoryType: DirectoryType
  ): Result<boolean, UIError>;
}

export type EntityType = "journal" | "actor" | "item" | "scene";
export type DirectoryType = "journal" | "actor" | "item" | "scene";
```

---

## 📁 Vollständige Ordnerstruktur

```
src/
├─ domain/
│   ├─ entities/
│   │   ├─ journal-entry.ts
│   │   ├─ actor.ts
│   │   └─ item.ts
│   │
│   ├─ ports/
│   │   ├─ events/                                      # Event-System
│   │   │   ├─ platform-event-port.interface.ts        # GENERISCH
│   │   │   ├─ journal-event-port.interface.ts         # SPEZIALISIERT
│   │   │   ├─ actor-event-port.interface.ts           # SPEZIALISIERT
│   │   │   └─ item-event-port.interface.ts            # SPEZIALISIERT
│   │   │
│   │   ├─ collections/                                 # Entity-Collections
│   │   │   ├─ platform-entity-collection-port.interface.ts  # GENERISCH
│   │   │   ├─ journal-collection-port.interface.ts    # SPEZIALISIERT
│   │   │   ├─ actor-collection-port.interface.ts      # SPEZIALISIERT
│   │   │   └─ item-collection-port.interface.ts       # SPEZIALISIERT
│   │   │
│   │   ├─ platform-settings-port.interface.ts         # GENERISCH (Settings)
│   │   ├─ platform-document-port.interface.ts         # GENERISCH (Flags)
│   │   ├─ platform-ui-port.interface.ts               # GENERISCH (UI-Ops)
│   │   └─ journal-visibility-port.interface.ts        # ✅ Bereits vorhanden
│   │
│   └─ types/
│       └─ result.ts
│
├─ application/
│   ├─ services/
│   │   ├─ JournalVisibilityService.ts
│   │   ├─ ModuleSettingsRegistrar.ts                  # Nutzt PlatformSettingsPort
│   │   └─ ModuleHookRegistrar.ts                      # Orchestriert Use-Cases
│   │
│   └─ use-cases/
│       ├─ invalidate-journal-cache-on-change.use-case.ts
│       ├─ process-journal-directory-on-render.use-case.ts
│       ├─ invalidate-actor-cache-on-change.use-case.ts    # Zukünftig
│       └─ process-actor-directory-on-render.use-case.ts   # Zukünftig
│
└─ infrastructure/
    └─ adapters/
        ├─ foundry/
        │   ├─ event-adapters/
        │   │   ├─ foundry-journal-event-adapter.ts
        │   │   ├─ foundry-actor-event-adapter.ts
        │   │   └─ foundry-item-event-adapter.ts
        │   │
        │   ├─ collection-adapters/
        │   │   ├─ foundry-journal-collection-adapter.ts
        │   │   ├─ foundry-actor-collection-adapter.ts
        │   │   └─ foundry-item-collection-adapter.ts
        │   │
        │   ├─ settings-adapters/
        │   │   └─ foundry-settings-adapter.ts
        │   │
        │   ├─ domain-adapters/
        │   │   └─ journal-visibility-adapter.ts       # ✅ Bereits vorhanden
        │   │
        │   ├─ interfaces/                             # Foundry-spezifische Services
        │   │   ├─ FoundryHooks.ts
        │   │   ├─ FoundryGame.ts
        │   │   ├─ FoundrySettings.ts
        │   │   └─ FoundryUI.ts
        │   │
        │   ├─ ports/                                  # Version-spezifische Implementierungen
        │   │   └─ v13/
        │   │       ├─ FoundryHooksPort.ts
        │   │       ├─ FoundryGamePort.ts
        │   │       ├─ FoundrySettingsPort.ts
        │   │       └─ FoundryUIPort.ts
        │   │
        │   └─ facades/
        │       └─ foundry-journal-facade.ts
        │
        └─ roll20/                                     # Zukünftig
            ├─ event-adapters/
            │   ├─ roll20-journal-event-adapter.ts
            │   └─ roll20-actor-event-adapter.ts
            │
            └─ collection-adapters/
                ├─ roll20-journal-collection-adapter.ts
                └─ roll20-actor-collection-adapter.ts
```

---

## 🎯 Migration-Pfad (Reihenfolge)

### Sprint 1: Event-System (Woche 1-2)

1. ✅ Domain-Ports erstellen
   - `PlatformEventPort<T>` (generisch)
   - `JournalEventPort` (spezialisiert)

2. ✅ Foundry-Adapter implementieren
   - `FoundryJournalEventAdapter`

3. ✅ Use-Cases refactoren
   - `RenderJournalDirectoryHook` → `ProcessJournalDirectoryOnRenderUseCase`
   - `JournalCacheInvalidationHook` → `InvalidateJournalCacheOnChangeUseCase`
   - Alte Hooks löschen

4. ✅ DI-Container aktualisieren
   - Tokens registrieren
   - Dependencies updaten

5. ✅ Tests aktualisieren
   - Keine Foundry-Globals mehr
   - Port-Mocks statt Service-Mocks

6. ✅ `npm run check:all` ausführen

### Sprint 2: Entity-Collections (Woche 3)

1. ✅ Domain-Ports erstellen
   - `PlatformEntityCollectionPort<T>` (generisch)
   - `JournalCollectionPort` (spezialisiert)

2. ✅ Foundry-Adapter implementieren
   - `FoundryJournalCollectionAdapter`

3. ✅ Use-Cases refactoren
   - Alle Services, die `FoundryGame` nutzen

4. ✅ Facade aktualisieren oder ersetzen
   - `FoundryJournalFacade` auf Collection-Port umstellen

5. ✅ Tests & `check:all`

### Sprint 3: Settings-System (Woche 4)

1. ✅ Domain-Port erstellen
   - `PlatformSettingsPort`

2. ✅ Foundry-Adapter implementieren
   - `FoundrySettingsAdapter`

3. ✅ ModuleSettingsRegistrar refactoren

4. ✅ Tests & `check:all`

### Sprint 4: UI-Operations (Woche 5)

1. ✅ Domain-Port erstellen
   - `PlatformUIPort`

2. ✅ Foundry-Adapter implementieren
   - `FoundryUIAdapter`

3. ✅ UIChannel refactoren

4. ✅ Tests & `check:all`

### Sprint 5: Dokumentation & Cleanup (Woche 6)

1. ✅ CHANGELOG.md aktualisieren
2. ✅ ARCHITECTURE.md aktualisieren
3. ✅ API.md aktualisieren
4. ✅ Alte Code löschen
5. ✅ Migration-Guide für externe Modules erstellen

---

## ✅ Erfolgskriterien

Nach Abschluss aller Phasen:

- ✅ **Keine direkten Foundry-Zugriffe** in Application-Layer
- ✅ **Alle Infrastructure-Dependencies** über Domain-Ports
- ✅ **Generische Basis-Ports** für wiederholbare Patterns (Events, Collections)
- ✅ **Spezialisierte Entity-Ports** für domain-spezifische Operationen
- ✅ **100% Test-Coverage** ohne Foundry-Globals
- ✅ **Roll20-Adapter theoretisch implementierbar** in < 1 Woche
- ✅ **CSV-Test-Adapter implementierbar** für CI/CD

---

## 📊 Aufwandsschätzung

| Phase | Aufwand | Komplexität | Risiko | Dependencies |
|-------|---------|-------------|--------|--------------|
| **Phase 1: Events** | 16-24h | Hoch | Mittel | Keine |
| **Phase 2: Collections** | 8-12h | Mittel | Niedrig | Phase 1 empfohlen |
| **Phase 3: Settings** | 8-12h | Mittel | Niedrig | Keine |
| **Phase 4: UI-Ops** | 4-8h | Niedrig | Niedrig | Keine |
| **Phase 5: Docs** | 4-6h | Niedrig | Niedrig | Alle vorherigen |
| **GESAMT** | **40-62h** | - | - | 5-6 Wochen |

---

## 🚀 Quick-Start (Phase 1 sofort beginnen)

### Detaillierte Phasen-Pläne

Für jede Phase existiert ein detaillierter Plan mit Schritt-für-Schritt-Anleitungen:

📁 **[Phase Plans (docs/refactoring/phases/)](./phases/README.md)**

- 📄 [Phase 1: Event-System Refactoring](./phases/phase-1-event-system-refactoring.md) (16-24h) 🔴
- 📄 [Phase 2: Entity-Collections Refactoring](./phases/phase-2-entity-collections-refactoring.md) (8-12h) 🟠
- 📄 [Phase 3: Settings-System Refactoring](./phases/phase-3-settings-system-refactoring.md) (8-12h) 🟠
- 📄 [Phase 4: UI-Operations Refactoring](./phases/phase-4-ui-operations-refactoring.md) (4-8h) 🟡
- 📄 [Phase 5: Dokumentation & Cleanup](./phases/phase-5-documentation-and-cleanup.md) (4-6h) 🟢

### Nächste Schritte

1. **Phase-Plan öffnen:**
   ```bash
   cat docs/refactoring/phases/phase-1-event-system-refactoring.md
   ```

2. **Ordner erstellen:**
   ```bash
   mkdir -p src/domain/ports/events
   mkdir -p src/infrastructure/adapters/foundry/event-adapters
   mkdir -p src/application/use-cases
   ```

3. **Erste Dateien erstellen:**
   - `src/domain/ports/events/platform-event-port.interface.ts`
   - `src/domain/ports/events/journal-event-port.interface.ts`

4. **Tests parallel schreiben** (TDD):
   - `src/domain/ports/events/__tests__/journal-event-port.test.ts`
   - Mock-Implementierungen für Tests

5. **Foundry-Adapter implementieren:**
   - `src/infrastructure/adapters/foundry/event-adapters/foundry-journal-event-adapter.ts`

6. **Use-Case migrieren:**
   - `src/application/use-cases/invalidate-journal-cache-on-change.use-case.ts`

---

## 📚 Referenzen

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture (Ports & Adapters)](https://alistair.cockburn.us/hexagonal-architecture/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Dependency Inversion Principle](https://en.wikipedia.org/wiki/Dependency_inversion_principle)

---

## 🎯 Zusammenfassung

**Kernprinzip:** 
> "Abstractions should not depend on details. Details should depend on abstractions."

**Umsetzung:**
- ✅ Generische Basis-Ports für wiederkehrende Patterns
- ✅ Spezialisierte Entity-Ports für domain-spezifische Operationen
- ✅ Beide in Domain-Layer (platform-agnostisch)
- ✅ Implementierungen in Infrastructure-Layer (platform-spezifisch)

**Resultat:**
- 🎯 **Multi-VTT-Ready:** Roll20, Fantasy Grounds in < 1 Woche portierbar
- 🎯 **Testbar:** Keine Foundry-Globals mehr nötig
- 🎯 **Wartbar:** Klare Trennung, DRY-Prinzip
- 🎯 **Erweiterbar:** Neue Entity-Typen folgen Muster

---

**Status:** ⏳ Bereit zur Umsetzung  
**Nächster Schritt:** Phase 1 (Event-System) beginnen  
**Review-Date:** Nach jeder abgeschlossenen Phase

