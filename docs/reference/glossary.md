# Glossar

**Zweck:** Begriffslexikon für Architektur-Begriffe, Foundry-spezifische Begriffe und Abkürzungen
**Zielgruppe:** Alle (Entwickler, Contributor, Maintainer)
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Architektur-Begriffe

### Clean Architecture

Architektur-Pattern mit klarer Schichtentrennung:
- **Domain Layer**: Framework-unabhängige Geschäftslogik
- **Application Layer**: Anwendungslogik (Services, Use-Cases)
- **Infrastructure Layer**: Technische Infrastruktur (DI, Cache, etc.)
- **Framework Layer**: Framework-Integration (Bootstrap, Config)

**Siehe:** [Architektur-Übersicht](../architecture/overview.md)

---

### Port-Adapter-Pattern

Hexagonal Architecture Pattern zur Unterstützung mehrerer Foundry-Versionen:

- **Port**: Interface/Abstraktion (z.B. `FoundryGame`)
- **Adapter**: Versionsspezifische Implementierung (z.B. `FoundryV13GamePort`)
- **Service**: Version-agnostischer Wrapper (z.B. `FoundryGamePort`)

**Vorteile:**
- Version-agnostische Services
- Lazy Instantiation (nur kompatible Ports werden instanziiert)
- Erweiterbar für neue Foundry-Versionen

**Siehe:** [Port-Adapter-Pattern](../architecture/patterns.md#port-adapter-pattern)

---

### Result Pattern

Explizite Fehlerbehandlung ohne Exceptions:

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Vorteile:**
- Type-safe Error Handling
- Compiler zwingt zur Fehlerbehandlung
- Keine unerwarteten Exceptions

**Siehe:** [Result Pattern](../architecture/patterns.md#result-pattern)

---

### Dependency Injection (DI)

Pattern zur Loose Coupling:

- **ServiceContainer**: Zentrale DI-Container-Implementierung
- **InjectionToken**: Type-safe Token für Service-Registrierung
- **Lifecycle**: Singleton, Transient, Scoped

**Siehe:** [Dependency Injection](../architecture/patterns.md#dependency-injection)

---

### Port vs. Adapter

- **Port**: Interface/Abstraktion (z.B. `FoundryGame`)
- **Adapter**: Konkrete Implementierung (z.B. `FoundryV13GamePort`)

**Beispiel:**
```typescript
// Port (Interface)
interface FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string>;
}

// Adapter (Implementierung)
class FoundryV13GamePort implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V13-spezifische Implementierung
  }
}
```

---

### Service vs. Facade

- **Service**: Geschäftslogik-Komponente (z.B. `JournalVisibilityService`)
- **Facade**: Vereinfachte API für komplexe Subsysteme (z.B. `FoundryJournalFacade`)

**Beispiel:**
```typescript
// Service: Geschäftslogik
class JournalVisibilityService {
  getHiddenJournalEntries(): Result<JournalEntry[], Error> {
    // Business Logic
  }
}

// Facade: Vereinfachte API
class FoundryJournalFacade {
  // Kombiniert FoundryGame, FoundryDocument, FoundryUI
}
```

---

### Token vs. Injection Token

- **Token**: Symbol für Service-Identifikation
- **InjectionToken**: Type-safe Token mit Typ-Information

**Beispiel:**
```typescript
// Injection Token (Type-safe)
export const loggerToken: InjectionToken<Logger> = createToken<Logger>("logger");

// Verwendung
const logger = container.resolve(loggerToken); // Type: Logger
```

---

### Collection vs. Repository

- **Collection**: Read-Only Zugriff auf Entities (z.B. `JournalCollectionPort`)
- **Repository**: Vollständige CRUD-Operationen (z.B. `JournalRepository`)

**Beispiel:**
```typescript
// Collection: Read-Only
interface JournalCollectionPort {
  getAll(): Result<JournalEntry[], Error>;
  getById(id: string): Result<JournalEntry | null, Error>;
  query(): EntityQueryBuilder<JournalEntry>;
}

// Repository: CRUD
interface JournalRepository extends JournalCollectionPort {
  create(data: CreateEntityData<JournalEntry>): Promise<Result<JournalEntry, Error>>;
  update(id: string, changes: EntityChanges<JournalEntry>): Promise<Result<JournalEntry, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}
```

---

## Foundry-spezifische Begriffe

### Foundry VTT

Virtual Tabletop-Software für Pen & Paper-Rollenspiele.

**Versionen:**
- **v13+**: Unterstützt (aktuell)
- **v10-12**: Nicht unterstützt

**Siehe:** [Foundry API](https://foundryvtt.com/api/)

---

### Module

Erweiterbares Add-on für Foundry VTT.

**Dieses Modul:**
- ID: `fvtt_relationship_app_module`
- Manifest: `module.json`
- Öffentliche API: `game.modules.get('fvtt_relationship_app_module').api`

---

### Hook

Event-System in Foundry VTT.

**Beispiele:**
- `init` - Modul-Initialisierung
- `ready` - Foundry bereit
- `renderJournalDirectory` - Journal-Directory wird gerendert

**Siehe:** [Foundry Hooks API](https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html)

---

### Journal Entry

Dokument in Foundry VTT für Notizen, Quests, etc.

**Verwendung:**
- Journal-Einträge können Flags haben
- Flags steuern Sichtbarkeit/Verhalten
- Dieses Modul nutzt Flags für Verstecken-Funktion

---

### Flag

Metadaten an Foundry-Dokumenten (Actors, Items, Journal Entries).

**Format:**
```typescript
flags: {
  'fvtt_relationship_app_module': {
    hidden: true
  }
}
```

**Siehe:** [Foundry Flags](https://foundryvtt.com/article/flags/)

---

## Abkürzungen

### ADR

**Architecture Decision Record** - Dokumentierte Architektur-Entscheidung.

**Siehe:** [ADRs](../decisions/README.md)

---

### API

**Application Programming Interface** - Öffentliche Schnittstelle für externe Module.

**Siehe:** [API-Referenz](./api-reference.md)

---

### DI

**Dependency Injection** - Pattern zur Loose Coupling.

**Siehe:** [Dependency Injection](../architecture/patterns.md#dependency-injection)

---

### DIP

**Dependency Inversion Principle** - SOLID-Prinzip.

**Regel:** Abhängigkeiten sollten auf Abstraktionen zeigen, nicht auf konkrete Implementierungen.

---

### ISP

**Interface Segregation Principle** - SOLID-Prinzip.

**Regel:** Clients sollten nicht gezwungen werden, Interfaces zu implementieren, die sie nicht nutzen.

---

### LSP

**Liskov Substitution Principle** - SOLID-Prinzip.

**Regel:** Objekte sollten durch Instanzen ihrer Subtypen ersetzbar sein.

---

### OCP

**Open/Closed Principle** - SOLID-Prinzip.

**Regel:** Software-Einheiten sollten offen für Erweiterungen, aber geschlossen für Modifikationen sein.

---

### SRP

**Single Responsibility Principle** - SOLID-Prinzip.

**Regel:** Eine Klasse sollte nur einen Grund zur Änderung haben.

---

### TTL

**Time To Live** - Lebensdauer von Cache-Einträgen.

**Standard:** 5000ms (konfigurierbar)

---

### UI

**User Interface** - Benutzeroberfläche.

**Komponenten:**
- Svelte-Komponenten
- Cytoscape.js (Graph-Visualisierung)
- @xyflow/svelte (Graph-Interaktionen)

---

### VTT

**Virtual Tabletop** - Virtueller Spieltisch.

**Beispiele:**
- Foundry VTT
- Roll20
- Fantasy Grounds

---

## Technische Begriffe

### Bootstrap

Initialisierungsprozess des Moduls.

**Phasen:**
1. Eager Bootstrap (vor Foundry init)
2. Foundry init Hook
3. Foundry ready Hook

**Siehe:** [Bootstrap](../architecture/bootstrap.md)

---

### Container

**ServiceContainer** - DI-Container für Service-Registrierung und -Auflösung.

**Lifecycles:**
- **Singleton**: Eine Instanz für alle
- **Transient**: Neue Instanz bei jedem Resolve
- **Scoped**: Eine Instanz pro Scope

**Siehe:** [Dependency Injection](../architecture/patterns.md#dependency-injection)

---

### Lifecycle

Lebenszyklus von Services im DI-Container.

**Typen:**
- **Singleton**: Geteilt über alle Scopes
- **Transient**: Neue Instanz bei jedem Resolve
- **Scoped**: Eine Instanz pro Scope

---

### Scope

Isolierter Bereich im DI-Container.

**Verwendung:**
- Parent-Child-Hierarchie
- Scoped Services sind scope-spezifisch
- Parent-Singletons werden geteilt

---

### Token

**InjectionToken** - Type-safe Identifier für Services.

**Beispiel:**
```typescript
export const loggerToken: InjectionToken<Logger> = createToken<Logger>("logger");
```

---

### Wrapper

**DI-Wrapper** - Wrapper-Klasse für DI-Registrierung.

**Pattern:**
```typescript
// Basisklasse
class ConsoleLoggerService {
  // ...
}

// DI-Wrapper
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken] as const;
  // ...
}
```

**Vorteile:**
- Constructor-Signaturen bleiben stabil
- Tests können Basisklasse direkt nutzen
- Config registriert nur Wrapper

---

## Weitere Ressourcen

- [Architektur-Übersicht](../architecture/overview.md) - Architektur-Details
- [Patterns](../architecture/patterns.md) - Architektur-Patterns
- [Quick Reference](./quick-reference.md) - Schnellreferenz

---

**Letzte Aktualisierung:** 2025-01-XX
