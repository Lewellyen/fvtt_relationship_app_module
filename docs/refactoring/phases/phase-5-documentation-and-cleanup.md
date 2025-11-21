# Phase 5: Dokumentation & Cleanup

**Datum:** 2025-01-27  
**Priorität:** 🟢 ABSCHLUSS  
**Geschätzter Aufwand:** 4-6 Stunden  
**Komplexität:** Niedrig  
**Risiko:** Niedrig  
**Dependencies:** Phase 1-4 müssen abgeschlossen sein

---

## 🎯 Ziel dieser Phase

Das Clean-Architecture-Refactoring dokumentieren und aufräumen:

1. ✅ CHANGELOG.md aktualisieren
2. ✅ ARCHITECTURE.md aktualisieren
3. ✅ API.md aktualisieren
4. ✅ PROJECT_ANALYSIS.md aktualisieren
5. ✅ DEPENDENCY_MAP.md aktualisieren
6. ✅ Alte Code-Dateien löschen
7. ✅ Migration-Guide für Entwickler erstellen
8. ✅ Final Review und Tests

---

## 📋 Detaillierte Schritte

### Step 1: CHANGELOG.md aktualisieren

**Datei:** `CHANGELOG.md`

**In Unreleased-Sektion einfügen:**

```markdown
## [Unreleased]

### Hinzugefügt
- **Platform-Agnostic Event System**: Generischer `PlatformEventPort<T>` und spezialisierter `JournalEventPort` für platform-unabhängige Event-Registrierung ([Details](docs/ARCHITECTURE.md#event-system))
- **Platform-Agnostic Entity Collections**: Generischer `PlatformEntityCollectionPort<T>` für CRUD-Operationen auf beliebigen Entity-Typen ([Details](docs/ARCHITECTURE.md#entity-collections))
- **Platform-Agnostic Settings System**: Generischer `PlatformSettingsPort` für Settings-Management über verschiedene Plattformen hinweg ([Details](docs/ARCHITECTURE.md#settings-system))
- **Platform-Agnostic UI Operations**: Generischer `PlatformUIPort` für Notifications und DOM-Operationen ([Details](docs/ARCHITECTURE.md#ui-operations))
- **Foundry Adapters**: Implementierungen für alle Platform-Ports (Event, Collection, Settings, UI) für Foundry VTT v13
- **Clean Architecture Layers**: Klare Trennung zwischen Domain, Application und Infrastructure ([Details](docs/ARCHITECTURE.md#layered-architecture))

### Geändert
- **Breaking: Use-Cases statt Hooks**: Hook-Klassen wurden durch Use-Cases ersetzt, die Platform-Ports nutzen ([Upgrade-Hinweise](#upgrade-hinweise))
  - `RenderJournalDirectoryHook` → `ProcessJournalDirectoryOnRenderUseCase`
  - `JournalCacheInvalidationHook` → `InvalidateJournalCacheOnChangeUseCase`
- **Breaking: Services nutzen Ports**: Alle Services verwenden jetzt Domain-Ports statt direkter Foundry-Abhängigkeiten
  - `JournalVisibilityService`: Nutzt `JournalCollectionPort`, `PlatformUIPort`, `PlatformDocumentPort`
  - `ModuleSettingsRegistrar`: Nutzt `PlatformSettingsPort`
  - `UIChannel`: Nutzt `PlatformUIPort`
- **Breaking: DI-Container Dependencies**: Alle DI-Wrapper wurden aktualisiert, um neue Port-Tokens zu nutzen
- **FoundryUI Interface**: Methoden wurden generalisiert (`rerenderDirectory` statt `rerenderJournalDirectory`)

### Fehlerbehebungen
- **Event Cleanup**: Events werden jetzt korrekt bereinigt beim Modul-Shutdown (Memory Leak behoben)
- **Error Handling**: Konsistentes Result-Pattern über alle Ports hinweg

### Bekannte Probleme
- Aktuell nur Foundry v13 Adapter implementiert
- Actor/Item/Scene Collections noch nicht implementiert (nur Journal)
- Roll20/Fantasy Grounds Adapter existieren noch nicht

### Upgrade-Hinweise

#### Für Modul-User
- **Keine Breaking Changes**: Das Modul funktioniert weiterhin identisch von außen
- **Performance**: Leichte Performance-Verbesserung durch optimiertes Event-Handling

#### Für Entwickler
- **Ports statt Foundry-Services**: Alle direkten Foundry-Abhängigkeiten wurden durch Platform-Ports ersetzt
  - `FoundryHooks` → `JournalEventPort`
  - `FoundryGame` → `JournalCollectionPort`
  - `FoundrySettings` → `PlatformSettingsPort`
  - `FoundryUI` → `PlatformUIPort`
- **Use-Cases statt Hooks**: Hook-Klassen wurden durch Use-Cases ersetzt
  - Nutze `ProcessJournalDirectoryOnRenderUseCase` statt `RenderJournalDirectoryHook`
  - Nutze `InvalidateJournalCacheOnChangeUseCase` statt `JournalCacheInvalidationHook`
- **DI-Token Updates**: Neue Port-Tokens müssen im DI-Container verwendet werden
  - `journalEventPortToken` für Event-Operations
  - `journalCollectionPortToken` für Collection-Zugriff
  - `platformSettingsPortToken` für Settings
  - `platformUIPortToken` für UI-Operations
- **Testing**: Tests können jetzt ohne Foundry-Globals geschrieben werden (Mock-Ports verwenden)

**Migration-Pfad**: Siehe [Migration-Guide](docs/refactoring/MIGRATION_GUIDE.md)

**Zeitplan**: 
- Legacy-Code bleibt bis Version 1.0.0 verfügbar
- Ab Version 1.0.0: Nur noch Port-basierte APIs
```

**Erfolgskriterien:**
- ✅ Alle Änderungen dokumentiert (Added/Changed/Fixed)
- ✅ Breaking Changes klar markiert
- ✅ Links zu Details-Dokumentation
- ✅ Upgrade-Hinweise für User und Entwickler

---

### Step 2: ARCHITECTURE.md aktualisieren

**Datei:** `docs/ARCHITECTURE.md`

**Neue Sektion hinzufügen:**

```markdown
## 🏗️ Clean Architecture Layers

Das Modul folgt den Prinzipien der Clean Architecture:

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
│      ├─ Roll20XxxAdapter (zukünftig)             │
│      └─ CSVXxxAdapter (zukünftig)                │
└───────────────────────────────────────────────────┘
```

**Dependency Rule**: Abhängigkeiten zeigen immer **nach innen** (zu Domain), niemals nach außen!

### Event System

**Port-Hierarchie:**

```typescript
// GENERISCH - Basis-Port (Domain Layer)
interface PlatformEventPort<TEvent> {
  registerListener(...): Result<...>;
  unregisterListener(...): Result<...>;
}

// SPEZIALISIERT - Entity-spezifischer Port (Domain Layer)
interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  onJournalCreated(...): Result<...>;
  onJournalUpdated(...): Result<...>;
  onJournalDeleted(...): Result<...>;
  onJournalDirectoryRendered(...): Result<...>;
}
```

**Implementierungen:**
- `FoundryJournalEventAdapter`: Foundry VTT v13 Implementierung
- `Roll20JournalEventAdapter`: (zukünftig) Roll20 Implementierung
- `CSVJournalEventAdapter`: (zukünftig) File-based Implementierung für Tests

**Platform-Mappings:**
| Domain Event | Foundry Hook | Roll20 Event | CSV |
|--------------|--------------|--------------|-----|
| `onJournalCreated` | `createJournalEntry` | `add:handout` | File creation |
| `onJournalUpdated` | `updateJournalEntry` | `change:handout` | File modification |
| `onJournalDeleted` | `deleteJournalEntry` | `destroy:handout` | File deletion |

### Entity Collections

**Port-Hierarchie:**

```typescript
// GENERISCH - Basis-Port (Domain Layer)
interface PlatformEntityCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityCollectionError>;
  getById(id: string): Result<TEntity | null, EntityCollectionError>;
  invalidateCache(): void;
}

// SPEZIALISIERT - Entity-spezifischer Port (Domain Layer)
interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
```

**Platform-Mappings:**
| Operation | Foundry | Roll20 | CSV |
|-----------|---------|--------|-----|
| `getAll()` | `game.journal.contents` | `findObjs({_type: "handout"})` | `readdir + parse` |
| `getById(id)` | `game.journal.get(id)` | `getObj("handout", id)` | `readFile(id.json)` |

### Settings System

**Port:**

```typescript
interface PlatformSettingsPort {
  register<T>(...): Result<...>;
  get<T>(...): Result<...>;
  set<T>(...): Promise<Result<...>>;
}
```

**Platform-Mappings:**
| Operation | Foundry | Roll20 | CSV |
|-----------|---------|--------|-----|
| `register()` | `game.settings.register()` | N/A (auto) | Write schema.json |
| `get()` | `game.settings.get()` | `state.get()` | Read settings.json |
| `set()` | `game.settings.set()` | `state.set()` | Write settings.json |

### UI Operations

**Port:**

```typescript
interface PlatformUIPort {
  notify(message, level, options?): Result<...>;
  removeEntityElement(entityType, entityId, html): Result<...>;
  rerenderDirectory(directoryType): Result<...>;
}
```

**Platform-Mappings:**
| Operation | Foundry | Roll20 | Headless |
|-----------|---------|--------|----------|
| `notify()` | `ui.notifications.info/warn/error` | `sendChat()` | `console.log()` |
| `removeEntityElement()` | DOM manipulation | CSS manipulation | No-op |
| `rerenderDirectory()` | `ui.sidebar.tabs[type].render()` | No-op | No-op |
```

**Erfolgskriterien:**
- ✅ Clean Architecture Layer-Diagramm eingefügt
- ✅ Alle 4 Port-Kategorien dokumentiert
- ✅ Platform-Mapping-Tabellen für Roll20, CSV, Headless
- ✅ Code-Beispiele für jeden Port

---

### Step 3: API.md aktualisieren

**Datei:** `docs/API.md`

**Neue Sektion hinzufügen:**

```markdown
## Domain Ports

### Event System

#### `PlatformEventPort<TEvent>`

Generischer Port für Platform-Event-Systeme.

```typescript
interface PlatformEventPort<TEvent> {
  registerListener(
    eventType: string,
    callback: (event: TEvent) => void
  ): Result<EventRegistrationId, PlatformEventError>;

  unregisterListener(
    registrationId: EventRegistrationId
  ): Result<void, PlatformEventError>;
}
```

#### `JournalEventPort`

Spezialisierter Port für Journal-Lifecycle-Events.

```typescript
interface JournalEventPort extends PlatformEventPort<JournalEvent> {
  onJournalCreated(callback: (event: JournalCreatedEvent) => void): Result<...>;
  onJournalUpdated(callback: (event: JournalUpdatedEvent) => void): Result<...>;
  onJournalDeleted(callback: (event: JournalDeletedEvent) => void): Result<...>;
  onJournalDirectoryRendered(callback: (event: JournalDirectoryRenderedEvent) => void): Result<...>;
}
```

**Verwendung:**

```typescript
const journalEvents = container.resolve(journalEventPortToken);

// Register listener
const result = journalEvents.onJournalCreated((event) => {
  console.log(`Journal created: ${event.journalId}`);
});

if (result.ok) {
  const registrationId = result.value;
  
  // Later: Cleanup
  journalEvents.unregisterListener(registrationId);
}
```

### Entity Collections

#### `PlatformEntityCollectionPort<TEntity>`

Generischer Port für Entity-Collection-Zugriff.

```typescript
interface PlatformEntityCollectionPort<TEntity> {
  getAll(): Result<TEntity[], EntityCollectionError>;
  getById(id: string): Result<TEntity | null, EntityCollectionError>;
  invalidateCache(): void;
}
```

#### `JournalCollectionPort`

Spezialisierter Port für Journal-Collections.

```typescript
interface JournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {}
```

**Verwendung:**

```typescript
const journalCollection = container.resolve(journalCollectionPortToken);

// Get all journals
const result = journalCollection.getAll();
if (result.ok) {
  const journals = result.value;
  console.log(`Found ${journals.length} journals`);
}

// Get specific journal
const result = journalCollection.getById("journal-123");
if (result.ok && result.value) {
  console.log(`Journal: ${result.value.name}`);
}
```

### Settings System

#### `PlatformSettingsPort`

Platform-agnostischer Port für Settings-Management.

```typescript
interface PlatformSettingsPort {
  register<T>(namespace: string, key: string, config: PlatformSettingConfig<T>): Result<void, SettingsError>;
  get<T>(namespace: string, key: string, schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>): Result<T, SettingsError>;
  set<T>(namespace: string, key: string, value: T): Promise<Result<void, SettingsError>>;
}
```

**Verwendung:**

```typescript
const settings = container.resolve(platformSettingsPortToken);

// Register setting
settings.register("my-module", "enabled", {
  name: "Enable Feature",
  scope: "world",
  type: Boolean,
  default: true,
});

// Get setting
const result = settings.get("my-module", "enabled", v.boolean());
if (result.ok) {
  console.log(`Enabled: ${result.value}`);
}

// Set setting
await settings.set("my-module", "enabled", false);
```

### UI Operations

#### `PlatformUIPort`

Platform-agnostischer Port für UI-Operationen.

```typescript
interface PlatformUIPort {
  notify(message: string, level: NotificationLevel, options?: NotificationOptions): Result<void, UIError>;
  removeEntityElement(entityType: EntityType, entityId: string, html: HTMLElement): Result<boolean, UIError>;
  rerenderDirectory(directoryType: DirectoryType): Result<boolean, UIError>;
}
```

**Verwendung:**

```typescript
const ui = container.resolve(platformUIPortToken);

// Show notification
ui.notify("Settings saved", "info");

// Remove entity from DOM
const removed = ui.removeEntityElement("journal", "journal-123", htmlElement);
if (removed.ok && removed.value) {
  console.log("Entity removed from UI");
}

// Rerender directory
ui.rerenderDirectory("journal");
```
```

**Erfolgskriterien:**
- ✅ Alle 4 Port-Kategorien in API dokumentiert
- ✅ TypeScript-Interfaces mit vollständigen Signaturen
- ✅ Verwendungsbeispiele für jeden Port
- ✅ DI-Container-Resolution erklärt

---

### Step 4: PROJECT_ANALYSIS.md aktualisieren

**Datei:** `docs/PROJECT_ANALYSIS.md`

**Sektion "Architecture Principles" aktualisieren:**

```markdown
## Architecture Principles

### Clean Architecture

Das Projekt folgt den Prinzipien der Clean Architecture:

1. **Dependency Rule**: Abhängigkeiten zeigen immer nach innen (zu Domain)
2. **Ports & Adapters**: Infrastructure implementiert Domain-Ports
3. **Platform-Agnostic Domain**: Keine Foundry-Abhängigkeiten in Domain/Application
4. **Testability**: Alle Schichten testbar ohne Foundry-Globals

### Layered Architecture

```
Domain Layer (Ports & Entities)
  ↑ depends on
Application Layer (Use-Cases & Services)
  ↑ depends on
Infrastructure Layer (Adapters & Implementations)
```

**Domain Layer:**
- `PlatformEventPort<T>` / `JournalEventPort`
- `PlatformEntityCollectionPort<T>` / `JournalCollectionPort`
- `PlatformSettingsPort`
- `PlatformUIPort`

**Application Layer:**
- `InvalidateJournalCacheOnChangeUseCase`
- `ProcessJournalDirectoryOnRenderUseCase`
- `JournalVisibilityService`
- `ModuleSettingsRegistrar`

**Infrastructure Layer:**
- `FoundryJournalEventAdapter`
- `FoundryJournalCollectionAdapter`
- `FoundrySettingsAdapter`
- `FoundryUIAdapter`

### Multi-Platform Ready

Das Modul ist vorbereitet für:
- ✅ **Foundry VTT v13** (aktuell implementiert)
- 🎯 **Roll20** (theoretisch < 1 Woche portierbar)
- 🎯 **Fantasy Grounds** (theoretisch < 1 Woche portierbar)
- 🎯 **CSV/File-based** (für Testing)

**Neue Plattform hinzufügen:**
1. Implementiere alle `Xxx Port` Interfaces für die Plattform
2. Registriere Adapter im DI-Container
3. Fertig - keine Application-Layer-Änderungen nötig!
```

**Erfolgskriterien:**
- ✅ Architecture Principles aktualisiert
- ✅ Layered Architecture dokumentiert
- ✅ Multi-Platform-Strategie erklärt
- ✅ Beispiel für neue Plattform

---

### Step 5: DEPENDENCY_MAP.md aktualisieren

**Datei:** `docs/DEPENDENCY_MAP.md`

**Neue Dependency-Trees hinzufügen:**

```markdown
## Domain Ports

### Event Ports

```
JournalEventPort (interface)
├─ extends PlatformEventPort<JournalEvent>
└─ implemented by FoundryJournalEventAdapter
   └─ depends on FoundryHooks
      └─ implemented by FoundryHooksPort (v13)
         └─ wraps globalThis.Hooks
```

### Collection Ports

```
JournalCollectionPort (interface)
├─ extends PlatformEntityCollectionPort<JournalEntry>
└─ implemented by FoundryJournalCollectionAdapter
   └─ depends on FoundryGame
      └─ implemented by FoundryGamePort (v13)
         └─ wraps globalThis.game
```

### Settings Ports

```
PlatformSettingsPort (interface)
└─ implemented by FoundrySettingsAdapter
   └─ depends on FoundrySettings
      └─ implemented by FoundrySettingsPort (v13)
         └─ wraps globalThis.game.settings
```

### UI Ports

```
PlatformUIPort (interface)
└─ implemented by FoundryUIAdapter
   └─ depends on FoundryUI
      └─ implemented by FoundryUIPort (v13)
         └─ wraps globalThis.ui
```

## Use-Cases

### Cache Invalidation

```
InvalidateJournalCacheOnChangeUseCase
├─ depends on JournalEventPort (interface)
│  └─ resolved to FoundryJournalEventAdapter at runtime
├─ depends on CacheService
└─ depends on NotificationCenter
```

### Directory Processing

```
ProcessJournalDirectoryOnRenderUseCase
├─ depends on JournalEventPort (interface)
│  └─ resolved to FoundryJournalEventAdapter at runtime
├─ depends on JournalVisibilityService
└─ depends on NotificationCenter
```

## Services

### JournalVisibilityService

```
JournalVisibilityService
├─ depends on JournalCollectionPort (interface)
│  └─ resolved to FoundryJournalCollectionAdapter at runtime
├─ depends on PlatformDocumentPort (interface)
│  └─ resolved to FoundryDocumentAdapter at runtime
├─ depends on PlatformUIPort (interface)
│  └─ resolved to FoundryUIAdapter at runtime
├─ depends on NotificationCenter
└─ depends on CacheService
```

### ModuleSettingsRegistrar

```
ModuleSettingsRegistrar
├─ depends on PlatformSettingsPort (interface)
│  └─ resolved to FoundrySettingsAdapter at runtime
└─ depends on NotificationCenter
```
```

**Erfolgskriterien:**
- ✅ Alle Port-Dependencies dokumentiert
- ✅ Adapter-Chain bis zu Foundry-Globals sichtbar
- ✅ Use-Case-Dependencies aktualisiert
- ✅ Service-Dependencies aktualisiert

---

### Step 6: Migration-Guide erstellen

**Datei:** `docs/refactoring/MIGRATION_GUIDE.md`

```markdown
# Migration Guide: Clean Architecture Refactoring

**Zielgruppe**: Entwickler, die am Modul arbeiten oder es erweitern  
**Version**: 0.x.x → 1.0.0  
**Datum**: 2025-01-27

---

## 🎯 Überblick

Das Modul wurde von direkten Foundry-Abhängigkeiten auf platform-agnostische Ports umgestellt.

**Hauptänderungen:**
- ✅ Hook-Klassen → Use-Cases
- ✅ Foundry-Services → Domain-Ports
- ✅ Infrastructure-Dependencies → Port-Interfaces

---

## 📋 Migration-Schritte

### 1. Event-System Migration

**Vorher (Deprecated):**

```typescript
import { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";

class MyHook {
  constructor(private readonly foundryHooks: FoundryHooks) {}

  execute(): void {
    this.foundryHooks.on("createJournalEntry", (entry) => {
      console.log("Created:", entry.id);
    });
  }
}
```

**Nachher (Clean Architecture):**

```typescript
import { JournalEventPort } from "@/domain/ports/events/journal-event-port.interface";

class MyUseCase {
  constructor(private readonly journalEvents: JournalEventPort) {}

  execute(): Result<void, Error> {
    const result = this.journalEvents.onJournalCreated((event) => {
      console.log("Created:", event.journalId);
    });

    return result.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: new Error(result.error.message) };
  }

  dispose(): void {
    // Cleanup listeners
  }
}
```

**DI-Token:**
```typescript
// OLD: foundryHooksToken
// NEW: journalEventPortToken
```

---

### 2. Collection-Zugriff Migration

**Vorher (Deprecated):**

```typescript
import { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";

class MyService {
  constructor(private readonly foundryGame: FoundryGame) {}

  getJournals(): Result<JournalEntry[], Error> {
    return this.foundryGame.getJournalEntries();
  }
}
```

**Nachher (Clean Architecture):**

```typescript
import { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";

class MyService {
  constructor(private readonly journalCollection: JournalCollectionPort) {}

  getJournals(): Result<JournalEntry[], Error> {
    const result = this.journalCollection.getAll();
    
    return result.ok
      ? { ok: true, value: result.value }
      : { ok: false, error: new Error(result.error.message) };
  }
}
```

**DI-Token:**
```typescript
// OLD: foundryGameToken
// NEW: journalCollectionPortToken
```

---

### 3. Settings-System Migration

**Vorher (Deprecated):**

```typescript
import { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

class MyService {
  constructor(private readonly foundrySettings: FoundrySettings) {}

  registerSettings(): void {
    this.foundrySettings.register("my-module", "enabled", {
      name: "Enabled",
      scope: "world",
      type: Boolean,
      default: true,
    });
  }
}
```

**Nachher (Clean Architecture):**

```typescript
import { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";

class MyService {
  constructor(private readonly settings: PlatformSettingsPort) {}

  registerSettings(): Result<void, Error> {
    const result = this.settings.register("my-module", "enabled", {
      name: "Enabled",
      scope: "world",
      type: Boolean,
      default: true,
    });

    return result.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: new Error(result.error.message) };
  }
}
```

**DI-Token:**
```typescript
// OLD: foundrySettingsToken
// NEW: platformSettingsPortToken
```

---

### 4. UI-Operations Migration

**Vorher (Deprecated):**

```typescript
import { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

class MyService {
  constructor(private readonly foundryUI: FoundryUI) {}

  showNotification(message: string): void {
    this.foundryUI.notify(message, "info");
  }
}
```

**Nachher (Clean Architecture):**

```typescript
import { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";

class MyService {
  constructor(private readonly ui: PlatformUIPort) {}

  showNotification(message: string): Result<void, Error> {
    const result = this.ui.notify(message, "info");

    return result.ok
      ? { ok: true, value: undefined }
      : { ok: false, error: new Error(result.error.message) };
  }
}
```

**DI-Token:**
```typescript
// OLD: foundryUIToken
// NEW: platformUIPortToken
```

---

## 🔧 Testing-Updates

**Vorher (Foundry-Globals):**

```typescript
describe("MyHook", () => {
  beforeEach(() => {
    // Mock Foundry globals
    globalThis.Hooks = {
      on: vi.fn(),
      off: vi.fn(),
    };
  });

  it("should register hook", () => {
    const hook = new MyHook(mockFoundryHooks);
    hook.execute();

    expect(globalThis.Hooks.on).toHaveBeenCalledWith("createJournalEntry", expect.any(Function));
  });
});
```

**Nachher (Port-Mocks):**

```typescript
describe("MyUseCase", () => {
  let mockJournalEvents: JournalEventPort;

  beforeEach(() => {
    mockJournalEvents = {
      onJournalCreated: vi.fn().mockReturnValue({ ok: true, value: "1" }),
      onJournalUpdated: vi.fn(),
      onJournalDeleted: vi.fn(),
      onJournalDirectoryRendered: vi.fn(),
      registerListener: vi.fn(),
      unregisterListener: vi.fn(),
    };
  });

  it("should register listener", () => {
    const useCase = new MyUseCase(mockJournalEvents);
    useCase.execute();

    expect(mockJournalEvents.onJournalCreated).toHaveBeenCalled();
  });
});
```

---

## 📚 Weitere Ressourcen

- [ARCHITECTURE.md](../ARCHITECTURE.md): Architektur-Überblick
- [API.md](../API.md): Port-API-Dokumentation
- [Phase-1-Plan](./phases/phase-1-event-system-refactoring.md): Event-System Details
- [Phase-2-Plan](./phases/phase-2-entity-collections-refactoring.md): Collections Details
- [Phase-3-Plan](./phases/phase-3-settings-system-refactoring.md): Settings Details
- [Phase-4-Plan](./phases/phase-4-ui-operations-refactoring.md): UI Details

---

## ❓ FAQ

### Warum wurden Hooks zu Use-Cases?

Use-Cases sind platform-agnostisch und testbar ohne Foundry-Globals. Sie drücken Business-Logik aus, nicht technische Details.

### Kann ich noch FoundryHooks direkt nutzen?

Ja, bis Version 1.0.0. Aber bitte migriere zu Ports für bessere Testbarkeit und Platform-Unterstützung.

### Wie füge ich eine neue Plattform hinzu?

1. Implementiere alle Port-Interfaces für die Plattform
2. Registriere Adapter im DI-Container
3. Fertig - keine Application-Layer-Änderungen nötig!

### Muss ich alle Services sofort migrieren?

Nein, alte und neue APIs koexistieren bis Version 1.0.0. Migriere schrittweise.
```

**Erfolgskriterien:**
- ✅ Migration-Schritte für alle 4 Port-Kategorien
- ✅ Vorher/Nachher-Code-Beispiele
- ✅ DI-Token-Mapping
- ✅ Testing-Updates erklärt
- ✅ FAQ-Sektion

---

### Step 7: Alte Code-Dateien löschen

**Zu löschende Dateien:**

```bash
# Hook-Klassen (ersetzt durch Use-Cases)
rm src/application/hooks/RenderJournalDirectoryHook.ts
rm src/application/hooks/JournalCacheInvalidationHook.ts
rm -rf src/application/hooks/__tests__/

# Alte Tests (ersetzt durch Port-basierte Tests)
# (falls vorhanden und nicht bereits migriert)
```

**Zu aktualisierende Dateien:**

```bash
# FoundryGame Interface (alte Methoden entfernen/deprecaten)
# FoundryUI Interface (alte Methoden entfernen/deprecaten)
# Alle Barrel-Exports aktualisieren (index.ts Dateien)
```

**Checkliste:**
- [ ] Hook-Klassen gelöscht
- [ ] Hook-Tests gelöscht
- [ ] Deprecated-Kommentare in Foundry-Interfaces eingefügt
- [ ] Barrel-Exports aktualisiert
- [ ] `npm run check:all` läuft durch

---

### Step 8: Final Review und Tests

**Checkliste:**

#### Code Quality
- [ ] `npm run check:types` ✅ (keine TypeScript-Fehler)
- [ ] `npm run check:lint` ✅ (keine Lint-Fehler)
- [ ] `npm run check:format` ✅ (Code formatiert)
- [ ] `npm run test` ✅ (alle Tests grün)
- [ ] `npm run check:all` ✅ (alle Checks bestanden)

#### Documentation
- [ ] CHANGELOG.md vollständig aktualisiert
- [ ] ARCHITECTURE.md beschreibt Clean Architecture
- [ ] API.md dokumentiert alle Ports
- [ ] PROJECT_ANALYSIS.md aktualisiert
- [ ] DEPENDENCY_MAP.md zeigt Port-Dependencies
- [ ] MIGRATION_GUIDE.md erstellt

#### Code Organization
- [ ] Alle Port-Interfaces in `src/domain/ports/`
- [ ] Alle Adapter in `src/infrastructure/adapters/foundry/`
- [ ] Alle Use-Cases in `src/application/use-cases/`
- [ ] DI-Container registriert alle Ports
- [ ] Keine direkten Foundry-Abhängigkeiten in Application-Layer

#### Testing
- [ ] Alle Ports haben Contract-Tests
- [ ] Alle Adapter haben Unit-Tests
- [ ] Alle Use-Cases haben Unit-Tests
- [ ] Keine Tests benötigen Foundry-Globals
- [ ] Code-Coverage >= 80%

#### Git
- [ ] Alle Änderungen committed
- [ ] Commit-Messages folgen Conventional Commits
- [ ] Branch ist sauber (keine WIP-Commits)

---

## ✅ Checkliste

### Documentation Updates
- [ ] CHANGELOG.md aktualisiert (Unreleased-Sektion)
- [ ] ARCHITECTURE.md aktualisiert (Clean Architecture)
- [ ] API.md aktualisiert (alle Ports dokumentiert)
- [ ] PROJECT_ANALYSIS.md aktualisiert (Architecture Principles)
- [ ] DEPENDENCY_MAP.md aktualisiert (Port-Dependencies)
- [ ] MIGRATION_GUIDE.md erstellt (Vorher/Nachher)

### Code Cleanup
- [ ] Hook-Klassen gelöscht
- [ ] Hook-Tests gelöscht
- [ ] Deprecated-Kommentare eingefügt
- [ ] Barrel-Exports aktualisiert
- [ ] Alte Interfaces bereinigt

### Final Validation
- [ ] `npm run check:types` ✅
- [ ] `npm run check:lint` ✅
- [ ] `npm run check:format` ✅
- [ ] `npm run test` ✅
- [ ] `npm run check:all` ✅
- [ ] Code-Coverage >= 80%

### Git & Version Control
- [ ] Alle Änderungen committed
- [ ] Commit-Messages folgen Konvention
- [ ] Branch ist clean
- [ ] Ready für PR/Merge

---

## 🎯 Erfolgskriterien

Nach Abschluss dieser Phase:

- ✅ **Vollständige Dokumentation** aller Refactorings
- ✅ **Migration-Guide** für Entwickler verfügbar
- ✅ **Alter Code gelöscht** (kein toter Code)
- ✅ **Alle Tests grün** (`npm run check:all`)
- ✅ **Code-Coverage >= 80%**
- ✅ **Git-Historie sauber** (kein WIP)
- ✅ **Ready für Production** (Version 1.0.0 vorbereitet)

---

## 🎉 Fertig!

Das Clean-Architecture-Refactoring ist abgeschlossen!

**Nächste Schritte:**
1. ✅ PR erstellen und Review anfordern
2. ✅ Merge in main branch
3. ✅ Release vorbereiten (Version 1.0.0)
4. ✅ Weitere Plattformen implementieren (Roll20, Fantasy Grounds)

---

**Status:** ⏳ Bereit zur Umsetzung  
**Review erforderlich:** Nach Step 8  
**Zeitaufwand:** 4-6 Stunden

