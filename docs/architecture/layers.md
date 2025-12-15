# Clean Architecture Schichten

**Zweck:** Detaillierte Dokumentation der Clean Architecture Schichten
**Zielgruppe:** Architekten, Maintainer
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Übersicht

Die gesamte `/src` Struktur wurde nach Clean Architecture Prinzipien restrukturiert:

```
src/
├── domain/              # Framework-unabhängige Geschäftslogik
├── application/         # Anwendungslogik (Services, Use-Cases)
├── infrastructure/      # Technische Infrastruktur (DI, Cache, etc.)
└── framework/           # Framework-Integration (Bootstrap, Config)
```

**Import-Pfade bleiben stabil:** Alle `@/`-Imports funktionieren unverändert durch `tsconfig.json` paths.

---

## Domain Layer (`src/domain/`)

**Zweck:** Framework-unabhängige Geschäftslogik

**Regel:** Darf NICHT von application/infrastructure/framework abhängen.

### Struktur

```
src/domain/
├── entities/                    # Domain-Modelle
│   └── journal-entry.ts         # JournalEntry Entity
├── ports/                       # Abstraktions-Interfaces
│   ├── platform-notification-port.interface.ts
│   ├── platform-cache-port.interface.ts
│   ├── platform-i18n-port.interface.ts
│   ├── platform-ui-port.interface.ts
│   ├── platform-settings-port.interface.ts
│   ├── collections/            # Collection Port Interfaces
│   │   ├── platform-entity-collection-port.interface.ts
│   │   └── journal-collection-port.interface.ts
│   └── repositories/           # Repository Port Interfaces
│       ├── platform-entity-repository.interface.ts
│       └── journal-repository.interface.ts
└── types/                       # Domain Types
    ├── result.ts                # Result Pattern Types
    └── cache/                   # Cache Types
```

### Inhalt

**Entities:**
- Domain-Modelle (z.B. `JournalEntry`)
- Framework-unabhängig
- Keine Foundry-Abhängigkeiten

**Ports:**
- Abstraktions-Interfaces für platform-agnostische Operationen
- Domain-Ports (PlatformNotificationPort, PlatformCachePort, etc.)
- Collection Ports (PlatformEntityCollectionPort, JournalCollectionPort)
- Repository Ports (PlatformEntityRepository, JournalRepository)

**Types:**
- Gemeinsame Datentypen (Result, Error-Types)
- Framework-unabhängig

---

## Application Layer (`src/application/`)

**Zweck:** Anwendungslogik

**Regel:** Darf von domain abhängen, aber NICHT von infrastructure/framework.

### Struktur

```
src/application/
├── services/                    # Business Services
│   ├── journal-visibility.service.ts
│   ├── runtime-config.service.ts
│   └── module-health.service.ts
├── use-cases/                   # Use-Case-Implementierungen
│   ├── register-context-menu.use-case.ts
│   ├── invalidate-journal-cache-on-change.use-case.ts
│   └── process-journal-directory-on-render.use-case.ts
├── settings/                    # Modul-Settings
│   └── module-settings.definitions.ts
├── health/                      # Health-Check-System
│   ├── health-check.interface.ts
│   ├── health-check-registry.ts
│   └── health-checks/
└── tokens/                      # Application-Layer Tokens
```

### Inhalt

**Services:**
- Business Services (JournalVisibility, RuntimeConfig, ModuleHealth)
- Nutzen Domain-Ports (keine Foundry-Abhängigkeiten)
- Geschäftslogik

**Use-Cases:**
- Use-Case-Implementierungen
- Event-Handler (RenderJournalDirectory, CacheInvalidation)
- Context-Menu-Handler

**Settings:**
- Modul-Settings-Definitionen
- Settings-Konfiguration

**Health:**
- Health-Check-System
- Health-Check-Registry
- Health-Check-Implementierungen

---

## Infrastructure Layer (`src/infrastructure/`)

**Zweck:** Technische Infrastruktur

**Regel:** Konkrete Implementierungen, darf nach innen abhängen.

### Struktur

```
src/infrastructure/
├── adapters/
│   └── foundry/                 # Foundry VTT Integration
│       ├── interfaces/          # Foundry Interfaces
│       ├── ports/               # Versionsspezifische Ports
│       │   └── v13/
│       ├── services/            # Version-agnostische Services
│       ├── collection-adapters/ # Collection Adapters
│       ├── repository-adapters/ # Repository Adapters
│       └── validation/          # Input-Validierung
├── di/                          # Dependency Injection
│   ├── container.ts
│   ├── registry.ts
│   └── resolver.ts
├── cache/                       # Caching
│   └── cache-service.ts
├── notifications/               # NotificationCenter & Channels
│   ├── notification-center.ts
│   └── channels/
├── observability/               # Metrics, Tracing, Performance
│   ├── metrics/
│   ├── trace/
│   └── performance/
├── i18n/                        # Internationalisierung
│   ├── i18n-facade.service.ts
│   └── handlers/
├── logging/                     # Logging-Infrastruktur
│   ├── console-logger.service.ts
│   └── bootstrap-logger.service.ts
├── retry/                       # Retry-Logik
│   └── retry-service.ts
├── performance/                 # Performance-Metriken
│   └── performance-tracking.service.ts
└── shared/                      # Shared Utilities
    ├── tokens/
    ├── utils/
    ├── constants/
    └── polyfills/
```

### Inhalt

**Adapters:**
- Foundry VTT Integration (Ports, Services, Validation)
- Collection Adapters (FoundryJournalCollectionAdapter)
- Repository Adapters (FoundryJournalRepositoryAdapter)

**DI:**
- ServiceContainer
- Registry
- Resolver

**Cache:**
- CacheService mit TTL
- Cache-Metriken

**Notifications:**
- NotificationCenter
- Channels (ConsoleChannel, UIChannel)

**Observability:**
- Metrics Collector
- Trace Context
- Performance Tracking

**I18n:**
- I18n Facade Service
- Translation Handlers

**Logging:**
- Console Logger Service
- Bootstrap Logger Service

**Retry:**
- Retry Service mit Exponential Backoff

**Performance:**
- Performance Tracking Service

**Shared:**
- Tokens, Utils, Constants, Polyfills

---

## Framework Layer (`src/framework/`)

**Zweck:** Framework-Integration

**Regel:** Framework/Adapter-Glue, sollte dünn sein.

### Struktur

```
src/framework/
├── index.ts                     # Entry Point & Bootstrap
├── core/                         # Bootstrap, Composition Root, Init
│   ├── init-solid.ts
│   ├── composition-root.ts
│   ├── module-api-initializer.ts
│   ├── module-event-registrar.ts
│   └── module-settings-registrar.ts
├── api/                          # Public API
│   └── module-api-initializer.ts
├── config/                       # DI-Konfiguration
│   ├── dependencyconfig.ts
│   └── modules/                  # Thematische Config-Module
│       ├── core-services.config.ts
│       ├── observability.config.ts
│       ├── port-infrastructure.config.ts
│       ├── foundry-services.config.ts
│       ├── utility-services.config.ts
│       ├── i18n-services.config.ts
│       ├── event-ports.config.ts
│       ├── notifications.config.ts
│       ├── cache-services.config.ts
│       └── registrars.config.ts
└── types/                        # Type Definitions
    ├── custom.d.ts
    └── global.d.ts
```

### Inhalt

**Core:**
- Bootstrap (init-solid.ts)
- Composition Root (composition-root.ts)
- Module API Initializer
- Module Event Registrar
- Module Settings Registrar

**API:**
- Public API Exposition
- API-Safe Tokens

**Config:**
- DI-Konfiguration (modular)
- Thematische Config-Module

**Types:**
- TypeScript-Deklarationen
- Custom Types
- Global Types

---

## Dependency-Regeln

### Domain Layer

**Darf abhängen von:**
- ❌ Nichts (außer Standard-Library)

**Darf NICHT abhängen von:**
- ❌ Application Layer
- ❌ Infrastructure Layer
- ❌ Framework Layer

---

### Application Layer

**Darf abhängen von:**
- ✅ Domain Layer

**Darf NICHT abhängen von:**
- ❌ Infrastructure Layer (konkrete Implementierungen)
- ❌ Framework Layer

**Verwendet:**
- Domain-Ports (PlatformNotificationPort, PlatformCachePort, etc.)
- Domain-Types (Result, Error-Types)

---

### Infrastructure Layer

**Darf abhängen von:**
- ✅ Domain Layer
- ✅ Application Layer

**Darf NICHT abhängen von:**
- ❌ Framework Layer (außer für Bootstrap)

**Implementiert:**
- Domain-Ports (FoundryJournalCollectionAdapter, FoundryJournalRepositoryAdapter)
- Application-Services (via DI)

---

### Framework Layer

**Darf abhängen von:**
- ✅ Domain Layer
- ✅ Application Layer
- ✅ Infrastructure Layer

**Zweck:**
- Framework-Integration
- Bootstrap
- DI-Konfiguration

---

## Dependency-Flow

```
Framework Layer
    ↓ depends on
Infrastructure Layer
    ↓ depends on
Application Layer
    ↓ depends on
Domain Layer
```

**Richtung:** Abhängigkeiten zeigen nach innen (Domain ist am unabhängigsten).

---

## Runtime Config Layer

**Zweck:** Einheitliche API für Build-Time Defaults (ENV) und Runtime-Overrides (Foundry Settings).

**Komponenten:**
- **EnvironmentConfig (ENV)**: Build-Time Defaults
- **RuntimeConfigService**: Runtime-Konfiguration mit Live-Updates
- **ModuleSettingsRegistrar**: Foundry-Settings-Integration

**Ablauf:**
1. Bootstrap: `RuntimeConfigService` initialisiert mit `ENV`-Defaults
2. Init Hook: Foundry-Settings werden gelesen und an `RuntimeConfigService` übergeben
3. Live Updates: Settings-Änderungen werden sofort propagiert

**Siehe:** [Konfiguration](../guides/configuration.md)

---

## Modular Configuration Structure

Die DI-Konfiguration ist in thematische Module aufgeteilt:

```
src/framework/config/modules/
├── core-services.config.ts        # Logger, Metrics, Environment
├── observability.config.ts       # EventEmitter, ObservabilityRegistry
├── port-infrastructure.config.ts # PortSelector, PortRegistries
├── foundry-services.config.ts    # FoundryGame, Hooks, Document, UI
├── utility-services.config.ts    # Performance, Retry
├── i18n-services.config.ts       # I18n Services
├── event-ports.config.ts         # Event Ports & Use-Cases
├── notifications.config.ts        # NotificationCenter & Channels
├── cache-services.config.ts      # CacheService
└── registrars.config.ts          # ModuleSettingsRegistrar, ModuleEventRegistrar
```

**Vorteile:**
- ✅ Jedes Modul < 200 Zeilen
- ✅ Klare thematische Trennung
- ✅ Einfach erweiterbar
- ✅ Übersichtlicher Orchestrator

---

## Bootstrap Value Kategorien

Die Konfiguration unterscheidet drei Value-Typen:

### 1. Static Values

`registerStaticValues()` injiziert vorhandene Bootstrap-Werte:
- `EnvironmentConfig` (ENV)
- `ServiceContainer` selbst

Diese Werte existieren bereits außerhalb des Containers und werden unverändert geteilt.

### 2. Subcontainer Values

`registerSubcontainerValues()` registriert vorvalidierte Registries:
- Foundry Port Registries
- Kapseln versionierte Tokens
- Agieren als Mini-Container für Adapter-Lookups

### 3. Loop-Prevention Services

`registerLoopPreventionServices()` registriert Health-Checks:
- ContainerHealthCheck
- MetricsHealthCheck
- Instanziierung erfolgt erst nach erfolgreicher Validation

**Reihenfolge:** Stellt sicher, dass nur vollständig validierte Services mit sensiblen Value-Registrierungen gekoppelt werden.

---

## Self-Configuring Services

Services konfigurieren sich selbst via Constructor-Dependencies:

```typescript
// Beispiel: DI-Wrapper für Logger
class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext: TraceContext) {
    super(env, traceContext);  // Self-configuring!
  }
}
```

**Vorteile:**
- ✅ Automatische Konfiguration
- ✅ Keine manuelle Setup-Logik
- ✅ Testbar (Dependencies können gemockt werden)

---

## Weitere Informationen

- [Architektur-Übersicht](./overview.md) - High-Level Architektur
- [Patterns](./patterns.md) - Architektur-Patterns
- [Bootstrap](./bootstrap.md) - Bootstrap-Prozess
- [Modul-Grenzen](./module-boundaries.md) - Dependencies & Layer-Analyse

---

**Letzte Aktualisierung:** 2025-01-XX
