# Architektur-Übersicht

**Zweck:** High-Level Architektur-Dokumentation des Moduls
**Zielgruppe:** Architekten, Maintainer, Entwickler
**Letzte Aktualisierung:** 2025-01-XX
**Projekt-Version:** 0.43.18 (Pre-Release)

---

## Übersicht

Das Modul implementiert eine **Clean Architecture** mit **Dependency Injection**, **Port-Adapter-Pattern** für Foundry VTT-Versionskompatibilität und **Result-Pattern** für fehlerfreies Error Handling.

**Status:** Version 0.43.18 (Pre-Release)
**Breaking Changes:** ✅ Erlaubt (bis Modul 1.0.0)
**Legacy-Code:** ❌ Wird unmittelbar bereinigt

---

## Schichtenarchitektur

Das Modul folgt einer klaren Schichtentrennung mit unidirektionalen Abhängigkeiten:

```
┌─────────────────────────────────────────────────┐
│  Framework Layer (Bootstrap & Orchestration)    │
│  • init-solid.ts (Orchestrator)                 │
│  • composition-root.ts (DI Bootstrap)           │
│  • module-api-initializer.ts (API Exposition)   │
│  • module-event-registrar.ts (Event Listeners)  │
│  • module-settings-registrar.ts (Settings)       │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Configuration Layer                            │
│  • dependencyconfig.ts                          │
│  • Zentrale DI-Konfiguration                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  DI Infrastructure Layer                        │
│  • ServiceContainer                             │
│  • Tokens & Interfaces                          │
│  • Error Classes                                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Foundry Adapter Layer                          │
│  ┌─────────────┐    ┌──────────┐               │
│  │  Services   │───▶│  Ports   │───▶ Foundry   │
│  └─────────────┘    └──────────┘      API      │
│  (Version-agnostic) (Version-specific)          │
└─────────────────────────────────────────────────┘
```

**Siehe:** [Schichten-Details](./layers.md)

---

## Clean Architecture Schichten

Die gesamte `/src` Struktur wurde nach Clean Architecture Prinzipien restrukturiert:

### Domain Layer (`src/domain/`)

**Zweck:** Framework-unabhängige Geschäftslogik

**Inhalt:**
- `entities/` - Domain-Modelle (Journal-Entry)
- `ports/` - Abstraktions-Interfaces (PlatformNotificationPort, PlatformCachePort, etc.)
- `ports/collections/` - Collection Port Interfaces
- `ports/repositories/` - Repository Port Interfaces
- `types/` - Domain Types (Result)

**Regel:** Darf NICHT von application/infrastructure/framework abhängen.

---

### Application Layer (`src/application/`)

**Zweck:** Anwendungslogik

**Inhalt:**
- `services/` - Business Services (JournalVisibility, Runtime Config, Health)
- `use-cases/` - Use-Case-Implementierungen
- `settings/` - Modul-Settings
- `health/` - Health-Check-System

**Regel:** Darf von domain abhängen, aber NICHT von infrastructure/framework.

---

### Infrastructure Layer (`src/infrastructure/`)

**Zweck:** Technische Infrastruktur

**Inhalt:**
- `adapters/foundry/` - Foundry VTT Integration (Ports, Services, Validation)
- `di/` - Dependency Injection (Container, Registry, Resolver)
- `cache/` - Caching (CacheService)
- `notifications/` - NotificationCenter & Channels
- `observability/` - Metrics, Tracing, Performance Tracking
- `i18n/` - Internationalisierung
- `logging/` - Logging-Infrastruktur
- `retry/` - Retry-Logik
- `performance/` - Performance-Metriken

**Regel:** Konkrete Implementierungen, darf nach innen abhängen.

---

### Framework Layer (`src/framework/`)

**Zweck:** Framework-Integration

**Inhalt:**
- `index.ts` - Entry Point & Bootstrap
- `core/` - Bootstrap, Composition Root, Init
- `api/` - Public API (ModuleApiInitializer)
- `config/` - DI-Konfiguration (Module-basiert)
- `types/` - Type Definitions

**Regel:** Framework/Adapter-Glue, sollte dünn sein.

**Siehe:** [Schichten-Details](./layers.md)

---

## Wichtige Konzepte

### Port-Adapter-Pattern

Unterstützung für mehrere Foundry-Versionen durch versionierte Port-Implementierungen.

**Vorteile:**
- Version-agnostische Services
- Lazy Instantiation (nur kompatible Ports werden instanziiert)
- Erweiterbar für neue Foundry-Versionen

**Siehe:** [Port-Adapter-Pattern](./patterns.md#port-adapter-pattern)

---

### Result Pattern

Explizite Fehlerbehandlung ohne Exceptions.

```typescript
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

**Vorteile:**
- Type-safe Error Handling
- Compiler zwingt zur Fehlerbehandlung
- Keine unerwarteten Exceptions

**Siehe:** [Result Pattern](./patterns.md#result-pattern)

---

### Dependency Injection

Custom DI-Container mit automatischer Dependency Resolution.

**Features:**
- Lifecycles: Singleton, Transient, Scoped
- Hierarchische Scopes: Parent-Child-Container
- Validation: Erkennt Zirkelbezüge und fehlende Dependencies

**Siehe:** [Dependency Injection](./patterns.md#dependency-injection)

---

## Architektur-Garantien

### Port-Adapter: Lazy Instantiation

Das Modul verhindert Crashes durch inkompatible Port-Versionen:

- ✅ Nur der kompatible Port wird instanziiert
- ✅ Neuere Ports (v14+) werden auf v13 nie aufgerufen
- ✅ Automatische Fallback-Selektion (v14 → v13)

**Siehe:** [Port-Adapter-Pattern](./patterns.md#port-adapter-pattern)

---

### Hook-Kompatibilität

Foundry-Hooks werden sowohl im alten (jQuery) als auch neuen Format (HTMLElement) unterstützt:

- ✅ v10-12: jQuery-Wrapper werden automatisch extrahiert
- ✅ v13+: Native HTMLElement direkt verwendet
- ✅ Keine manuelle Anpassung nötig

---

### Type-Safe Public API

Die Modul-API behält volle Typ-Information:

```typescript
const api = game.modules.get('fvtt_relationship_app_module').api;

// logger hat Typ Logger (nicht ServiceType)
const logger = api.resolve(api.tokens.loggerToken);
logger.info("Type-safe!"); // Autocomplete funktioniert

// game hat Typ FoundryGame (nicht ServiceType)
const game = api.resolve(api.tokens.foundryGameToken);
const journals = game.getJournalEntries(); // Type-safe!
```

**Siehe:** [API-Referenz](../reference/api-reference.md)

---

## Komponenten-Übersicht

### 1. Interfaces (`src/infrastructure/adapters/foundry/interfaces/`)

Definieren den Vertrag für Foundry-Interaktionen:
- `FoundryGame` - Journal-Zugriff
- `FoundryHooks` - Hook-System
- `FoundryDocument` - Dokument-Flags
- `FoundryUI` - UI-Manipulationen
- `FoundrySettings` - Settings-Verwaltung
- `FoundryI18n` - Internationalisierung

---

### 2. Ports (`src/infrastructure/adapters/foundry/ports/v13/`)

Versionsspezifische Implementierungen der Interfaces:
- `FoundryV13GamePort`
- `FoundryV13HooksPort`
- `FoundryV13DocumentPort`
- `FoundryV13UIPort`
- `FoundryV13SettingsPort`
- `FoundryV13I18nPort`

---

### 3. Services (`src/infrastructure/adapters/foundry/services/`)

Version-agnostische Wrapper die von `FoundryServiceBase` erben:
- `FoundryGamePort` - Wrapper für FoundryGame
- `FoundryHooksPort` - Wrapper für FoundryHooks
- `FoundryDocumentPort` - Wrapper für FoundryDocument
- `FoundryUIPort` - Wrapper für FoundryUI
- `FoundrySettingsPort` - Wrapper für FoundrySettings
- `FoundryI18nPort` - Wrapper für FoundryI18n

**FoundryServiceBase:**
- Abstract Base Class für alle Foundry Services
- Eliminiert Code-Duplikation (getPort-Logik)
- Integrierte Retry-Logik
- Konsistentes Disposal-Pattern

---

### 4. PortSelector (`src/infrastructure/adapters/foundry/versioning/portselector.ts`)

Wählt den höchsten kompatiblen Port ≤ Foundry-Version:
- Foundry v13 → v13 Port
- Foundry v14 → v14 Port (falls vorhanden), sonst v13

---

### 5. PortRegistry (`src/infrastructure/adapters/foundry/versioning/portregistry.ts`)

Registry für verfügbare Port-Implementierungen (Token-basiert).

---

## Erweiterung für neue Foundry-Versionen

### Schritt 1: Port-Implementierung erstellen

```typescript
// src/infrastructure/adapters/foundry/ports/v14/FoundryGamePort.ts
export class FoundryGamePortV14 implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V14-spezifische Implementierung
  }
}
```

### Schritt 2: Port registrieren

```typescript
// src/infrastructure/adapters/foundry/ports/v14/port-registration.ts
export function registerV14Ports(
  registries: { gamePortRegistry: PortRegistry<FoundryGame>; ... },
  container: ServiceContainer
): Result<void, string> {
  // Port-Klassen im DI-Container registrieren
  container.registerClass(foundryV14GamePortToken, FoundryV14GamePort, ServiceLifecycle.SINGLETON);

  // Tokens in PortRegistry speichern
  registries.gamePortRegistry.register(14, foundryGamePortV14Token);

  return ok(undefined);
}
```

### Schritt 3: Config aktualisieren

```typescript
// src/framework/config/modules/port-infrastructure.config.ts
const v14Result = registerV14Ports(registries, container);
if (isErr(v14Result)) return v14Result;
```

### Schritt 4: module.json aktualisieren

```json
{
  "compatibility": {
    "minimum": 13,
    "verified": 14,  // ← aktualisieren
    "maximum": 14
  }
}
```

**Das war's!** Keine Änderungen an Services oder Core-Logik nötig.

**Siehe:** [Foundry-Integration](../guides/foundry-integration.md)

---

## Bootstrap-Prozess

### Phase 1: Eager Bootstrap (vor Foundry init)

```typescript
// src/framework/core/init-solid.ts
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
// → Erstellt ServiceContainer
// → Registriert alle Dependencies (modular)
```

### Phase 2: Foundry init Hook

```typescript
Hooks.on("init", () => {
  root.exposeToModuleApi();  // API unter game.modules.get().api

  // Registrars werden via DI aufgelöst
  const settingsRegistrar = container.resolveWithError(moduleSettingsRegistrarToken);
  settingsRegistrar.value.registerAll(container);

  const eventRegistrar = container.resolveWithError(moduleEventRegistrarToken);
  eventRegistrar.value.registerAll(container);
});
```

### Phase 3: Foundry ready Hook

```typescript
Hooks.on("ready", () => {
  // Modul voll einsatzbereit
  // Services über api.resolve() nutzbar
});
```

**Siehe:** [Bootstrap-Prozess](./bootstrap.md)

---

## Modular Configuration Structure

Die DI-Konfiguration ist in thematische Module aufgeteilt:

```
src/framework/config/
├── dependencyconfig.ts                (Orchestrator)
├── modules/
│   ├── core-services.config.ts        (Logger, Metrics, Environment)
│   ├── observability.config.ts        (EventEmitter, ObservabilityRegistry)
│   ├── port-infrastructure.config.ts  (PortSelector, PortRegistries)
│   ├── foundry-services.config.ts     (FoundryGame, Hooks, Document, UI)
│   ├── utility-services.config.ts     (Performance, Retry)
│   ├── i18n-services.config.ts        (I18n Services)
│   ├── event-ports.config.ts           (Event Ports & Use-Cases)
│   ├── notifications.config.ts        (NotificationCenter & Channels)
│   ├── cache-services.config.ts       (CacheService)
│   └── registrars.config.ts            (ModuleSettingsRegistrar, ModuleEventRegistrar)
```

**Vorteile:**
- ✅ Jedes Modul < 200 Zeilen
- ✅ Klare thematische Trennung
- ✅ Einfach erweiterbar
- ✅ Übersichtlicher Orchestrator

---

## Entity Collections & Repositories

Das Modul verwendet **Entity Collections** und **Repositories** für platform-agnostischen Zugriff auf Entities.

### Collections (Read-Only)

- `PlatformEntityCollectionPort<T>` - Generisches Interface
- `JournalCollectionPort` - Spezialisiert für JournalEntry
- Operationen: `getAll()`, `getById()`, `query()`, `search()`

### Repositories (Full CRUD)

- `PlatformEntityRepository<T>` - Generisches Interface
- `JournalRepository` - Spezialisiert für JournalEntry
- Erweitert Collections um: `create()`, `update()`, `delete()`, `getFlag()`, `setFlag()`

**Siehe:** [Modul-Grenzen](./module-boundaries.md)

---

## Domain-Ports für DIP-Konformität

Neben den Foundry-Versions-Ports gibt es auch **Domain-Ports**, die domänenneutrale Abstraktionen bereitstellen:

- **PlatformNotificationPort** - Platform-agnostische Benachrichtigungen
- **PlatformCachePort** - Platform-agnostisches Caching
- **PlatformI18nPort** - Platform-agnostische Internationalisierung
- **PlatformUIPort** - Platform-agnostische UI-Operationen
- **PlatformSettingsPort** - Platform-agnostische Settings-Verwaltung

**Vorteile:**
- ✅ 100% DIP-Konformität
- ✅ Domäne ist vollständig von Foundry entkoppelt
- ✅ Testbarkeit ohne Foundry-Mocks
- ✅ Austauschbar für andere VTTs/Frameworks

---

## Code-Konventionen

### UTF-8 Encoding

**Alle Dateien MÜSSEN UTF-8 ohne BOM sein.**

### Naming

- **Interfaces**: PascalCase ohne "I"-Präfix (`FoundryGame`)
- **Ports**: `<Name>Port` (`FoundryGamePort`)
- **Versions-Ports**: `<Name>Port<Version>` (`FoundryV13GamePort`)
- **Tokens**: camelCase mit "Token"-Suffix (`loggerToken`)

### Result Pattern

- **Alle externen Interaktionen** (Foundry API, Dateisystem) geben Result zurück
- **throw** nur für Programmierfehler, nie für erwartbare Fehler

### Logging

- **Bootstrap-Phase:** Dedizierter `BootstrapLoggerService`
- **Nach Validation:** Alle Komponenten loggen über NotificationCenter

**Siehe:** [Code-Standards](../development/coding-standards.md)

---

## Weiterführende Dokumentation

### Architektur-Details

- [Schichten](./layers.md) - Clean Architecture Schichten im Detail
- [Patterns](./patterns.md) - Port-Adapter, Result, DI
- [Bootstrap](./bootstrap.md) - Bootstrap-Prozess im Detail
- [Modul-Grenzen](./module-boundaries.md) - Dependencies & Layer-Analyse

### Entwickler-Guides

- [Quick Reference](../reference/quick-reference.md) - Schnellreferenz
- [Token-Katalog](../reference/tokens.md) - DI-Token-Übersicht
- [Service-Übersicht](../reference/services.md) - Service-Dokumentation

### Entscheidungen

- [ADRs](../decisions/README.md) - Architecture Decision Records

---

**Letzte Aktualisierung:** 2025-01-XX
