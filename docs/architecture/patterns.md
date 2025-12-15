# Architektur-Patterns

**Zweck:** Detaillierte Dokumentation der verwendeten Architektur-Patterns
**Zielgruppe:** Architekten, Entwickler
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Port-Adapter-Pattern

Das Modul verwendet das **Hexagonal Architecture**-Muster (Ports & Adapters), um verschiedene Foundry VTT-Versionen zu unterstützen.

### Konzept

```typescript
// 1. Interface (Port) definiert Vertrag
interface FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string>;
}

// 2. Versionsspezifische Implementierung (Adapter)
class FoundryV13GamePort implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V13-spezifische Logik
  }
}

// 3. Service nutzt Interface, nicht konkrete Implementierung
class FoundryGamePort implements FoundryGame {
  private port: FoundryGame;  // Wird zur Laufzeit aufgelöst
}
```

---

### Lazy Instantiation (Anti-Crash-Mechanismus)

**Problem:** Wenn alle Ports sofort instantiiert werden, crashen neuere Ports auf älteren Foundry-Versionen.

**Lösung:** Token-basierte Registry mit Lazy Resolution.

```typescript
// ✅ Korrekt: Token-basierte Registry
registry.register(13, foundryGamePortV13Token); // Token, nicht Factory

// PortSelector resolved Port über DI-Container erst bei Bedarf
const portResult = container.resolveWithError(selectedToken);
```

**Garantie:** v14-Ports mit `game.v14NewApi` crashen nicht auf v13, da sie nie instantiiert werden.

---

### Port-Registrierung (Schichttrennung & DI-Instanziierung)

**Struktur:**

```
Configuration Layer (Version Agnostic)
  └─ port-infrastructure.config.ts
      └─ importiert registerV13Ports() Funktion
          └─ ruft registerV13Ports() auf

Concrete Platform Concrete Version Layer
  └─ ports/v13/port-registration.ts
      └─ exportiert registerV13Ports()
          └─ importiert alle v13 Port-Klassen direkt
```

**Beispiel:**

```typescript
// ✅ KORREKT: Config-Schicht (version-agnostic)
// src/framework/config/modules/port-infrastructure.config.ts
import { registerV13Ports } from "@/infrastructure/adapters/foundry/ports/v13/port-registration";

function createPortRegistries() {
  const gamePortRegistry = new PortRegistry<FoundryGame>();

  // Delegiert an version-spezifische Schicht
  const result = registerV13Ports({
    gamePortRegistry,
    hooksPortRegistry,
    // ...
  }, container);

  return ok({ gamePortRegistry, /* ... */ });
}

// ✅ KORREKT: v13-Schicht (concrete version)
// src/infrastructure/adapters/foundry/ports/v13/port-registration.ts
import { FoundryV13GamePort } from "./FoundryV13GamePort";

export function registerV13Ports(
  registries: { gamePortRegistry: PortRegistry<FoundryGame>; ... },
  container: ServiceContainer
): Result<void, string> {
  // 1. Registriere Port-Klassen im DI-Container
  container.registerClass(foundryV13GamePortToken, FoundryV13GamePort, ServiceLifecycle.SINGLETON);

  // 2. Speichere Tokens in PortRegistry (nicht Factories!)
  registries.gamePortRegistry.register(13, foundryGamePortV13Token);

  return ok(undefined);
}
```

**Vorteile:**
- ✅ Schichttrennung respektiert
- ✅ DIP vollständig eingehalten
- ✅ Erweiterbar für v14, v15, etc.
- ✅ Testbar

---

### PortSelector

Wählt den höchsten kompatiblen Port ≤ Foundry-Version:

```typescript
export class PortSelector {
  constructor(
    private readonly eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry,
    private readonly container: ServiceContainer
  ) {}

  selectPortFromTokens<T>(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion?: number
  ): Result<T, FoundryError> {
    // Version-Detection
    const version = foundryVersion ?? this.detectFoundryVersion();

    // Wähle höchsten kompatiblen Port
    const selectedToken = this.selectCompatibleToken(tokens, version);

    // Resolve Port über Container (lazy instantiation)
    const portResult = this.container.resolveWithError(selectedToken);
    if (!portResult.ok) {
      return err(/* ... */);
    }

    return ok(portResult.value);
  }
}
```

---

## Result Pattern

Das Modul nutzt **konsequent** das Result-Pattern für Fehlerbehandlung:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

### Vorteile

- **Explizite Fehlerbehandlung**: Compiler zwingt zur Fehlerbehandlung
- **Keine Exceptions**: Vorhersehbarer Kontrollfluss
- **Komponierbar**: Results können mit `match()` verarbeitet werden

### Verwendung

```typescript
// Services geben Result zurück
getJournalEntries(): Result<JournalEntry[], string> {
  const portResult = this.getPort();
  if (!portResult.ok) return portResult;  // Fehler propagieren
  return portResult.value.getJournalEntries();
}

// Caller behandelt Result
const result = gameService.getJournalEntries();
match(result, {
  onOk: (entries) => console.log(entries),
  onErr: (error) => console.error(error)
});
```

### Result-Handling-Utilities

```typescript
// match - Pattern Matching
match(result, {
  onOk: (value) => console.log(value),
  onErr: (error) => console.error(error)
});

// unwrapOr - Fallback-Wert
const entries = unwrapOr(result, []); // Fallback auf leeres Array

// isOk / isErr - Type Guards
if (isOk(result)) {
  // result.value ist verfügbar
  console.log(result.value);
} else {
  // result.error ist verfügbar
  console.error(result.error);
}
```

**Siehe:** [ADR-0001: Result Pattern](../decisions/0001-use-result-pattern-instead-of-exceptions.md)

---

## Dependency Injection

### ServiceContainer

Zentraler DI-Container mit:
- **Lifecycles**: Singleton, Transient, Scoped
- **Hierarchische Scopes**: Parent-Child-Container mit automatischer Disposal
- **Validation**: Erkennt Zirkelbezüge und fehlende Dependencies
- **Dedicated Error Classes**: `CircularDependencyError`, `FactoryFailedError`, etc.

### Container-Erstellung

**Wichtig**: Verwenden Sie `ServiceContainer.createRoot()` statt `new ServiceContainer()`:

```typescript
// ✅ Korrekt
const container = ServiceContainer.createRoot();

// ❌ Veraltet (Constructor ist private)
const container = new ServiceContainer();
```

### Registrierung

```typescript
// 1. Token definieren
const loggerToken = createToken<Logger>("logger");

// 2. In configureDependencies registrieren
container.registerClass(loggerToken, DIConsoleLoggerService, SINGLETON);

// 3. Überall im Code auflösen
const logger = container.resolve(loggerToken);
```

### Lifecycles

**Singleton:**
- Eine Instanz für alle
- Geteilt über alle Scopes

**Transient:**
- Neue Instanz bei jedem Resolve
- Keine Zustandsteilung

**Scoped:**
- Eine Instanz pro Scope
- Isoliert zwischen Scopes

### DI-Wrapper-Pattern

**Motivation:** Constructor-Signaturen bleiben stabil, Tests können weiterhin die Basisklasse direkt nutzen.

**Umsetzung:**
```typescript
// Basisklasse
class ConsoleLoggerService {
  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    // ...
  }
}

// DI-Wrapper
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    super(env, traceContext);
  }
}
```

**Registrierung:**
- Config-Module registrieren ausschließlich Wrapper
- Constructor-Änderungen bleiben lokal
- Tests können Basisklasse direkt nutzen

### Dependency Declaration

Services deklarieren Dependencies als statische Property:

```typescript
class FoundryGamePort {
  static dependencies = [portSelectorToken, registryToken] as const;

  constructor(
    portSelector: PortSelector,
    registry: PortRegistry<FoundryGame>
  ) { }
}
```

### Hierarchische Scopes

**Parent-Child-Hierarchie:**

```typescript
const parent = ServiceContainer.createRoot();
parent.registerClass(LoggerToken, Logger, SINGLETON);
parent.validate();

// Child kann eigene Services registrieren
const child = parent.createScope("request").value!;
child.registerClass(RequestToken, RequestContext, SCOPED);
child.validate();

const logger = child.resolve(LoggerToken);    // ✅ Von Parent (geteilt)
const ctx = child.resolve(RequestToken);       // ✅ Von Child (isoliert)
```

**Singleton-Scoping-Semantik:**
- **Parent-Singletons**: Über alle Scopes geteilt (gleiche Instanz)
- **Child-Singletons**: Nur in diesem Child + dessen Children sichtbar

**Siehe:** [ADR-0002: Custom DI Container](../decisions/0002-custom-di-container-instead-of-tsyringe.md)

---

## Handler-Pattern

Das **Handler-Pattern** ermöglicht es, mehrere Handler für dasselbe Event zu registrieren.

### Architektur-Hierarchie

```
Application Layer
  ├─ RegisterContextMenuUseCase
  │   ↓ depends on
  │   JournalContextMenuLibWrapperService (Infrastructure Layer)
  │   ↓ depends on
  │   JournalContextMenuHandler[] (Handler-Interface)
  │
  └─ Handler-Implementierungen
      ├─ HideJournalContextMenuHandler
      ├─ ShowJournalContextMenuHandler
      └─ ... weitere Handler (erweiterbar)
```

### Beispiel

```typescript
// Handler-Interface
export interface JournalContextMenuHandler {
  handle(event: JournalContextMenuEvent): void;
}

// Handler-Implementierung
export class HideJournalContextMenuHandler implements JournalContextMenuHandler {
  constructor(
    private readonly journalVisibility: PlatformJournalVisibilityPort,
    private readonly platformUI: PlatformUIPort,
    private readonly notificationCenter: NotificationCenter
  ) {}

  handle(event: JournalContextMenuEvent): void {
    const journalId = this.extractJournalId(event.htmlElement);
    if (!journalId) return;

    // Handler-Logik
    if (shouldShowOption(journalId)) {
      event.options.push({
        name: "Journal ausblenden",
        icon: '<i class="fas fa-eye-slash"></i>',
        callback: async (li) => {
          await this.journalVisibility.setEntryFlag(/* ... */);
        },
      });
    }
  }
}
```

**Vorteile:**
- ✅ Erweiterbar - Neue Context-Menü-Items = neuer Handler
- ✅ Separation of Concerns - Jeder Handler hat eine klare Verantwortung
- ✅ Testbarkeit - Handler einzeln testbar
- ✅ Wiederverwendbar - Handler können in anderen Kontexten genutzt werden

---

## Entity Collections & Repositories

Das Modul verwendet **Entity Collections** und **Repositories** für platform-agnostischen Zugriff auf Entities.

### Collections (Read-Only)

```typescript
interface JournalCollectionPort {
  getAll(): Result<JournalEntry[], EntityCollectionError>;
  getById(id: string): Result<JournalEntry | null, EntityCollectionError>;
  getByIds(ids: string[]): Result<JournalEntry[], EntityCollectionError>;
  exists(id: string): Result<boolean, EntityCollectionError>;
  count(): Result<number, EntityCollectionError>;
  search(query: EntitySearchQuery<JournalEntry>): Result<JournalEntry[], EntityCollectionError>;
  query(): EntityQueryBuilder<JournalEntry>;
}
```

### Repositories (Full CRUD)

```typescript
interface JournalRepository extends JournalCollectionPort {
  create(data: CreateEntityData<JournalEntry>): Promise<Result<JournalEntry, EntityRepositoryError>>;
  update(id: string, changes: EntityChanges<JournalEntry>): Promise<Result<JournalEntry, EntityRepositoryError>>;
  delete(id: string): Promise<Result<void, EntityRepositoryError>>;
  getFlag(id: string, scope: string, key: string): Result<unknown | null, EntityRepositoryError>;
  setFlag(id: string, scope: string, key: string, value: unknown): Promise<Result<void, EntityRepositoryError>>;
  unsetFlag(id: string, scope: string, key: string): Promise<Result<void, EntityRepositoryError>>;
}
```

### Query Builder

Fluent API für komplexe Suchabfragen:

```typescript
// Einfache Abfrage
const result = collection.query()
  .where("name", "contains", "Quest")
  .limit(10)
  .execute();

// OR-Abfrage
const result = collection.query()
  .where("name", "contains", "Quest")
  .orWhere("name", "contains", "Item")
  .execute();

// Komplexe AND/OR-Abfrage
const result = collection.query()
  .where("name", "contains", "Quest")
  .or((qb) => {
    qb.where("name", "contains", "Item");
    qb.where("name", "startsWith", "Note");
  })
  .and((qb) => {
    qb.where("id", "in", ["id1", "id2"]);
  })
  .sortBy("name", "asc")
  .limit(20)
  .execute();
```

---

## Domain-Ports für DIP-Konformität

Neben den Foundry-Versions-Ports gibt es auch **Domain-Ports**, die domänenneutrale Abstraktionen bereitstellen.

### Platform-Ports

- **PlatformNotificationPort**: Platform-agnostische Benachrichtigungen
- **PlatformCachePort**: Platform-agnostisches Caching
- **PlatformI18nPort**: Platform-agnostische Internationalisierung
- **PlatformUIPort**: Platform-agnostische UI-Operationen
- **PlatformSettingsPort**: Platform-agnostische Settings-Verwaltung

### Beispiel: PlatformJournalVisibilityPort

```typescript
// 1. Domain-Port definieren (domänenneutral)
interface PlatformJournalVisibilityPort {
  getAllEntries(): Result<JournalEntry[], JournalVisibilityError>;
  getEntryFlag(entry: JournalEntry, flagKey: string): Result<boolean | null, JournalVisibilityError>;
  removeEntryFromDOM(entryId: string, entryName: string | null, html: HTMLElement): Result<void, JournalVisibilityError>;
}

// 2. Service nutzt Domain-Port (keine Foundry-Abhängigkeiten)
class JournalVisibilityService {
  constructor(private readonly port: PlatformJournalVisibilityPort) {}

  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError> {
    // Geschäftslogik mit domänenneutralen Typen
  }
}

// 3. Foundry-Adapter implementiert Domain-Port
class FoundryJournalVisibilityAdapter implements PlatformJournalVisibilityPort {
  constructor(private readonly foundryJournalFacade: FoundryJournalFacade) {}

  getAllEntries(): Result<JournalEntry[], JournalVisibilityError> {
    // Mapping: FoundryJournalEntry[] → JournalEntry[]
  }
}
```

**Vorteile:**
- ✅ 100% DIP-Konformität
- ✅ Domäne ist vollständig von Foundry entkoppelt
- ✅ Testbarkeit ohne Foundry-Mocks
- ✅ Austauschbar für andere VTTs/Frameworks

---

## Observability & Self-Registration Pattern

### Self-Registration

Services registrieren sich **automatisch** für Observability im Constructor:

```typescript
class PortSelector {
  static dependencies = [
    portSelectionEventEmitterToken,
    observabilityRegistryToken
  ] as const;

  constructor(
    private eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry
  ) {
    // Self-registration: Service meldet sich selbst an
    observability.registerPortSelector(this);
  }

  selectPort() {
    // Events werden automatisch zu Logger/Metrics geroutet
    this.eventEmitter.emit({ type: "success", ... });
  }
}
```

**Vorteile:**
- ✅ Kein manuelles Wiring nötig
- ✅ Service-Erstellung = automatische Observability
- ✅ Erweiterbar ohne Code-Änderungen
- ✅ Type-Safe via `ObservableService<TEvent>`

### ObservabilityRegistry

Zentraler Hub für Observable Services:

```typescript
class ObservabilityRegistry {
  static dependencies = [loggerToken, metricsRecorderToken] as const;

  registerPortSelector(service: ObservableService<PortSelectionEvent>) {
    service.onEvent((event) => {
      if (event.type === "success") {
        this.logger.debug(`Port v${event.selectedVersion} selected`);
        this.metrics.recordPortSelection(event.selectedVersion);
      }
    });
  }
}
```

**Siehe:** [ADR-0006: Observability Strategy](../decisions/0006-observability-strategy.md)

---

## Health-Check-Registry Pattern

Services können sich selbst für Health-Monitoring registrieren:

```typescript
// 1. Health-Check implementieren
class ContainerHealthCheck implements HealthCheck {
  readonly name = "container";

  constructor(private readonly container: ServiceContainer) {}

  check(): boolean {
    return this.container.getValidationState() === "validated";
  }

  getDetails(): string | null {
    const state = this.container.getValidationState();
    return state !== "validated" ? `Container state: ${state}` : null;
  }
}

// 2. Auto-Registrierung via DI-Wrapper
class InjectableContainerHealthCheck extends ContainerHealthCheck {
  static dependencies = [serviceContainerToken, healthCheckRegistryToken] as const;

  constructor(container: ServiceContainer, registry: HealthCheckRegistry) {
    super(container);
    registry.register(this);
  }
}

// 3. ModuleHealthService nutzt Registry
class ModuleHealthService {
  constructor(private readonly registry: HealthCheckRegistry) {}

  getHealth(): HealthStatus {
    const results = this.registry.runAll();
    // Aggregiere alle Check-Ergebnisse
  }
}
```

**Vorteile:**
- ✅ Extensible - Neue Health-Checks ohne ModuleHealthService-Änderungen
- ✅ No Circular Dependencies - ModuleHealthService kennt Container nicht mehr
- ✅ Testable - Health-Checks sind isoliert testbar
- ✅ Modular - Jeder Check hat eine klare Verantwortung (SRP)

---

## Weitere Informationen

- [Architektur-Übersicht](./overview.md) - High-Level Architektur
- [Schichten](./layers.md) - Clean Architecture Schichten
- [Bootstrap](./bootstrap.md) - Bootstrap-Prozess
- [ADRs](../decisions/README.md) - Architecture Decision Records

---

**Letzte Aktualisierung:** 2025-01-XX
