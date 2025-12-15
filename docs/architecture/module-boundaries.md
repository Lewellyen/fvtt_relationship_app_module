# Modul-Grenzen & Dependencies

**Zweck:** Dokumentation der Modul-Grenzen, Layer-Regeln und Dependency-Flows
**Zielgruppe:** Architekten, Maintainer
**Letzte Aktualisierung:** 2025-12-15
**Projekt-Version:** 0.44.0

---

## Übersicht

Das Modul folgt strikten Layer-Regeln nach Clean Architecture. Dependencies dürfen nur **nach innen** zeigen (Richtung Domain Layer).

---

## Layer-Struktur

```
src/
├── domain/              # Layer 0: Innerste Schicht (keine Dependencies)
├── application/         # Layer 1: Darf nur von domain abhängen
├── infrastructure/      # Layer 2: Darf von domain, application abhängen
└── framework/           # Layer 3: Darf von allen abhängen
```

---

## Dependency-Regeln

### Domain Layer (`src/domain/`)

**Darf abhängen von:**
- ❌ Nichts (außer Standard-Library)

**Darf NICHT abhängen von:**
- ❌ Application Layer
- ❌ Infrastructure Layer
- ❌ Framework Layer
- ❌ Externe Bibliotheken (außer Type-Only-Imports)

**Inhalt:**
- Entities (z.B. `JournalEntry`)
- Ports (z.B. `PlatformNotificationPort`, `PlatformCachePort`)
- Domain Types (z.B. `Result<T, E>`)

---

### Application Layer (`src/application/`)

**Darf abhängen von:**
- ✅ Domain Layer

**Darf NICHT abhängen von:**
- ❌ Infrastructure Layer (konkrete Implementierungen)
- ❌ Framework Layer

**Verwendet:**
- Domain-Ports (Abstraktionen)
- Domain-Types

**Inhalt:**
- Business Services (z.B. `JournalVisibilityService`)
- Use-Cases (z.B. `RegisterContextMenuUseCase`)
- Application Settings
- Health-Check-Interfaces

---

### Infrastructure Layer (`src/infrastructure/`)

**Darf abhängen von:**
- ✅ Domain Layer
- ✅ Application Layer

**Darf NICHT abhängen von:**
- ❌ Framework Layer (außer für Bootstrapping)

**Implementiert:**
- Domain-Ports (z.B. `FoundryJournalCollectionAdapter` implementiert `JournalCollectionPort`)
- Technische Services (Cache, Logging, Notifications)

**Inhalt:**
- Foundry Adapters & Ports
- DI Container & Registry
- CacheService, NotificationCenter
- Observability (Metrics, Tracing)
- I18n Services
- Retry & Performance Services

---

### Framework Layer (`src/framework/`)

**Darf abhängen von:**
- ✅ Domain Layer
- ✅ Application Layer
- ✅ Infrastructure Layer

**Zweck:**
- Bootstrap & Orchestration
- DI-Konfiguration
- Public API Exposition

**Inhalt:**
- Entry Point (`index.ts`)
- Composition Root
- Init Orchestration (`init-solid.ts`)
- DI Config Modules
- Type Definitions

---

## Dependency-Flow-Diagramm

```
Framework Layer
    │
    ├─▶ Infrastructure Layer
    │       │
    │       ├─▶ Application Layer
    │       │       │
    │       │       └─▶ Domain Layer ◀─┐
    │       │                          │
    │       └──────────────────────────┘
    │
    └─▶ Application Layer
            │
            └─▶ Domain Layer
```

---

## Prüfung der Layer-Regeln

### Automatischer Check

```bash
npm run check:domain-boundaries
```

Dieser Befehl führt den Domain-Boundary-Checker aus, der verbotene Imports erkennt.

### Manuelle Prüfung

```bash
npm run analyze:circular
```

Erkennt zirkuläre Dependencies zwischen Modulen.

### Dependency-Graph generieren

```bash
npm run analyze:graph
```

Erstellt `architecture.svg` mit vollständigem Dependency-Graph.

**Layer-spezifische Graphs:**
```bash
npm run analyze:graph:domain
npm run analyze:graph:application
npm run analyze:graph:infrastructure
npm run analyze:graph:framework
```

---

## Typische Verstöße und Lösungen

### Verstoß: Infrastructure-Import in Application

```typescript
// ❌ FALSCH: Application importiert Infrastructure
import { CacheService } from "@/infrastructure/cache/cache-service";

// ✅ RICHTIG: Application importiert Domain-Port
import { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
```

### Verstoß: Domain importiert Application

```typescript
// ❌ FALSCH: Domain importiert Application
import { JournalVisibilityService } from "@/application/services/journal-visibility.service";

// ✅ RICHTIG: Domain bleibt unabhängig
// Service-Logik gehört in Application, nicht Domain
```

### Verstoß: Zirkuläre Dependency

```typescript
// ❌ FALSCH: ServiceA → ServiceB → ServiceA
// Lösung 1: Event-basierte Kommunikation
// Lösung 2: Facade-Pattern einführen
// Lösung 3: Dependency umkehren (DIP)
```

---

## Port-Adapter-Pattern Boundaries

### Foundry Version Ports

```
src/infrastructure/adapters/foundry/
├── interfaces/          # Port-Definitionen (Abstraktionen)
│   ├── FoundryGame.ts
│   ├── FoundryHooks.ts
│   └── ...
├── ports/v13/           # V13-spezifische Adapter
│   ├── FoundryV13GamePort.ts
│   └── ...
├── services/            # Version-agnostische Wrapper
│   ├── FoundryGameService.ts
│   └── ...
└── versioning/          # Port-Selection-Infrastruktur
    ├── PortSelector.ts
    └── PortRegistry.ts
```

**Regel:** Ports in `ports/v13/` dürfen v13-spezifische Foundry-APIs verwenden. Services in `services/` müssen version-agnostisch sein.

---

## Token-basierte Dependency Injection

### Token-Layer-Zuordnung

| Layer | Token-Location | Beispiel |
|-------|---------------|----------|
| Domain | `src/domain/tokens/` | `journalCollectionPortToken` |
| Application | `src/application/tokens/` | `journalVisibilityServiceToken` |
| Infrastructure | `src/infrastructure/shared/tokens/` | `cacheServiceToken`, `loggerToken` |
| Framework | `src/framework/config/` | Config-spezifische Tokens |

---

## Best Practices

### 1. Immer Ports statt konkrete Implementierungen

```typescript
// ✅ RICHTIG
constructor(private readonly cache: PlatformCachePort) {}

// ❌ FALSCH
constructor(private readonly cache: CacheService) {}
```

### 2. Domain-Modelle verwenden

```typescript
// ✅ RICHTIG: Domain-Entity
interface JournalEntry {
  readonly id: string;
  readonly name: string | null;
}

// ❌ FALSCH: Foundry-spezifischer Typ
type JournalEntry = foundry.documents.JournalEntry;
```

### 3. Layer-Grenzen im DI-Wrapper beachten

```typescript
// DI-Wrapper in Infrastructure darf Application-Tokens importieren
import { journalVisibilityServiceToken } from "@/application/tokens";

// DI-Wrapper in Application darf NICHT Infrastructure-Tokens importieren
// (außer über Domain-Ports)
```

---

## Weiterführende Dokumentation

- [Architektur-Übersicht](./overview.md) - High-Level Architektur
- [Schichten](./layers.md) - Detaillierte Layer-Dokumentation
- [Patterns](./patterns.md) - Architektur-Patterns
- [ADR-0007: Clean Architecture Layering](../decisions/0007-clean-architecture-layering.md)

---

**Letzte Aktualisierung:** 2025-12-15
