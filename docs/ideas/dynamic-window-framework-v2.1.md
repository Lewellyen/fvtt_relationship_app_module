# Dynamic Window Framework - Architektur-Dokumentation (v2.1 - Refactored)

> **Version 2.1**: Überarbeitet basierend auf Review-Feedback. Adressiert kritische Design-Probleme: Ownership, Foundry-Integration, Bindings, EventBus-Typisierung, Renderer-Instances, Svelte-Reaktivität, Remote-Sync (window-scoped), State-Modell (Window-Local vs Shared Document State).

## 1. Ziel & Scope

### Was das System kann

- **Dynamische Fenster-Erzeugung**: Zur Laufzeit aus Konfiguration/Schema Fenster erstellen
- **Render-Engine-agnostisch**: Unterstützt Svelte, React, Vue, Handlebars (erweiterbar)
- **Typisiert**: Vollständige TypeScript-Typisierung mit Generics für State, Props, Result
- **Konfigurierbar**: JSON/TS-Config für Fenster-Definitionen (Titel, Größe, Position, Controls, Bindings)
- **State-Management**: Optional persistente Zustände (Client-Settings, Flags, JournalEntryPage)
- **Action-System**: Kommandos/Actions für Interaktionen (Command-Pattern)
- **Event-System**: Typisierter Event-Bus für Kommunikation zwischen Komponenten
- **Foundry-Integration**: Nahtlose Integration mit ApplicationV2, HandlebarsApplicationMixin
- **Testbar**: Unit-Tests ohne Foundry-Runtime durch Adapter-Pattern
- **Multi-Instance**: Mehrere Instanzen derselben Definition möglich

### Was das System nicht kann

- **Keine visuelle Designer-UI**: Definitionen werden programmatisch oder per Config erstellt
- **Keine automatische Layout-Engine**: Layouts müssen explizit definiert werden
- **Keine automatische Persistenz**: Persistenz muss explizit konfiguriert werden
- **Keine Business-Validierung**: Nur strukturelle Validierung (IDs unique, bindings valid), Business-Validierung via Actions

### State-Modell (Drei Ebenen)

**WICHTIG:** Das Framework nutzt **drei klar getrennte State-Ebenen**:
- **Window UI State** (Lebensdauer: WindowHandle) - Pro WindowHandle (Tabs/Modal/UI-State), reaktiv via StatePort
- **Shared Document State** (Lebensdauer: Browser-Session) - Globaler reaktiver Cache (RuneState Singleton), wird durch HookBridge aktualisiert; alle Fenster konsumieren ihn direkt
- **Persisted State** (Authority = Foundry DB) - Zugriff nur über Controller/Services

Diese Trennung verhindert Missverständnisse wie "Persist als State" oder "Shared Cache als lokalen State".

**Render-Policy:** Foundry rendert nur Container; UI-Updates erfolgen über StatePort (wenn Implementierung reaktiv ist, z.B. Runes bei Svelte). Persist setzt `render:false`. HookBridge ignoriert Updates nur, wenn `originWindowInstanceId` dem jeweiligen Controller entspricht (window-scoped, nicht client-scoped)

### Annahmen

- Foundry VTT v13+ mit ApplicationV2 API
- TypeScript 5.0+
- Moderne Build-Tools (Vite)
- Dependency Injection Container vorhanden
- Result-Pattern für Error-Handling
- Clean Architecture als Basis-Architektur

---

## 2. Begriffe/Glossar

| Begriff | Beschreibung |
|---------|--------------|
| **Window** | Ein gerendertes Fenster in Foundry (ApplicationV2-Instanz) |
| **WindowDefinition** | Schema/Konfiguration für ein Fenster (statisch, wiederverwendbar) |
| **WindowInstance** | Konkrete Instanz eines Fensters (dynamisch, eindeutige ID) |
| **WindowController** | Orchestriert Lifecycle, Bindings, Actions, Props (Kernstück) |
| **Control** | UI-Element innerhalb eines Fensters (Button, Text, Select, Table, Tabs, etc.) |
| **ControlDefinition** | Schema für ein Control (Typ, Props, Bindings) |
| **Binding** | Verbindung zwischen Control-State und Data-Source (StateStore, Flag, Setting) |
| **BindingEngine** | Normalisiert und verwaltet Bindings (lokal + global) |
| **Action** | Ausführbare Operation (Command-Pattern) - z.B. "Save", "Close", "Delete" |
| **ActionDefinition** | Schema für eine Action (Handler, Permissions, Validation) |
| **StateStore** | Zustandsverwaltung für Fenster-Daten (in-memory oder persistent) |
| **Renderer** | Konkrete Render-Engine-Implementierung (SvelteRenderer, ReactRenderer, etc.) |
| **RenderAdapter** | Abstraktion für Render-Engine (mount, unmount, update) |
| **FoundryAdapter** | Adapter für Foundry-spezifische APIs (ApplicationV2, Settings, Flags) |
| **WindowFactory** | Erzeugt Fenster aus WindowDefinition |
| **WindowRegistry** | Verwaltet WindowDefinitions und WindowInstances (Lookup, Lifecycle) |
| **EventBus** | Typisiertes Event-System für Kommunikation zwischen Komponenten |
| **PersistAdapter** | Adapter für Persistenz (Settings, Flags, JournalEntryPage) |
| **ViewModel** | Abgeleiteter State + computed values für UI-Komponenten |
| **StatePort** | State-API (get/patch/subscribe) - engine-agnostisch, **kann** reaktiv sein (z.B. RuneState) |
| **RuneState** | Infrastructure-Implementierung von StatePort für Svelte (intern $state) - Reference Implementation |
| **RemoteSyncGate** | Origin-Tracking für Persist (window-scoped, verhindert Ping-Pong) |
| **GlobalDocumentCache** | Singleton-Cache für Shared Document State (Reference Implementation mit RuneState für Svelte, kann reaktiv sein) |
| **Window-Local State** | Pro WindowHandle (Tabs/Modal/UI-State), kann reaktiv sein via StatePort |
| **Shared Document State** | Globaler Cache, wird durch HookBridge aktualisiert, kann reaktiv sein |

---

## 3. High-Level Architektur (Refactored)

### Komponentenliste

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                          │
├─────────────────────────────────────────────────────────────┤
│  WindowFactory  │  WindowRegistry  │  WindowConfigBuilder     │
│  WindowController│  ActionDispatcher│  EventBus (typed)       │
│  RendererRegistry│  BindingEngine   │  ViewModelBuilder       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                            │
├─────────────────────────────────────────────────────────────┤
│  WindowDefinition  │  ControlDefinition  │  ActionDefinition   │
│  RenderEnginePort  │  StateStorePort    │  PersistPort        │
│  WindowHandle     │  ComponentDescriptor│  BindingDescriptor   │
│  WindowControllerPort│  EventMap (typed) │  ViewModel           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│  FoundryWindowAdapter │  FoundryApplicationWrapper            │
│  SvelteRenderer      │  HandlebarsRenderer                   │
│  SettingsPersistAdapter │  FlagsPersistAdapter                │
└─────────────────────────────────────────────────────────────┘
```

### Verantwortlichkeiten (Refactored)

| Komponente | Verantwortlichkeit |
|------------|-------------------|
| **WindowFactory** | Erzeugt WindowController + Foundry-App aus WindowDefinition |
| **WindowController** | **Kernstück**: Orchestriert Lifecycle, Bindings, Props, Actions |
| **WindowRegistry** | Verwaltet Definitions (statisch) + Instances (dynamisch) |
| **WindowConfigBuilder** | Baut WindowDefinition schrittweise auf (Fluent API) |
| **BindingEngine** | Normalisiert Bindings (Control-local → global), verwaltet Bindings |
| **ActionDispatcher** | Führt Actions aus (Command-Pattern) |
| **EventBus** | Typisiertes Event-System (EventMap-basiert) |
| **RendererRegistry** | Verwaltet Render-Engine-Implementierungen |
| **ViewModelBuilder** | Erstellt ViewModel aus State + Bindings für UI |
| **FoundryWindowAdapter** | Foundry-spezifische Window-Integration |
| **FoundryApplicationWrapper** | Dünne Wrapper-Klasse, delegiert an WindowController |
| **Renderer (Svelte/React/etc.)** | Mountet/Unmountet Components (engine-spezifische Instances) |
| **StateStore** | Zustandsverwaltung (in-memory) |
| **PersistAdapter** | Persistenz (Settings, Flags, etc.) |

### Ownership-Graph (Klar definiert)

```
WindowHandle
  └─► WindowController (besitzt)
      ├─► FoundryAppInstance (referenziert, nicht besitzt)
      ├─► ComponentInstance (besitzt)
      ├─► StateStore (referenziert)
      ├─► BindingEngine (besitzt)
      └─► ViewModel (besitzt, cached)

FoundryApplicationWrapper
  └─► WindowController (referenziert via Closure/WeakMap)
      └─► Bei render/close: ruft Controller zurück
```

### Datenfluss (Refactored)

```
1. WindowDefinition (Config/TS)
   │
   ▼
2. WindowFactory.createWindow(definitionId, instanceKey?, overrides?)
   │
   ├─► WindowRegistry.getDefinition(definitionId)
   ├─► WindowController erstellen (mit allen Dependencies)
   ├─► FoundryApplicationWrapper.build() → dünne App-Klasse
   │   └─► App-Klasse speichert Controller-Reference (Closure/WeakMap)
   ├─► WindowInstance erstellen (eindeutige ID: `${definitionId}:${instanceKey || uuid}`)
   ├─► WindowRegistry.registerInstance(instance)
   │
   ▼
3. WindowController.render() / FoundryApp.render()
   │
   ├─► Foundry ApplicationV2.render() (Foundry-Lifecycle)
   ├─► WindowController.onFoundryRender(element)
   │   ├─► BindingEngine.initialize()
   │   ├─► ViewModelBuilder.build() → ViewModel
   │   ├─► RendererRegistry.get(definition.component.type)
   │   ├─► Renderer.mount(component, target, viewModel)
   │   │   └─► Svelte/React/Vue/Handlebars rendert
   │   └─► Event-Listener registrieren
   │
   ▼
4. User-Interaktion (Button-Click, Input-Change)
   │
   ├─► UI-Component → EventBus.emit('control:action', { controlId, actionId })
   │
   ▼
5. WindowController.handleControlAction(controlId, actionId)
   │
   ├─► ActionDispatcher.dispatch(actionId, context)
   │   ├─► Permission-Check
   │   ├─► Validation
   │   ├─► Confirm (wenn nötig)
   │   └─► Action.handler(context)
   │       ├─► StateStore.update(...)
   │       ├─► PersistAdapter.save(...) (wenn autoSave)
   │       └─► EventBus.emit('action:completed', ...)
   │
   ▼
6. WindowController.update() / Re-render
   │
   ├─► ViewModelBuilder.build() → neues ViewModel
   ├─► Renderer.update(instance, newViewModel)
   └─► BindingEngine.sync() (wenn twoWay-Bindings)
```

---

## 4. Domain Model / Typen (Refactored)

### WindowDefinition (Trennung: Definition vs Instance)

```typescript
// src/domain/types/window-definition.interface.ts

export interface WindowDefinition {
  readonly definitionId: string; // Statisch, wiederverwendbar
  readonly title?: string;
  readonly icon?: string;
  readonly component: ComponentDescriptor;
  readonly features?: WindowFeatures;
  readonly position?: WindowPosition;
  readonly controls?: ControlDefinition[];
  readonly actions?: ActionDefinition[];
  readonly bindings?: BindingDescriptor[]; // Globale Bindings (Cross-Control)
  readonly dependencies?: DependencyDescriptor[]; // Document-Dependencies für Relevanz-Prüfung
  readonly persist?: PersistConfig;
  readonly classes?: string[];
  readonly metadata?: Record<string, unknown>;
}

export interface DependencyDescriptor {
  readonly type: "document" | "setting" | "flag" | "custom";
  readonly documentType?: string; // z.B. "Actor", "Item"
  readonly documentId?: string; // Optional: spezifisches Document
  readonly namespace?: string; // Für settings/flags
  readonly key?: string; // Für settings/flags
}

export interface WindowFeatures {
  readonly resizable?: boolean;
  readonly minimizable?: boolean;
  readonly draggable?: boolean;
  readonly closable?: boolean;
  readonly pinned?: boolean;
}

export interface WindowPosition {
  readonly width?: number;
  readonly height?: number;
  readonly left?: number;
  readonly top?: number;
  readonly centered?: boolean;
}
```

### ComponentDescriptor

```typescript
// src/domain/types/component-descriptor.interface.ts

export interface ComponentDescriptor {
  readonly type: RenderEngineType;
  readonly component: unknown; // Render-engine-spezifisch
  readonly props?: Record<string, unknown>; // Statische Props
  readonly wrapper?: ComponentWrapperConfig;
}

export type RenderEngineType = "svelte" | "react" | "vue" | "handlebars";

export interface ComponentWrapperConfig {
  readonly errorBoundary?: boolean;
  readonly loadingState?: boolean;
  readonly containerClass?: string;
}
```

### ControlDefinition (Bindings nur lokal, werden normalisiert)

```typescript
// src/domain/types/control-definition.interface.ts

export interface ControlDefinition {
  readonly id: string;
  readonly type: ControlType;
  readonly label?: string;
  readonly placeholder?: string;
  readonly binding?: BindingDescriptor; // Lokales Binding (Shortcut)
  readonly validation?: ValidationRule[];
  readonly actions?: ControlActionMapping; // Mapping: Event → Action-ID
  readonly props?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export type ControlType =
  | "button"
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox"
  | "radio"
  | "table"
  | "tabs"
  | "custom";

export interface ControlActionMapping {
  readonly primaryAction?: string; // Button: Click
  readonly onChangeAction?: string; // Input: Change
  readonly onFocusAction?: string; // Input: Focus
  readonly onBlurAction?: string; // Input: Blur
}

export interface ValidationRule {
  readonly type: "required" | "min" | "max" | "pattern" | "custom";
  readonly value?: unknown;
  readonly message?: string;
  readonly validator?: (value: unknown) => boolean;
}
```

### BindingDescriptor (Normalisiert: lokal + global)

**WICHTIG für Svelte-first Windows:**
- Bindings sind primär für **StateStore ↔ PersistSource ↔ RemoteSync**
- `target.ui` ist optional (nur für Schema-UI-Builder relevant)
- Bei Svelte-Komponenten: StatePort wird direkt verwendet, Bindings für externe Sync

**Zwei Binding-Klassen:**

1. **SyncBinding** (Primär): Persist/Docs/Settings/Flags ↔ StateKey
   - Initial-Werte aus Persist/Docs in State bringen
   - Writes (persist/flags/settings/document updates) kontrolliert ausführen (debounced/explicit)
   - Keine UI-Verdrahtung bei Svelte-first Windows

2. **SchemaUiBinding** (Optional): Nur wenn schema-driven Controls gerendert werden
   - UI-Teil in `target.ui` (controlId/property)
   - Nicht nötig, wenn "echte" Svelte-Components verwendet werden

```typescript
// src/domain/types/binding-descriptor.interface.ts

export interface BindingDescriptor {
  readonly id: string;
  readonly type?: "sync" | "schema-ui"; // Default: "sync"
  readonly source: BindingSource;
  readonly target: BindingTarget; // stateKey (primär), ui (optional für schema-ui)
  readonly transform?: BindingTransform;
  readonly twoWay?: boolean;
  readonly syncPolicy?: BindingSyncPolicy; // "manual" | "debounced" | "immediate"
  readonly debounceMs?: number; // Für "debounced"
}

export interface BindingSource {
  readonly type: "state" | "setting" | "flag" | "journal" | "custom";
  readonly key: string;
  readonly namespace?: string;
  readonly documentId?: string;
}

export interface BindingTarget {
  readonly stateKey: string; // State-Key im StateStore (primär)
  readonly ui?: {
    readonly controlId: string;
    readonly property: string; // z.B. "value", "checked", "text" (optional, für Schema-UI)
  };
}

export type BindingTransform = (value: unknown) => unknown;

// Normalisierte Binding (nach BindingEngine-Normalisierung)
export interface NormalizedBinding extends BindingDescriptor {
  readonly sourceControlId?: string; // Für twoWay-Bindings
  readonly isLocal: boolean; // true = aus ControlDefinition, false = global
}
```

### ActionDefinition (mit generischem Context)

```typescript
// src/domain/types/action-definition.interface.ts

export interface ActionDefinition {
  readonly id: string;
  readonly label?: string;
  readonly icon?: string;
  readonly handler: ActionHandler;
  readonly permissions?: PermissionCheck[];
  readonly validation?: ActionValidationRule[];
  readonly confirm?: ConfirmConfig;
  readonly metadata?: Record<string, unknown>;
}

export type ActionHandler<TState = Record<string, unknown>> = (
  context: ActionContext<TState>
) => Promise<Result<void, ActionError>> | Result<void, ActionError>;

export interface ActionContext<TState = Record<string, unknown>> {
  readonly windowInstanceId: string;
  readonly controlId?: string;
  readonly state: Readonly<TState>;
  readonly event?: Event;
  readonly metadata?: Record<string, unknown>;
}

export interface PermissionCheck {
  readonly type: "user" | "gm" | "custom";
  readonly check?: (context: ActionContext) => boolean;
}

export interface ConfirmConfig {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}
```

### PersistConfig (getrennt von Bindings)

```typescript
// src/domain/types/persist-config.interface.ts

export interface PersistConfig {
  readonly type: "setting" | "flag" | "journal" | "custom";
  readonly key: string;
  readonly namespace?: string;
  readonly documentId?: string;
  readonly scope?: "client" | "world";
  readonly autoSave?: boolean;
  readonly restoreOnOpen?: boolean;
}

// PersistConfig speichert IMMER den kompletten Window-State
// Bindings können zusätzlich einzelne Felder mappen (z.B. für externe Datenquellen)
```

### WindowHandle & WindowInstance (Ownership klar)

```typescript
// src/domain/types/window-handle.interface.ts

export interface WindowHandle {
  readonly instanceId: string; // Eindeutig: `${definitionId}:${instanceKey || uuid}`
  readonly definitionId: string; // Referenz auf Definition
  readonly controller: IWindowController; // Besitzt Controller
  readonly definition: Readonly<WindowDefinition>;

  show(): Promise<Result<void, WindowError>>;
  hide(): Promise<Result<void, WindowError>>;
  close(): Promise<Result<void, WindowError>>;
  update(state: Partial<Record<string, unknown>>): Promise<Result<void, WindowError>>;
  persist(): Promise<Result<void, WindowError>>;
  restore(): Promise<Result<void, WindowError>>;
}

export interface WindowInstance {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly foundryApp?: ApplicationV2; // Referenz (nicht besessen)
  readonly element?: HTMLElement; // Referenz (nicht besessen)
  readonly componentInstance?: ComponentInstance; // Besessen von Controller
}
```

### ComponentInstance (Discriminated Union für engine-spezifische Payloads)

```typescript
// src/domain/types/component-instance.interface.ts

export type ComponentInstance =
  | SvelteComponentInstance
  | ReactComponentInstance
  | VueComponentInstance
  | HandlebarsComponentInstance;

export interface BaseComponentInstance {
  readonly id: string;
  readonly type: RenderEngineType;
  readonly element: HTMLElement;
  readonly props: Readonly<Record<string, unknown>>;
}

export interface SvelteComponentInstance extends BaseComponentInstance {
  readonly type: "svelte";
  readonly instance: SvelteComponent; // Svelte-spezifisch
}

export interface ReactComponentInstance extends BaseComponentInstance {
  readonly type: "react";
  readonly root: Root; // React-spezifisch
}

export interface VueComponentInstance extends BaseComponentInstance {
  readonly type: "vue";
  readonly app: App; // Vue-spezifisch
}

export interface HandlebarsComponentInstance extends BaseComponentInstance {
  readonly type: "handlebars";
  readonly template: TemplateDelegate; // Handlebars-spezifisch
}
```

### ViewModel (Props-Strategie: UI bekommt ViewModel)

```typescript
// src/domain/types/view-model.interface.ts

export interface ViewModel {
  readonly state: IWindowState<Record<string, unknown>>; // State-API (kann reaktiv sein, nicht Plain Object)
  readonly computed: Readonly<Record<string, unknown>>; // Abgeleitete Werte
  readonly actions: Readonly<Record<string, () => void>>; // Callable functions
  readonly i18n?: I18nHelper;
  readonly logger?: Logger;
  readonly bus?: IEventBus;
}

// StatePort für reaktive State-Verwaltung (Svelte-first, aber engine-agnostisch)
export interface IWindowState<T = Record<string, unknown>> {
  /**
   * Holt den aktuellen State.
   *
   * **Reaktivität ist eine Eigenschaft der konkreten Implementierung:**
   * - RuneState (Svelte): gibt **bewusst** den reaktiven $state-Proxy zurück (als Readonly<T> typisiert).
   *   Dieser darf von Svelte-Komponenten direkt gelesen und gebunden werden.
   * - ObservableState: kann EventEmitter-basiert sein
   * - PlainState: kann ein einfaches Objekt sein
   *
   * ACHTUNG:
   * - Nicht serialisieren (wenn Proxy)
   * - Nicht tief klonen (wenn Proxy)
   * - Für Non-Svelte Engines snapshot() verwenden
   */
  get(): Readonly<T>;

  /**
   * Aktualisiert State (idempotent: nur ändern wenn value differs).
   */
  patch(updates: Partial<T>): void;

  /**
   * Registriert einen Listener für State-Änderungen.
   *
   * **Reaktivität ist implementierungsabhängig:**
   * - RuneState (Svelte): Für Svelte **nicht** für UI-Reaktivität gedacht (Svelte reagiert automatisch auf $state).
   *   Primär für Logging/Debug.
   * - ObservableState: subscribe() ist der primäre Mechanismus für Reaktivität.
   * - PlainState: subscribe() kann EventBus-basiert sein.
   */
  subscribe(fn: (value: Readonly<T>) => void): () => void; // Unsubscribe-Funktion

  /**
   * Optional: Erstellt einen strukturierten Snapshot (für Non-Svelte Engines).
   */
  snapshot?(): Readonly<T>;
}

// HINWEIS: RuneState ist eine Infrastructure-Implementierung, nicht Teil der Domain.
// Siehe: src/infrastructure/state/rune-state.ts
```

### IStatePortFactory (Application-Port, engine-agnostisch)

```typescript
// src/application/ports/state-port-factory-port.interface.ts

export interface IStatePortFactory {
  /**
   * Erstellt einen StatePort für eine Window-Instanz.
   *
   * Die konkrete Implementierung (RuneState, ObservableState, etc.) wird
   * in Infrastructure/Composition Root bestimmt (z.B. basierend auf Renderer-Type).
   *
   * @param instanceId - Window-Instanz-ID
   * @param initial - Initialer State
   * @returns StatePort-Instanz
   */
  create<T extends Record<string, unknown>>(
    instanceId: string,
    initial: T
  ): IWindowState<T>;
}
```

### ISharedDocumentCache (Application-Port, engine-agnostisch)

```typescript
// src/application/ports/shared-document-cache-port.interface.ts

export interface ISharedDocumentCache {
  patchActor(actorId: string, updates: Partial<ActorSnapshot>): void;
  patchItem(itemId: string, updates: Partial<ItemSnapshot>): void;
  getActor(actorId: string): ActorSnapshot | undefined;
  getItem(itemId: string): ItemSnapshot | undefined;
  // ... weitere Methoden
}
```

### EventMap (Typisiertes Event-System)

```typescript
// src/domain/types/event-map.interface.ts

export interface WindowEventMap {
  "window:created": { instanceId: string; definitionId: string };
  "window:rendered": { instanceId: string };
  "window:closed": { instanceId: string };
  "control:action": { instanceId: string; controlId: string; actionId: string; event?: Event };
  "control:changed": { instanceId: string; controlId: string; value: unknown };
  "action:completed": { instanceId: string; actionId: string; success: boolean };
  "action:failed": { instanceId: string; actionId: string; error: ActionError };
  "state:updated": { instanceId: string; key: string; value: unknown };
  "binding:synced": { instanceId: string; bindingId: string };
}
```

---

## 5. Interfaces (Refactored)

### IWindowController (Kernstück)

```typescript
// src/domain/ports/window-controller-port.interface.ts

export interface IWindowController {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly definition: Readonly<WindowDefinition>;
  readonly state: Readonly<Record<string, unknown>>;

  /**
   * Wird von FoundryApplicationWrapper bei render() aufgerufen (nur beim ersten Render).
   *
   * @param element - Gerendertes Foundry-Element
   * @returns Result
   */
  onFoundryRender(element: HTMLElement): Promise<Result<void, WindowError>>;

  /**
   * Wird von FoundryApplicationWrapper bei render() aufgerufen (bei weiteren Renders).
   *
   * @param element - Gerendertes Foundry-Element
   * @returns Result
   */
  onFoundryUpdate(element: HTMLElement): Promise<Result<void, WindowError>>;

  /**
   * Wird von FoundryApplicationWrapper bei close() aufgerufen.
   *
   * @returns Result
   */
  onFoundryClose(): Promise<Result<void, WindowError>>;

  /**
   * Aktualisiert den State lokal (UI + optional Persist mit Origin-Meta).
   *
   * **Semantik:** "Local" bedeutet **User-Origin**, nicht "nicht-persistent".
   * Local = User Interaction / Action Result
   *
   * @param updates - Partial State
   * @param options - Update-Optionen
   * @param options.persist - Optional: Persistieren mit Origin-Meta
   * @param options.sync - Sync-Policy: "none" | "debounced" | "immediate" (Default: "none")
   * @returns Result
   */
  updateStateLocal(
    updates: Partial<Record<string, unknown>>,
    options?: {
      persist?: boolean;
      sync?: "none" | "debounced" | "immediate";
    }
  ): Promise<Result<void, WindowError>>;

  /**
   * Wendet Remote-Patch an (ohne erneutes Persistieren, verhindert Ping-Pong).
   *
   * @param updates - Partial State
   * @returns Result
   */
  applyRemotePatch(updates: Partial<Record<string, unknown>>): Promise<Result<void, WindowError>>;

  /**
   * Führt eine Action aus.
   *
   * @param actionId - Action-ID
   * @param controlId - Optional: Control-ID
   * @param event - Optional: DOM-Event
   * @returns Result
   */
  dispatchAction(actionId: string, controlId?: string, event?: Event): Promise<Result<void, WindowError>>;

  /**
   * Persistiert den aktuellen State.
   *
   * @param meta - Optional: Origin-Meta für Remote-Sync
   * @returns Result
   */
  persist(meta?: PersistMeta): Promise<Result<void, WindowError>>;

  /**
   * Lädt persistierten State.
   *
   * @returns Result
   */
  restore(): Promise<Result<void, WindowError>>;

  /**
   * Gibt ViewModel für UI-Component zurück.
   *
   * @returns ViewModel
   */
  getViewModel(): ViewModel;
}
```

### IWindowFactory

```typescript
// src/domain/ports/window-factory-port.interface.ts

export interface IWindowFactory {
  /**
   * Erstellt ein Fenster aus einer WindowDefinition-ID.
   *
   * @param definitionId - Definition-ID (statisch)
   * @param instanceKey - Optional: Instanz-Key (für mehrere Instanzen)
   * @param overrides - Optionale Overrides für die Definition
   * @returns Result mit WindowHandle oder Fehler
   */
  createWindow(
    definitionId: string,
    instanceKey?: string,
    overrides?: Partial<WindowDefinition>
  ): Promise<Result<WindowHandle, WindowError>>;
}
```

### IWindowRegistry

```typescript
// src/domain/ports/window-registry-port.interface.ts

export interface IWindowRegistry {
  /**
   * Registriert eine WindowDefinition (statisch).
   *
   * @param definition - WindowDefinition
   * @returns Result
   */
  registerDefinition(definition: WindowDefinition): Result<void, WindowError>;

  /**
   * Holt eine WindowDefinition per ID.
   *
   * @param definitionId - Definition-ID
   * @returns Result mit Definition oder Fehler
   */
  getDefinition(definitionId: string): Result<WindowDefinition, WindowError>;

  /**
   * Registriert eine WindowInstance (dynamisch).
   *
   * @param instance - WindowInstance
   * @returns Result
   */
  registerInstance(instance: WindowInstance): Result<void, WindowError>;

  /**
   * Holt eine WindowInstance per ID.
   *
   * @param instanceId - Instanz-ID
   * @returns Result mit Instance oder Fehler
   */
  getInstance(instanceId: string): Result<WindowInstance, WindowError>;

  /**
   * Entfernt eine WindowInstance aus der Registry.
   *
   * @param instanceId - Instanz-ID
   * @returns Result
   */
  unregisterInstance(instanceId: string): Result<void, WindowError>;

  /**
   * Listet alle aktiven Instanzen.
   *
   * @returns Array von WindowInstance
   */
  listInstances(): ReadonlyArray<WindowInstance>;

  /**
   * Listet alle Instanzen einer Definition.
   *
   * @param definitionId - Definition-ID
   * @returns Array von WindowInstance
   */
  listInstancesByDefinition(definitionId: string): ReadonlyArray<WindowInstance>;
}
```

### IEventBus (Typisiert)

```typescript
// src/domain/ports/event-bus-port.interface.ts

export interface IEventBus {
  /**
   * Emittiert ein typisiertes Event.
   *
   * @param event - Event-Name (keyof EventMap)
   * @param payload - Event-Payload (typisiert)
   * @returns void
   */
  emit<K extends keyof WindowEventMap>(event: K, payload: WindowEventMap[K]): void;

  /**
   * Registriert einen typisierten Event-Listener.
   *
   * @param event - Event-Name (keyof EventMap)
   * @param handler - Event-Handler (typisiert)
   * @returns Unsubscribe-Funktion
   */
  on<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): () => void;

  /**
   * Entfernt einen Event-Listener.
   *
   * @param event - Event-Name
   * @param handler - Event-Handler
   * @returns void
   */
  off<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void;

  /**
   * Registriert einen einmaligen Event-Listener.
   *
   * @param event - Event-Name
   * @param handler - Event-Handler
   * @returns void
   */
  once<K extends keyof WindowEventMap>(
    event: K,
    handler: (payload: WindowEventMap[K]) => void
  ): void;
}
```

### IRenderEnginePort (Generisch für engine-spezifische Instances)

```typescript
// src/domain/ports/render-engine-port.interface.ts

export interface IRenderEnginePort<TInstance extends ComponentInstance = ComponentInstance> {
  /**
   * Mountet eine Component in ein Target-Element.
   *
   * @param descriptor - ComponentDescriptor
   * @param target - HTMLElement
   * @param viewModel - ViewModel für Props
   * @returns Result mit ComponentInstance oder Fehler
   */
  mount(
    descriptor: ComponentDescriptor,
    target: HTMLElement,
    viewModel: ViewModel
  ): Result<TInstance, RenderError>;

  /**
   * Unmountet eine Component.
   *
   * @param instance - ComponentInstance
   * @returns Result
   */
  unmount(instance: TInstance): Result<void, RenderError>;

  /**
   * Aktualisiert ViewModel einer gemounteten Component.
   *
   * @param instance - ComponentInstance
   * @param viewModel - Neues ViewModel
   * @returns Result
   */
  update(instance: TInstance, viewModel: ViewModel): Result<void, RenderError>;
}
```

### IFoundryWindowAdapter

```typescript
// src/infrastructure/adapters/foundry/window/foundry-window-adapter.interface.ts

export interface IFoundryWindowAdapter {
  /**
   * Erstellt eine dünne Foundry ApplicationV2-Wrapper-Klasse.
   * Die Klasse delegiert alle Lifecycle-Calls an WindowController.
   *
   * @param definition - WindowDefinition
   * @param controller - WindowController (wird via Closure/WeakMap gespeichert)
   * @param instanceId - Eindeutige Instanz-ID (für Multi-Instance-Support)
   * @returns Result mit Application-Klasse oder Fehler
   */
  buildApplicationWrapper(
    definition: WindowDefinition,
    controller: IWindowController,
    instanceId: string
  ): Result<ApplicationClass, WindowError>;

  /**
   * Rendert ein Fenster in Foundry.
   *
   * @param instance - WindowInstance
   * @param force - Force re-render
   * @returns Result
   */
  renderWindow(instance: WindowInstance, force?: boolean): Promise<Result<void, WindowError>>;

  /**
   * Schließt ein Fenster in Foundry.
   *
   * @param instance - WindowInstance
   * @returns Result
   */
  closeWindow(instance: WindowInstance): Promise<Result<void, WindowError>>;
}

export type ApplicationClass = new (...args: unknown[]) => ApplicationV2;
```

### IRemoteSyncGate

```typescript
// src/domain/ports/remote-sync-gate-port.interface.ts

export interface IRemoteSyncGate {
  /**
   * Erstellt PersistMeta für einen Save-Vorgang.
   *
   * @param instanceId - Window-Instanz-ID
   * @returns PersistMeta mit Origin-Informationen
   */
  makePersistMeta(instanceId: string): PersistMeta;

  /**
   * Prüft, ob ein Update von einem bestimmten Window stammt (verhindert Ping-Pong).
   * WICHTIG: Window-scoped, nicht Client-scoped!
   *
   * @param options - Foundry Update-Options (mit Origin-Meta)
   * @param instanceId - Window-Instanz-ID, für die geprüft werden soll
   * @returns true wenn Update von diesem Window, false wenn remote oder anderes Window
   */
  isFromWindow(options: Record<string, unknown> | undefined, instanceId: string): boolean;

  /**
   * Holt die aktuelle Client-ID.
   *
   * @returns Client-ID
   */
  getClientId(): string;
}
```

---

## 6. Klassenentwurf (Refactored)

### WindowController (Kernstück)

```typescript
// src/application/services/window-controller.ts

export class WindowController implements IWindowController {
  static dependencies = [
    windowRegistryToken,
    stateStoreToken,
    statePortFactoryToken, // WICHTIG: Factory, nicht konkrete Implementierung
    actionDispatcherToken,
    rendererRegistryToken,
    bindingEngineToken,
    viewModelBuilderToken,
    eventBusToken,
    remoteSyncGateToken,
    persistAdapterToken,
  ] as const;

  readonly instanceId: string;
  readonly definitionId: string;
  readonly definition: Readonly<WindowDefinition>;

  private componentInstance?: ComponentInstance;
  private foundryApp?: ApplicationV2;
  private element?: HTMLElement;
  private cachedViewModel?: ViewModel;
  private statePort: IWindowState<Record<string, unknown>>;
  private isMounted = false;

  constructor(
    instanceId: string,
    definitionId: string,
    definition: WindowDefinition,
    private readonly registry: IWindowRegistry,
    private readonly stateStore: IStateStore,
    private readonly actionDispatcher: IActionDispatcher,
    private readonly rendererRegistry: IRendererRegistry,
    private readonly bindingEngine: IBindingEngine,
    private readonly viewModelBuilder: IViewModelBuilder,
    private readonly eventBus: IEventBus,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly persistAdapter?: IPersistAdapter
  ) {
    this.instanceId = instanceId;
    this.definitionId = definitionId;
    this.definition = definition;

    // StatePort erstellen (reaktive State-API)
    this.statePort = this.createStatePort();
  }

  get state(): Readonly<Record<string, unknown>> {
    const result = this.stateStore.getAll(this.instanceId);
    return result.ok ? result.value : {};
  }

  async onFoundryRender(element: HTMLElement): Promise<Result<void, WindowError>> {
    if (this.isMounted) {
      // Bereits gemountet - sollte nicht passieren, aber sicherheitshalber
      return ok(undefined);
    }

    this.element = element;

    // 1. Bindings initialisieren
    const bindResult = this.bindingEngine.initialize(this.definition, this.instanceId);
    if (!bindResult.ok) return err(bindResult.error);

    // 2. ViewModel erstellen (mit StatePort statt Plain Object)
    const viewModel = this.viewModelBuilder.build(
      this.definition,
      this.statePort, // StatePort statt Plain Object
      this.createActions()
    );
    this.cachedViewModel = viewModel;

    // 3. Renderer holen
    const rendererResult = this.rendererRegistry.get(this.definition.component.type);
    if (!rendererResult.ok) return err(rendererResult.error);

    // 4. Mount-Point finden
    const mountPoint = element.querySelector("#svelte-mount-point") as HTMLElement;
    if (!mountPoint) {
      return err({
        code: "MountPointNotFound",
        message: "Mount point #svelte-mount-point not found",
      });
    }

    // 5. Component mounten
    const mountResult = rendererResult.value.mount(
      this.definition.component,
      mountPoint,
      viewModel
    );
    if (!mountResult.ok) return err(mountResult.error);

    this.componentInstance = mountResult.value;
    this.isMounted = true;

    // 6. Event-Listener registrieren
    this.registerEventListeners();

    // 7. Event emittieren
    this.eventBus.emit("window:rendered", { instanceId: this.instanceId });

    return ok(undefined);
  }

  async onFoundryUpdate(element: HTMLElement): Promise<Result<void, WindowError>> {
    // Bei weiteren Renders: Kein Re-Mount, nur Update (wenn nötig)
    // Bei Svelte mit RuneState ist normalerweise kein Update nötig (reaktiv)
    return ok(undefined);
  }

  async onFoundryClose(): Promise<Result<void, WindowError>> {
    // 1. Component unmounten
    if (this.componentInstance) {
      const rendererResult = this.rendererRegistry.get(this.definition.component.type);
      if (rendererResult.ok) {
        rendererResult.value.unmount(this.componentInstance);
      }
      this.componentInstance = undefined;
    }

    this.isMounted = false;

    // 2. Persistieren (wenn konfiguriert, mit Origin-Meta)
    if (this.definition.persist) {
      const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
      await this.persist(meta);
    }

    // 3. Event emittieren
    this.eventBus.emit("window:closed", { instanceId: this.instanceId });

    return ok(undefined);
  }

  async updateStateLocal(
    updates: Partial<Record<string, unknown>>,
    options?: {
      persist?: boolean;
      sync?: "none" | "debounced" | "immediate";
    }
  ): Promise<Result<void, WindowError>> {
    const { persist = false, sync = "none" } = options ?? {};

    // WICHTIG: EIN Entry-Point für State-Updates.
    // UI ruft immer updateStateLocal(), nicht direkt statePort.patch().
    // State aktualisieren (StatePort aktualisiert automatisch, idempotent)
    this.statePort.patch(updates);

    // Persistieren (wenn gewünscht, mit Origin-Meta)
    if (persist && this.definition.persist) {
      const meta = this.remoteSyncGate.makePersistMeta(this.instanceId);
      const persistResult = await this.persist(meta);
      if (!persistResult.ok) return err(persistResult.error);
    }

    // Bindings synchronisieren (nur wenn Policy es erlaubt)
    if (sync !== "none") {
      const syncResult = await this.bindingEngine.sync(this.instanceId, sync);
      if (!syncResult.ok) return err(syncResult.error);
    }

    // Event emittieren
    for (const [key, value] of Object.entries(updates)) {
      this.eventBus.emit("state:updated", { instanceId: this.instanceId, key, value });
    }

    return ok(undefined);
  }

  async applyRemotePatch(updates: Partial<Record<string, unknown>>): Promise<Result<void, WindowError>> {
    // State aktualisieren (ohne erneutes Persistieren - verhindert Ping-Pong)
    this.statePort.patch(updates);

    // Event emittieren
    for (const [key, value] of Object.entries(updates)) {
      this.eventBus.emit("state:updated", { instanceId: this.instanceId, key, value });
    }

    return ok(undefined);
  }

  async dispatchAction(actionId: string, controlId?: string, event?: Event): Promise<Result<void, WindowError>> {
    const context: ActionContext = {
      windowInstanceId: this.instanceId,
      controlId,
      state: this.state,
      event,
    };

    const result = await this.actionDispatcher.dispatch(actionId, context);
    if (!result.ok) return err(result.error);

    return ok(undefined);
  }

  async persist(meta?: PersistMeta): Promise<Result<void, WindowError>> {
    if (!this.definition.persist) {
      return err({
        code: "NoPersistConfig",
        message: "No persist configuration found",
      });
    }

    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const state = this.statePort.get();
    const persistMeta = meta ?? this.remoteSyncGate.makePersistMeta(this.instanceId);
    const result = await this.persistAdapter.save(this.definition.persist, state, persistMeta);
    if (!result.ok) return err(result.error);

    return ok(undefined);
  }

  async restore(): Promise<Result<void, WindowError>> {
    if (!this.definition.persist?.restoreOnOpen) {
      return ok(undefined);
    }

    if (!this.persistAdapter) {
      return err({
        code: "NoPersistAdapter",
        message: "No persist adapter available",
      });
    }

    const result = await this.persistAdapter.load(this.definition.persist);
    if (!result.ok) return err(result.error);

    await this.applyRemotePatch(result.value);

    return ok(undefined);
  }

  getViewModel(): ViewModel {
    if (this.cachedViewModel) {
      return this.cachedViewModel;
    }

    return this.viewModelBuilder.build(this.definition, this.statePort, this.createActions());
  }

  private createStatePort(): IWindowState<Record<string, unknown>> {
    // WICHTIG: Engine-agnostisch - nutzt Factory, keine konkrete Implementierung.
    // Die konkrete Implementierung (RuneState, ObservableState, etc.) wird
    // in Infrastructure/Composition Root bestimmt (z.B. basierend auf Renderer-Type).
    const initialStateResult = this.stateStore.getAll(this.instanceId);
    const initialState = initialStateResult.ok ? initialStateResult.value : {};
    return this.statePortFactory.create(this.instanceId, initialState);
  }

  private createActions(): Record<string, () => void> {
    const actions: Record<string, () => void> = {};

    for (const actionDef of this.definition.actions || []) {
      actions[actionDef.id] = () => {
        this.dispatchAction(actionDef.id);
      };
    }

    return actions;
  }

  private registerEventListeners(): void {
    // Event-Listener für Control-Actions registrieren
    this.eventBus.on("control:action", (payload) => {
      if (payload.instanceId === this.instanceId) {
        this.dispatchAction(payload.actionId, payload.controlId, payload.event);
      }
    });
  }
}
```

### FoundryApplicationWrapper (Dünne Wrapper-Klasse)

```typescript
// src/infrastructure/adapters/foundry/window/foundry-application-wrapper.ts

export class FoundryApplicationWrapper {
  /**
   * Erstellt eine dünne ApplicationV2-Klasse, die an WindowController delegiert.
   * Controller wird via WeakMap gespeichert (kein Memory-Leak).
   *
   * WICHTIG:
   * - instanceId muss übergeben werden (nicht definitionId) für Multi-Instance-Support.
   * - build() erzeugt pro Instance eine eigene Class (DEFAULT_OPTIONS.id = instanceId).
   * - WeakMap key = App instance, daher bleibt es sauber auch bei mehreren Instanzen derselben Class.
   */
  static build(
    definition: WindowDefinition,
    controller: IWindowController,
    instanceId: string
  ): ApplicationClass {
    const controllerMap = new WeakMap<ApplicationV2, IWindowController>();
    const mountedMap = new WeakMap<ApplicationV2, boolean>();

    const AppClass = class extends HandlebarsApplicationMixin(ApplicationV2) {
      static DEFAULT_OPTIONS = {
        id: instanceId, // WICHTIG: instanceId, nicht definitionId!
        title: definition.title,
        classes: definition.classes || [],
        window: {
          resizable: definition.features?.resizable ?? true,
          minimizable: definition.features?.minimizable ?? true,
          draggable: definition.features?.draggable ?? true,
        },
        position: definition.position,
      };

      static template = Handlebars.compile('<div id="svelte-mount-point"></div>');

      constructor(...args: unknown[]) {
        super(...args);
        // Controller-Reference speichern
        controllerMap.set(this, controller);
        mountedMap.set(this, false);
      }

      async render(force = false) {
        await super.render(force);

        const controller = controllerMap.get(this);
        const isMounted = mountedMap.get(this) ?? false;

        if (controller && this.element) {
          if (!isMounted) {
            // Erstes Render: Mount
            await controller.onFoundryRender(this.element);
            mountedMap.set(this, true);
          } else {
            // Weitere Renders: Update (kein Re-Mount)
            await controller.onFoundryUpdate(this.element);
          }
        }
      }

      async close(options?: unknown) {
        const controller = controllerMap.get(this);
        if (controller) {
          await controller.onFoundryClose();
        }

        mountedMap.set(this, false);
        await super.close(options);
      }
    };

    return AppClass as ApplicationClass;
  }
}
```

### BindingEngine (Normalisiert Bindings)

```typescript
// src/application/services/binding-engine.ts

export interface IBindingEngine {
  initialize(definition: WindowDefinition, instanceId: string): Result<void, WindowError>;
  sync(
    instanceId: string,
    policy?: "none" | "debounced" | "immediate"
  ): Promise<Result<void, WindowError>>; // Async für Persist-Operationen
  getNormalizedBindings(definition: WindowDefinition): ReadonlyArray<NormalizedBinding>;
}

export type BindingSyncPolicy = "manual" | "debounced" | "immediate";

export interface BindingSyncConfig {
  readonly policy: BindingSyncPolicy;
  readonly debounceMs?: number; // Für "debounced"
}

export class BindingEngine implements IBindingEngine {
  static dependencies = [stateStoreToken, persistAdapterToken] as const;

  private readonly bindings = new Map<string, Map<string, NormalizedBinding>>();

  constructor(
    private readonly stateStore: IStateStore,
    private readonly persistAdapter?: IPersistAdapter
  ) {}

  initialize(definition: WindowDefinition, instanceId: string): Result<void, WindowError> {
    const normalized = this.getNormalizedBindings(definition);

    if (!this.bindings.has(instanceId)) {
      this.bindings.set(instanceId, new Map());
    }

    const instanceBindings = this.bindings.get(instanceId)!;

    for (const binding of normalized) {
      instanceBindings.set(binding.id, binding);

      // Initial-Wert laden
      const valueResult = this.loadBindingValue(binding.source, instanceId);
      if (valueResult.ok) {
        // State setzen (über stateKey)
        this.stateStore.set(instanceId, binding.target.stateKey, valueResult.value);
      }
    }

    return ok(undefined);
  }

  async sync(
    instanceId: string,
    policy: "none" | "debounced" | "immediate" = "immediate"
  ): Promise<Result<void, WindowError>> {
    if (policy === "none") return ok(undefined);

    const instanceBindings = this.bindings.get(instanceId);
    if (!instanceBindings) return ok(undefined);

    for (const binding of instanceBindings.values()) {
      // Prüfe Binding-spezifische Policy
      const bindingPolicy = binding.syncPolicy ?? policy;
      if (bindingPolicy === "none") continue;
      if (bindingPolicy === "debounced") {
        // TODO: Debounce-Logik implementieren
        // WICHTIG: Debounce zentral pro bindingId+instanceId, nicht pro keystroke neue Timer erzeugen.
        continue;
      }

      if (binding.twoWay) {
        // TwoWay-Binding: State → Source
        const stateResult = this.stateStore.get(instanceId, binding.target.stateKey);
        if (stateResult.ok) {
          const saveResult = await this.saveBindingValue(binding.source, instanceId, stateResult.value);
          if (!saveResult.ok) return err(saveResult.error);
        }
      }
    }

    return ok(undefined);
  }

  getNormalizedBindings(definition: WindowDefinition): ReadonlyArray<NormalizedBinding> {
    const normalized: NormalizedBinding[] = [];

    // 1. Lokale Bindings aus Controls normalisieren
    for (const control of definition.controls || []) {
      if (control.binding) {
        normalized.push({
          ...control.binding,
          id: control.binding.id || `${control.id}-binding`,
          isLocal: true,
        });
      }
    }

    // 2. Globale Bindings hinzufügen
    for (const binding of definition.bindings || []) {
      normalized.push({
        ...binding,
        isLocal: false,
      });
    }

    return normalized;
  }

  private loadBindingValue(source: BindingSource, instanceId: string): Result<unknown, WindowError> {
    switch (source.type) {
      case "state":
        return this.stateStore.get(instanceId, source.key);
      case "setting":
        // Via PersistAdapter
        return ok(undefined); // TODO
      case "flag":
        // Via PersistAdapter
        return ok(undefined); // TODO
      default:
        return ok(undefined);
    }
  }

  private async saveBindingValue(
    source: BindingSource,
    instanceId: string,
    value: unknown
  ): Promise<Result<void, WindowError>> {
    // TODO: Implementierung
    return ok(undefined);
  }
}
```

### ViewModelBuilder

```typescript
// src/application/services/view-model-builder.ts

export interface IViewModelBuilder {
  build(
    definition: WindowDefinition,
    state: IWindowState<Record<string, unknown>>, // StatePort statt Plain Object
    actions: Record<string, () => void>
  ): ViewModel;
}

export class ViewModelBuilder implements IViewModelBuilder {
  build(
    definition: WindowDefinition,
    state: IWindowState<Record<string, unknown>>, // StatePort statt Plain Object
    actions: Record<string, () => void>
  ): ViewModel {
    // Computed values (abgeleitete Werte)
    const computed: Record<string, unknown> = {};

    // TODO: Computed-Logik implementieren

    return {
      state, // StatePort (kann reaktiv sein, z.B. RuneState)
      computed,
      actions,
    };
  }
}
```

### SvelteRenderer (Mit engine-spezifischer Instance)

```typescript
// src/infrastructure/renderers/svelte-renderer.ts

export class SvelteRenderer implements IRenderEnginePort<SvelteComponentInstance> {
  mount(
    descriptor: ComponentDescriptor,
    target: HTMLElement,
    viewModel: ViewModel
  ): Result<SvelteComponentInstance, RenderError> {
    if (descriptor.type !== "svelte") {
      return err({
        code: "InvalidType",
        message: `SvelteRenderer can only mount svelte components`,
      });
    }

    try {
      const Component = descriptor.component as ComponentType;
      const instance = new Component({
        target,
        props: {
          ...descriptor.props,
          viewModel, // ViewModel als Prop
        },
      });

      return ok({
        id: `svelte-${Date.now()}`,
        type: "svelte",
        element: target,
        props: { ...descriptor.props, viewModel },
        instance, // Svelte-spezifisch
      });
    } catch (error) {
      return err({
        code: "MountFailed",
        message: `Failed to mount svelte component: ${String(error)}`,
        cause: error,
      });
    }
  }

  unmount(instance: SvelteComponentInstance): Result<void, RenderError> {
    try {
      if (instance.instance && typeof instance.instance.$destroy === "function") {
        instance.instance.$destroy();
      }
      return ok(undefined);
    } catch (error) {
      return err({
        code: "UnmountFailed",
        message: `Failed to unmount component: ${String(error)}`,
        cause: error,
      });
    }
  }

  update(instance: SvelteComponentInstance, viewModel: ViewModel): Result<void, RenderError> {
    // ⚠️ DOGMA: Renderer.update() ist KEIN State-Update-Mechanismus! ⚠️
    //
    // State → Runes (automatische Reaktivität)
    // Struktur → Renderer.update() (nur bei Definition/Struktur-Änderungen)
    //
    // Bei Svelte mit StatePort ist normalerweise kein Update nötig
    // StatePort kann reaktiv sein (z.B. RuneState), Svelte reagiert dann automatisch auf Änderungen
    // Diese Methode wird nur bei "definition changed" benötigt (z.B. Component-Wechsel)
    try {
      if (instance.instance && typeof instance.instance.$set === "function") {
        instance.instance.$set({ viewModel });
      }
      return ok(undefined);
    } catch (error) {
      return err({
        code: "UpdateFailed",
        message: `Failed to update component: ${String(error)}`,
        cause: error,
      });
    }
  }
}
```

---

## 7. State Model (Drei State-Kategorien)

**WICHTIG:** Das Framework nutzt **drei klar getrennte State-Ebenen**:
- **Window UI State** (Lebensdauer: WindowHandle)
- **Shared Document State** (Lebensdauer: Browser-Session)
- **Persisted State** (Authority = Foundry DB)

Diese Trennung verhindert Missverständnisse wie "Persist als State" oder "Shared Cache als lokalen State".

### StatePort Binding in Composition Root

**WICHTIG:** Core ist engine-agnostisch (Ports/Controller/Registry).
Die konkrete StatePort-Implementierung wird **in Infrastructure/Composition Root** gebunden.

**Strategie (Renderer-gebunden):**
- Wenn `definition.component.type === "svelte"` → `RuneStateFactory` (Reference Implementation)
- Sonst → `ObservableStateFactory` (oder `StateStoreStateFactory`)

**Vorteile:**
- Agnostik bleibt erhalten, weil nur Infra/Composition entscheidet
- Svelte bekommt trotzdem den Turbo (RuneState mit direktem Proxy)
- Alternative Implementierungen möglich ohne Core-Änderungen

**Reference Implementation:**
- `RuneState` (Svelte 5 Runes) - Infrastructure-Implementierung
- `GlobalDocumentCache` (RuneState Singleton) - Infrastructure-Implementierung

### Drei klar benannte State-Kategorien

**1. Window UI State**
- **Lebensdauer:** WindowHandle
- **Technik:** `StatePort` (engine-agnostisch, **kann** reaktiv sein, z.B. RuneState für Svelte)
- **Beispiele:** `activeTab`, `modalOpen`, `selection`, `isDirty`
- **Wichtig:** *Nie* durch Hooks geschrieben (nur User-Interaktionen / Actions)
- Wird durch `WindowController.updateStateLocal()` aktualisiert
- Persistiert optional (mit Origin-Meta)

**2. Shared Document State (Client Cache)**
- **Lebensdauer:** Browser-Session
- **Technik:** `ISharedDocumentCache` (engine-agnostisch, **kann** reaktiv sein, z.B. GlobalDocumentCache mit RuneState für Svelte)
- **Quelle:** Foundry Hooks
- **Ziel:** UI-Reaktivität **ohne** Foundry-Render (wenn Implementierung reaktiv ist)
- **Wichtig:** Alle Fenster konsumieren ihn direkt, aber **nur lesen**
- **Beispiel:** `GlobalDocumentCache` (Reference Implementation) mit `docs.actorsById`, `docs.itemsById`
- Wird durch HookBridge aktualisiert (Remote-Patches)

**3. Persisted State (Authority = Foundry DB)**
- **Technik:** `PersistAdapter`
- **Zugriff:** Nur über Controller / Services
- **Wichtig:** UI schreibt **nie direkt** hierhin (immer über Actions/Controller)
- **Beispiele:** Settings, Flags, Journal Entry Pages

### RuneState-Implementierung für Svelte

Für Svelte-first Windows ist die Best Practice:

```typescript
// src/infrastructure/state/rune-state.ts

export class RuneState<T extends Record<string, unknown>> implements IRuneState<T> {
  private readonly runeState: T;

  constructor(initial: T) {
    // Intern: $state-Objekt (Svelte 5 Runes)
    this.runeState = $state(initial);
  }

  get(): Readonly<T> {
    // WICHTIG: Gibt bewusst den reaktiven $state-Proxy zurück, nicht einen Snapshot!
    // Svelte reagiert automatisch auf Änderungen am Proxy.
    // Für Serialisierung/Cloning: snapshot() verwenden.
    return this.runeState as Readonly<T>;
  }

  patch(updates: Partial<T>): void {
    // Idempotent: nur ändern wenn value differs (verhindert unnötige Reaktionen)
    for (const [key, value] of Object.entries(updates)) {
      if (this.runeState[key as keyof T] !== value) {
        (this.runeState as Record<string, unknown>)[key] = value;
      }
    }
  }

  subscribe(fn: (value: Readonly<T>) => void): () => void {
    // Optional: Für Nicht-Svelte Engines (EventBus)
    // Svelte braucht es meist nicht, reagiert automatisch auf RuneState
    return () => {}; // No-op für Svelte
  }

  snapshot(): Readonly<T> {
    // Strukturierter Clone für Non-Svelte Engines
    return { ...this.runeState };
  }
}
```

### GlobalDocumentCache (Singleton) - Reference Implementation

**WICHTIG:**
- `GlobalDocumentCache` ist eine **Infrastructure-Implementierung** von `ISharedDocumentCache`.
- Core (HookBridge, Controller) spricht nur mit dem **Port** (`ISharedDocumentCache`), nicht mit RuneState direkt.
- `GlobalDocumentCache` ist ein **Mirror**, kein Authority Store.
- Writes erfolgen ausschließlich über Services + PersistAdapter.
- Foundry DB bleibt die letzte Instanz (Source of Truth).
- **GlobalDocumentCache darf niemals Actions auslösen** - er ist rein passiv (Hook → Patch → UI).

**Reference Implementation (Svelte):**
- Nutzt RuneState (Svelte 5 Runes) intern
- Map-Reaktivität: Interne Objektfelder dürfen geändert werden, **aber** danach **immer** `set()` auf der Map aufrufen.
- Das verhindert subtile Svelte-Reaktivitätsfehler (Map-Mutation muss explizit getriggert werden).

**Alternative Implementierungen:**
- `GenericDocumentCache` (EventEmitter/Observable) für Non-Svelte Engines

```typescript
// src/infrastructure/state/global-document-cache.ts

export class GlobalDocumentCache {
  private static instance: GlobalDocumentCache | null = null;

  // Reaktive Caches (Plain Objects, nicht Foundry Document Instanzen)
  // Serialisierte Snapshots (system/flags/name etc.) als Plain Objects
  readonly actorsById = $state<Map<string, ActorSnapshot>>(new Map());
  readonly itemsById = $state<Map<string, ItemSnapshot>>(new Map());
  readonly itemsByActorId = $state<Map<string, string[]>>(new Map()); // Item-IDs, nicht Objekte

  static getInstance(): GlobalDocumentCache {
    if (!GlobalDocumentCache.instance) {
      GlobalDocumentCache.instance = new GlobalDocumentCache();
    }
    return GlobalDocumentCache.instance;
  }

  // Idempotent Patch: nur ändern wenn value differs
  patchActor(actorId: string, updates: Partial<ActorSnapshot>): void {
    const actor = this.actorsById.get(actorId);
    if (!actor) {
      // Neuen Snapshot erstellen
      this.actorsById.set(actorId, { ...updates } as ActorSnapshot);
      return;
    }

    // Nur ändern wenn value differs (verhindert unnötige Reaktionen)
    let hasChanges = false;
    for (const [key, value] of Object.entries(updates)) {
      if (actor[key as keyof ActorSnapshot] !== value) {
        (actor as Record<string, unknown>)[key] = value;
        hasChanges = true;
      }
    }

    // WICHTIG: Map-Mutation explizit triggern (für Svelte-Reaktivität)
    // Immer set() aufrufen, nie nur interne Objektfelder ändern!
    if (hasChanges) {
      this.actorsById.set(actorId, actor); // Re-trigger Reaktivität
    }
  }

  // HookBridge patcht diesen Cache
  // Svelte-Windows konsumieren ihn direkt (reaktiv, nur lesen)
}

// Serialisierte Snapshots (Plain Objects, nicht Foundry Documents)
export interface ActorSnapshot {
  readonly id: string;
  readonly name: string;
  readonly system: Record<string, unknown>;
  readonly flags: Record<string, unknown>;
  // ... weitere relevante Felder
}

export interface ItemSnapshot {
  readonly id: string;
  readonly name: string;
  readonly system: Record<string, unknown>;
  readonly flags: Record<string, unknown>;
  readonly actorId?: string;
  // ... weitere relevante Felder
}
```

### Render-Policy

- **Foundry rendert nur Container**: `render:false` in Persist-Options
- **UI-Updates erfolgen über Runes/StatePorts**: Svelte reagiert automatisch
- **HookBridge ignoriert Updates nur**, wenn `originWindowInstanceId` dem jeweiligen Controller entspricht (window-scoped, nicht client-scoped)

---

## 8. Referenz-Flow (User-Interaktion → Remote-Sync)

### Flow: User tippt in Svelte → Remote-Sync

```
1. User tippt in Svelte-Component
   │
   ├─► Svelte bind:value → WindowController.updateStateLocal({ name: "..." }, { persist: true, sync: "debounced" })
   │   └─► EIN Entry-Point: Controller patched StatePort (RuneState)
   │   └─► RuneState aktualisiert (idempotent: nur wenn differs)
   │   └─► Svelte reagiert automatisch (reaktiv)
   │
   ▼
2. WindowController.updateStateLocal() (Fortsetzung)
   │
   ├─► PersistAdapter.save(config, state, meta)
   │   └─► meta.render = false (kein Foundry-window rerender)
   │   └─► meta.originWindowInstanceId = "window-1"
   │   └─► document.update(changes, { render: false, windowFrameworkOrigin: meta })
   │
   ▼
3. Foundry Hook: updateDocument
   │
   ├─► HookBridge.handleDocumentUpdate(document, update, options)
   │   └─► HINWEIS: updateDocument ist universal (MVP). Kann später auf spezifische
   │       Document hooks (updateActor, updateItem, etc.) gesplittet werden für Performance/Typing.
   │
   ▼
4. Für jedes aktive Fenster:
   │
   ├─► RemoteSyncGate.isFromWindow(options, instanceId)
   │   ├─► window-1: true → continue (ignorieren)
   │   ├─► window-2: false → weiter prüfen
   │   └─► window-3: false → weiter prüfen
   │
   ├─► isRelevant(definition, document, update)
   │   ├─► window-2: true (relevant) → applyRemotePatch()
   │   └─► window-3: false (nicht relevant) → skip
   │
   ▼
5. WindowController.applyRemotePatch(updates)
   │
   ├─► StatePort.patch(updates) (idempotent)
   │   └─► StatePort aktualisiert (z.B. RuneState bei Svelte)
   │   └─► UI reagiert automatisch (wenn Implementierung reaktiv ist, z.B. Svelte mit RuneState)
   │
   └─► KEIN erneutes Persistieren (verhindert Ping-Pong)
```

**Ergebnis:**
- Window-1: UI bereits aktuell, kein Re-render
- Window-2: Relevantes Update erhalten, Svelte re-rendert automatisch
- Window-3: Nicht relevant, kein Update

---

## 9. Persist & Remote Sync

### Origin-Tracking (Verhindert Ping-Pong)

**Problem:** Wenn ein Fenster lokal State ändert und persistiert, soll:
- **Lokal**: UI ist schon up-to-date → kein Foundry-window rerender, keine "remote apply" zurück
- **Remote**: Hook soll rein-syncen → andere Clients bekommen Update

**Lösung:** `RemoteSyncGate` + `PersistMeta` + Hook-Bridge

### Origin-Regel (Explizite Matrix)

**Update kommt aus Persist mit `originWindowInstanceId = X`:**

| Fenster | Aktion |
|---------|--------|
| **Fenster X** (gleiches Window) | **Ignorieren** (UI ist schon aktuell) |
| **Fenster Y** (anderes Window, gleicher User) | **Anwenden**, wenn relevant (z.B. Item-Update betrifft Actor-Fenster) |
| **Fenster Z** (anderer Client) | **Anwenden**, wenn relevant |

**WICHTIG:** Window-scoped, nicht Client-scoped! Gleicher User mit mehreren Fenstern muss Updates zwischen Fenstern erhalten.

### RemoteSyncGate-Implementierung

```typescript
// src/application/services/remote-sync-gate.ts

export class RemoteSyncGate implements IRemoteSyncGate {
  private readonly clientId: string;
  private readonly OPT_KEY = "windowFrameworkOrigin";

  constructor() {
    // Client-ID aus Foundry game.userId oder generieren
    this.clientId = game.userId || `client-${Date.now()}`;
  }

  makePersistMeta(instanceId: string): PersistMeta {
    return {
      originClientId: this.clientId,
      originWindowInstanceId: instanceId,
      render: false, // Kein Foundry-window rerender
    };
  }

  isFromWindow(options: Record<string, unknown> | undefined, instanceId: string): boolean {
    if (!options) return false;
    const meta = options[this.OPT_KEY] as PersistMeta | undefined;
    // WICHTIG: Window-scoped, nicht Client-scoped!
    // Nur Updates vom gleichen Window werden ignoriert
    return meta?.originWindowInstanceId === instanceId;
  }

  getClientId(): string {
    return this.clientId;
  }
}
```

### Hook-Bridge (Foundry Hooks → WindowController)

```typescript
// src/infrastructure/adapters/foundry/hooks/window-hooks.ts

export class WindowHooksBridge {
  static dependencies = [
    windowRegistryToken,
    remoteSyncGateToken,
    sharedDocumentCacheToken, // WICHTIG: Port, nicht konkrete Implementierung
  ] as const;

  constructor(
    private readonly registry: IWindowRegistry,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly sharedDocumentCache: ISharedDocumentCache // Port, nicht GlobalDocumentCache direkt
  ) {}

  register(): void {
    // Hook für Flag-Updates
    Hooks.on("updateDocument", (document: FoundryDocument, update: unknown, options: unknown) => {
      this.handleDocumentUpdate(document, update, options);
    });

    // Hook für Setting-Updates
    Hooks.on("settingChange", (namespace: string, key: string, value: unknown, options: unknown) => {
      this.handleSettingChange(namespace, key, value, options);
    });
  }

  private handleDocumentUpdate(document: FoundryDocument, update: unknown, options: unknown): void {
    const optionsRecord = options as Record<string, unknown> | undefined;

    // Finde alle aktiven Fenster
    const instances = this.registry.listInstances();

    for (const instance of instances) {
      // WICHTIG: window-scoped, nicht client-scoped!
      // Diese Regel gilt für ALLE Hook-Handler (updateDocument, settingChange, etc.)
      if (this.remoteSyncGate.isFromWindow(optionsRecord, instance.instanceId)) {
        continue; // Update von diesem Window, bereits angewendet
      }

      const handleResult = this.registry.getInstance(instance.instanceId);
      if (!handleResult.ok) continue;

      const controller = handleResult.value.controller;
      const definitionResult = this.registry.getDefinition(instance.definitionId);
      if (!definitionResult.ok) continue;

      const definition = definitionResult.value;

      // Prüfe, ob Window relevant ist (Dependency-basiert, nicht nur "boundToDocument")
      if (this.isRelevant(definition, document, update)) {
        // Remote-Patch anwenden
        const patch = this.extractPatch(document, update);
        controller.applyRemotePatch(patch);
      }
    }
  }

  private handleSettingChange(namespace: string, key: string, value: unknown, options: unknown): void {
    // Analog zu handleDocumentUpdate
    const instances = this.registry.listInstances();
    const optionsRecord = options as Record<string, unknown> | undefined;

    for (const instance of instances) {
      // WICHTIG: window-scoped, nicht client-scoped!
      if (this.remoteSyncGate.isFromWindow(optionsRecord, instance.instanceId)) {
        continue; // Ignorieren für dieses Window
      }

      const definitionResult = this.registry.getDefinition(instance.definitionId);
      if (!definitionResult.ok) continue;

      const definition = definitionResult.value;

      // Prüfe, ob Window relevant ist
      if (this.isRelevantForSetting(definition, namespace, key)) {
        // TODO: applyRemotePatch für Settings
      }
    }
  }

  private isRelevantForSetting(
    definition: WindowDefinition,
    namespace: string,
    key: string
  ): boolean {
    // Prüfe PersistConfig (Settings)
    if (definition.persist?.type === "setting" && definition.persist.namespace === namespace && definition.persist.key === key) {
      return true;
    }

    // Prüfe Dependencies (Settings)
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (dep.type === "setting" && dep.namespace === namespace && dep.key === key) {
          return true;
        }
      }
    }

    return false;
  }

  private isRelevant(
    definition: WindowDefinition,
    document: FoundryDocument,
    update: unknown
  ): boolean {
    // MVP: Grobe Prüfung - später mit DependencyTracker optimieren

    // 1. Prüfe PersistConfig (direkte Bindung)
    if (definition.persist) {
      if (definition.persist.type === "flag" && definition.persist.documentId === document.id) {
        return true;
      }
      if (definition.persist.type === "journal" && definition.persist.documentId === document.id) {
        return true;
      }
    }

    // 2. Prüfe Dependencies (explizite Dependency-Descriptors)
    if (definition.dependencies) {
      for (const dep of definition.dependencies) {
        if (dep.type === "document" && dep.documentId === document.id) {
          return true;
        }
        // HINWEIS: constructor.name ist MVP/fragil (Minification/Refactor/Foundry intern).
        // Besser wäre ein stabiler Document-Type-Identifier (z.B. document.documentName).
        if (dep.type === "document" && dep.documentType && document.constructor.name === dep.documentType) {
          return true;
        }
      }
    }

    // TODO: Erweiterte Dependency-Prüfung (Phase 2)
    // - Item-Update betrifft Actor-Fenster? (via DependencyTracker)
    // - Actor-Update betrifft Item-Fenster?
    // - Cross-Document-Dependencies

    return false;
  }

  private extractPatch(document: FoundryDocument, update: unknown): Partial<Record<string, unknown>> {
    // TODO: Update aus document/update extrahieren und als Patch-Format konvertieren
    return {};
  }
}
```

### PersistAdapter-Integration

```typescript
// src/infrastructure/adapters/foundry/persist/flags-persist-adapter.ts

export class FlagsPersistAdapter implements IPersistAdapter {
  async save(
    config: PersistConfig,
    data: Record<string, unknown>,
    meta?: PersistMeta
  ): Promise<Result<void, PersistError>> {
    if (config.type !== "flag") {
      return err({ code: "InvalidType", message: "Not a flag persist config" });
    }

    const document = game.collections.get(config.documentId);
    if (!document) {
      return err({ code: "DocumentNotFound", message: "Document not found" });
    }

    // Foundry update: changes als erstes Argument, options als zweites
    const changes: Record<string, unknown> = {
      [`flags.${config.namespace}.${config.key}`]: data,
    };

    const options: Record<string, unknown> = {
      render: meta?.render ?? false, // Kein Rerender (in options, nicht in changes!)
      windowFrameworkOrigin: meta, // Origin-Meta für Hook-Bridge
    };

    await document.update(changes, options);

    return ok(undefined);
  }
}
```

---

## 10. Lifecycle & Hooks (Refactored)

### Fenster-Lifecycle (Mit WindowController)

```
1. WindowDefinition (Config/TS)
   │
   ▼
2. WindowFactory.createWindow(definitionId, instanceKey?, overrides?)
   │
   ├─► WindowRegistry.getDefinition(definitionId)
   ├─► WindowController erstellen (mit allen Dependencies)
   ├─► FoundryApplicationWrapper.build(definition, controller)
   │   └─► Dünne App-Klasse mit Controller-Reference (WeakMap)
   ├─► WindowInstance erstellen (instanceId: `${definitionId}:${instanceKey || uuid}`)
   ├─► WindowRegistry.registerInstance(instance)
   │
   ▼
3. FoundryApp.render() / WindowController.onFoundryRender()
   │
   ├─► Foundry ApplicationV2.render() (Foundry-Lifecycle)
   ├─► WindowController.onFoundryRender(element)
   │   ├─► BindingEngine.initialize()
   │   ├─► ViewModelBuilder.build() → ViewModel
   │   ├─► RendererRegistry.get(definition.component.type)
   │   ├─► Renderer.mount(component, target, viewModel)
   │   │   └─► Svelte/React/Vue/Handlebars rendert
   │   └─► Event-Listener registrieren
   │
   ▼
4. User-Interaktion (Button-Click, Input-Change)
   │
   ├─► UI-Component → EventBus.emit('control:action', { ... })
   │
   ▼
5. WindowController.dispatchAction()
   │
   ├─► ActionDispatcher.dispatch(actionId, context)
   │   ├─► Permission-Check
   │   ├─► Validation
   │   ├─► Confirm (wenn nötig)
   │   └─► Action.handler(context)
   │       ├─► StateStore.update(...)
   │       ├─► PersistAdapter.save(...) (wenn autoSave)
   │       └─► EventBus.emit('action:completed', ...)
   │
   ▼
6. WindowController.updateState() / Re-render
   │
   ├─► ViewModelBuilder.build() → neues ViewModel
   ├─► Renderer.update(instance, newViewModel)
   └─► BindingEngine.sync() (wenn twoWay-Bindings)

7. FoundryApp.close() / WindowController.onFoundryClose()
   │
   ├─► Renderer.unmount(instance)
   ├─► PersistAdapter.save() (final)
   └─► WindowRegistry.unregisterInstance(instanceId)
```

---

## 8. Beispiel (Refactored)

### WindowDefinition (Beispiel)

```typescript
const characterEditorDefinition: WindowDefinition = {
  definitionId: "character-editor",
  title: "Character Editor",
  icon: "fa-solid fa-user",
  component: {
    type: "svelte",
    component: CharacterEditorComponent,
  },
  features: {
    resizable: true,
    minimizable: true,
    draggable: true,
  },
  position: {
    width: 600,
    height: 800,
    centered: true,
  },
  controls: [
    {
      id: "name-input",
      type: "text",
      label: "Character Name",
      binding: {
        id: "name-binding",
        source: { type: "state", key: "name" },
        target: {
          stateKey: "name", // Primär: State-Key
          ui: { controlId: "name-input", property: "value" } // Optional: UI-Shortcut
        },
        twoWay: true,
      },
      validation: [
        { type: "required", message: "Name is required" },
      ],
      actions: {
        onChangeAction: "validate-name",
      },
    },
    {
      id: "save-button",
      type: "button",
      label: "Save",
      actions: {
        primaryAction: "save-character",
      },
    },
  ],
  actions: [
    {
      id: "save-character",
      label: "Save Character",
      handler: async (context) => {
        // Save-Logik
        return ok(undefined);
      },
    },
  ],
  persist: {
    type: "flag",
    key: "character-editor-state",
    scope: "world",
    autoSave: true,
    restoreOnOpen: true,
  },
};
```

### Verwendung (Mit Multi-Instance)

```typescript
// 1. Definition registrieren
const windowRegistry = container.resolve(windowRegistryToken);
windowRegistry.registerDefinition(characterEditorDefinition);

// 2. Fenster erstellen (Instanz 1)
const windowFactory = container.resolve(windowFactoryToken);
const result1 = await windowFactory.createWindow("character-editor", "actor-123");

// 3. Fenster erstellen (Instanz 2 - gleiche Definition, andere Instanz)
const result2 = await windowFactory.createWindow("character-editor", "actor-456");

if (result1.ok && result2.ok) {
  const handle1 = result1.value;
  const handle2 = result2.value;

  // Beide Fenster unabhängig verwaltbar
  await handle1.show();
  await handle2.show();
}
```

---

## 10. Ordnerstruktur (Refactored)

```
src/
├── domain/
│   ├── ports/
│   │   ├── window-controller-port.interface.ts
│   │   ├── window-factory-port.interface.ts
│   │   ├── window-registry-port.interface.ts
│   │   ├── state-store-port.interface.ts
│   │   ├── action-dispatcher-port.interface.ts
│   │   ├── render-engine-port.interface.ts
│   │   ├── persist-adapter-port.interface.ts
│   │   ├── event-bus-port.interface.ts
│   │   ├── binding-engine-port.interface.ts
│   │   ├── view-model-builder-port.interface.ts
│   │   ├── remote-sync-gate-port.interface.ts
│   │   └── foundry-window-adapter.interface.ts
│   └── types/
│       ├── window-definition.interface.ts
│       ├── window-handle.interface.ts
│       ├── component-descriptor.interface.ts
│       ├── component-instance.interface.ts
│       ├── control-definition.interface.ts
│       ├── action-definition.interface.ts
│       ├── binding-descriptor.interface.ts
│       ├── dependency-descriptor.interface.ts
│       ├── persist-config.interface.ts
│       ├── view-model.interface.ts
│       ├── event-map.interface.ts
│       └── errors/
│
├── application/
│   ├── ports/
│   │   ├── state-port-factory-port.interface.ts
│   │   └── shared-document-cache-port.interface.ts
│   ├── services/
│   │   ├── window-controller.ts
│   │   ├── window-factory.ts
│   │   ├── window-registry.ts
│   │   ├── action-dispatcher.ts
│   │   ├── renderer-registry.ts
│   │   ├── state-store.ts
│   │   ├── binding-engine.ts
│   │   ├── view-model-builder.ts
│   │   └── remote-sync-gate.ts
│   ├── builders/
│   │   └── window-config-builder.ts
│   └── events/
│       └── window-events.ts
│
└── infrastructure/
    ├── adapters/
    │   └── foundry/
    │       ├── window/
    │       │   ├── foundry-window-adapter.ts
    │       │   └── foundry-application-wrapper.ts
    │       ├── persist/
    │       │   ├── settings-persist-adapter.ts
    │       │   ├── flags-persist-adapter.ts
    │       │   └── journal-persist-adapter.ts
    │       └── hooks/
    │           └── window-hooks.ts
    ├── renderers/
    │   ├── svelte-renderer.ts
    │   ├── react-renderer.ts
    │   ├── handlebars-renderer.ts
    │   └── renderer-base.ts
    └── state/
        ├── rune-state.ts
        └── global-document-cache.ts
```

---

## 10. Teststrategie (Refactored)

### Unit-Tests (ohne Foundry-Runtime)

**Testbare Komponenten:**
- `WindowController` - Mit gemockten Dependencies
- `WindowRegistry` - Map-basierte Logik
- `WindowConfigBuilder` - Config-Erstellung
- `ActionDispatcher` - Action-Logik
- `StateStore` - State-Management
- `EventBus` - Event-System (typisiert)
- `BindingEngine` - Binding-Normalisierung
- `ViewModelBuilder` - ViewModel-Erstellung

**Mocking-Strategie:**
```typescript
describe("WindowController", () => {
  it("should render window with component", async () => {
    const mockRenderer = createMockRenderer();
    const mockStateStore = createMockStateStore();
    const mockBindingEngine = createMockBindingEngine();
    // ...

    const controller = new WindowController(
      "instance-1",
      "definition-1",
      mockDefinition,
      mockRegistry,
      mockStateStore,
      mockActionDispatcher,
      mockRendererRegistry,
      mockBindingEngine,
      mockViewModelBuilder,
      mockEventBus,
      mockPersistAdapter
    );

    const result = await controller.onFoundryRender(mockElement);
    expect(result.ok).toBe(true);
    expect(controller.componentInstance).toBeDefined();
  });
});
```

---

## 14. Roadmap (Erweitert)

### MVP (Phase 1)

**Kern-Funktionalität:**
- ✅ WindowDefinition Schema (mit definitionId/instanceId-Trennung)
- ✅ WindowController (Kernstück)
- ✅ WindowFactory (mit Multi-Instance)
- ✅ WindowRegistry (Definitions + Instances)
- ✅ FoundryApplicationWrapper (dünne Wrapper-Klasse mit instanceId)
- ✅ SvelteRenderer (mit StatePort/RuneState)
- ✅ Basis StateStore
- ✅ **StatePort** (State-API, kann reaktiv sein, z.B. RuneState als Primary UI Update Mechanismus)
- ✅ **RemoteSyncGate** (window-scoped: `isFromWindow()`)
- ✅ **Persist `render:false`** (kein Foundry-window rerender)
- ✅ Typisiertes EventBus (EventMap)
- ✅ Einfache Actions (ohne Permissions/Validation)
- ✅ **GlobalDocumentCache (RuneState Singleton)** + HookBridge patcht Cache
- ✅ **Idempotent Patch Utility** (applyPatch: nur ändern wenn value differs)
- ✅ **HookBridge (Dependency-basiert)** - nur "relevant windows" patched (zunächst grob)
- ✅ **DI-Container Integration** - Alle Services registriert
- ✅ **Hook-Registrierung** - WindowHooksBridge in Bootstrap integriert

**Deliverables:**
- Einfaches Fenster mit Svelte-Component
- Basis-Controls (Button, Text-Input)
- **State-Management (Window-Local via StatePort, kann reaktiv sein z.B. RuneState + Shared Document State via ISharedDocumentCache, kann reaktiv sein z.B. GlobalDocumentCache)**
- Fenster öffnen/schließen
- **Remote-Sync (ohne Ping-Pong, window-scoped)**
- **Svelte-Reaktivität als Primary Update-Mechanismus** (kein ständiges Foundry-Rerender)

---

### Phase "Svelte-first Stabilisierung" (zwischen MVP & Phase 2)

**Ziel:** Bewusstes Design, kein Experiment

Diese Phase macht klar, dass reaktive StatePort-Implementierungen (z.B. RuneState für Svelte) als Primärmechanismus eine **bewusste Designentscheidung** sind, kein Experiment.

- ✅ RuneState als Default-Implementierung
- ✅ Keine Renderer.update() bei State-Änderungen (Dogma)
- ✅ Idempotente Patch Utilities (MVP: Basis-Implementierung)
- ⬜ GlobalDocumentCache Performance-Review (Patch vs Snapshot) - für später
- ⬜ Dokumentation: "Why this is not overengineered" - für später

### Phase 2: Erweiterte Features

**Features:**
- ✅ ActionDispatcher (vollständig mit Permissions/Validation)
- ✅ EventBus (vollständig)
- ✅ Erweiterte Controls (Select, Checkbox, Table, Tabs)
- ✅ Bindings (State, Settings, Flags) - SyncBinding primär, SchemaUiBinding optional
- ✅ PersistAdapter (Settings, Flags)
- ✅ Window-Position-Management
- ✅ Error-Boundary für Components
- ⬜ **GlobalDocumentCache (Shared state)** + "Relevance/Dependencies" verbessert
- ⬜ **DependencyTracker / Relevance Filter** pro Window (welche Hook-Events betreffen mich?)
- ⬜ **Persist Policies** (debounce/throttle, transaction batching)
- ⬜ **Debounced autosave policies** (pro binding / per action)
- ⬜ **Two-Way Bindings nur optional** (Schema-UI Builder Pfad)
- ⬜ **Binding Sync Policies** (manual/debounced/immediate) - explizite API

**Deliverables:**
- Komplexe Fenster mit mehreren Controls
- State-Persistenz (mit Policies)
- Action-System mit Permissions
- Event-Kommunikation
- **Optimierte Remote-Sync (Dependency-basiert, nicht zu grob/zu eng)**

### Phase 3-4
- (Unverändert von v1)

---

## Zusammenfassung der Änderungen (v2 → v2.1)

### Kritische Fixes

1. ✅ **StatePort/RuneState** - Reaktive State-API für Svelte-Runes (kein ständiges `$set`)
   - `get()` liefert reaktiven Proxy (als Readonly<T> typisiert)
   - `patch()` idempotent (nur ändern wenn value differs)
   - `snapshot()` optional für Non-Svelte Engines
2. ✅ **Origin-Tracking window-scoped** - `isFromWindow(options, instanceId)` statt `isSelf()` (Client-scoped)
   - Origin-Regel als explizite Matrix dokumentiert
3. ✅ **Multi-Instance App ID** - `DEFAULT_OPTIONS.id` verwendet `instanceId` statt `definitionId`
4. ✅ **FoundryApplicationWrapper.render() Guard** - `onFoundryRender()` nur beim ersten Render, `onFoundryUpdate()` bei weiteren
5. ✅ **BindingEngine async sync()** - Korrigiert TypeScript-Bug
6. ✅ **BindingTarget.stateKey** - Klare Trennung: stateKey (primär) vs ui (optional)
7. ✅ **Binding-Klassen explizit** - SyncBinding (primär) vs SchemaUiBinding (optional)
8. ✅ **updateStateLocal() API erweitert** - Explizite sync-Policy: `{ persist?, sync?: "none"|"debounced"|"immediate" }`
9. ✅ **updateStateLocal() vs applyRemotePatch()** - Getrennte Pfade verhindern Ping-Pong
10. ✅ **RemoteSyncGate window-scoped** - `isFromWindow()` statt `isSelf()` (nur gleiches Window ignorieren)
11. ✅ **HookBridge Dependency-basiert** - `isRelevant()` pro Window + DependencyDescriptor
12. ✅ **PersistAdapter Bug-Fix** - `document.update(changes, options)` Signatur korrigiert
13. ✅ **BindingEngine.sync() Policy** - Explizite API mit Policy-Parameter
14. ✅ **State Model dokumentiert** - Window-Local vs Shared Document State, RuneState-Implementierung
15. ✅ **GlobalDocumentCache** - Singleton-Cache (Reference Implementation, kann reaktiv sein) mit Plain Objects (Snapshots, nicht Foundry Documents)
16. ✅ **Idempotent Patch** - Nur ändern wenn value differs (verhindert unnötige Reaktionen)
17. ✅ **DependencyDescriptor** - Leichtgewichtiges Dependency-Konzept für Relevanz-Prüfung
18. ✅ **Referenz-Flow** - Expliziter Flow: User tippt → Remote-Sync
19. ✅ **Drei State-Kategorien** - Window UI State, Shared Document State, Persisted State explizit getrennt
20. ✅ **RuneState.get() Dokumentation** - Explizit: reaktiver Proxy (bei RuneState), nicht Snapshot
21. ✅ **GlobalDocumentCache Dokumentation** - Mirror (nicht Authority), Map-Reaktivität explizit
22. ✅ **BindingEngine Optionalität** - Klarstellung: optional für Svelte-first Windows
23. ✅ **Renderer.update() Semantik** - Struktur-Update, nicht State-Update
24. ✅ **WindowController Semantik** - Local vs Remote explizit dokumentiert
25. ✅ **RemoteSyncGate Bug-Fix** - `isFromWindow()` statt `isSelf()` in `handleSettingChange`
26. ✅ **Phase "Svelte-first Stabilisierung"** - Explizite Phase zwischen MVP & Phase 2
27. ✅ **Engine-Agnostik korrigiert** - IStatePortFactory + ISharedDocumentCache als Ports, RuneState als Reference Implementation
28. ✅ **Composition Root** - StatePort/SharedDocumentCache Binding in Infrastructure, nicht in Application

---

**Ende der Architektur-Dokumentation (v2.1)**
