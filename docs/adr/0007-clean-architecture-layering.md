# ADR-0007: Clean Architecture Layering

**Status**: Accepted  
**Datum**: 2025-11-06  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Modularität, Testbarkeit, Foundry VTT Dependency Management

---

## Kontext und Problemstellung

**Problem**: Foundry VTT Module sind oft "monolithisch":
- Business-Logik vermischt mit Foundry API-Calls
- Schwer testbar (Foundry-Globale `game`, `ui`, `Hooks` schwer mockbar)
- Tight Coupling → Änderungen an Foundry API brechen viel Code
- Keine klare Verantwortlichkeiten → "Alles hängt mit allem zusammen"

**Beispiel: Monolithischer Code**

```typescript
// SCHLECHT: Business-Logik + Foundry API + UI gemischt
Hooks.on("renderJournalDirectory", (app, html, data) => {
  const entries = game.journal.contents; // Foundry API
  const filtered = entries.filter(e => e.name.includes("NPC")); // Business-Logik
  const list = html.find(".directory-list"); // UI
  filtered.forEach(e => {
    list.append(`<li>${e.name}</li>`); // UI
  });
});
```

**Probleme**:
- ❌ Nicht testbar ohne Foundry-Umgebung
- ❌ Logik nicht wiederverwendbar
- ❌ Foundry API-Änderungen → Code überall anfassen

**Ziel**: Clean Architecture → klare Schichten, Dependency Inversion, Testbarkeit.

## Betrachtete Optionen

### Option 1: Keine Architektur (Status Quo vieler Module)

```typescript
// Alles in einer Datei
Hooks.on("ready", () => {
  // ... 500 Zeilen Code ...
});
```

**Nachteile**:
- ❌ Nicht skalierbar
- ❌ Nicht testbar
- ❌ Nicht wartbar

### Option 2: MVC (Model-View-Controller)

```
/models       - Data structures
/views        - UI components
/controllers  - Business logic + Foundry API
```

**Nachteile**:
- ❌ **Controller-God-Objekte**: Controller enthält zu viel (Business + Foundry API)
- ❌ **Tight Coupling**: Views/Controllers direkt abhängig von Foundry

### Option 3: Clean Architecture (Onion Architecture)

```
Core (Business Logic)
  ↓
Configuration (DI, Constants)
  ↓
DI Infrastructure (Container, Resolver)
  ↓
Foundry Adapter (Ports, Services, Hooks)
```

**Vorteile**:
- ✅ **Dependency Inversion**: Core abhängig von Interfaces, nicht von Foundry
- ✅ **Testbarkeit**: Core ohne Foundry testbar
- ✅ **Austauschbarkeit**: Foundry Adapter austauschbar (z.B. für Tests)

## Entscheidung

**Gewählt: Option 3 - Clean Architecture mit 4 Schichten**

### Schichten (von innen nach außen)

```
┌─────────────────────────────────────────┐
│  1. CORE (Business Logic)               │ ← Keine Foundry-Dependencies
│     - composition-root.ts                │
│     - module-hook-registrar.ts           │
│     - init-solid.ts                      │
└─────────────────────────────────────────┘
              ↓ abhängig von
┌─────────────────────────────────────────┐
│  2. CONFIGURATION                        │ ← Konfiguration, kein Code
│     - constants.ts                       │
│     - dependencyconfig.ts                │
└─────────────────────────────────────────┘
              ↓ abhängig von
┌─────────────────────────────────────────┐
│  3. DI INFRASTRUCTURE                    │ ← DI-Container, generisch
│     - container.ts                       │
│     - resolver.ts                        │
│     - tokens/                            │
└─────────────────────────────────────────┘
              ↓ abhängig von
┌─────────────────────────────────────────┐
│  4. FOUNDRY ADAPTER                      │ ← Foundry-spezifisch
│     - foundry/interfaces/                │
│     - foundry/ports/v13/, v14/           │
│     - foundry/services/                  │
│     - foundry/versioning/                │
└─────────────────────────────────────────┘
              ↓ abhängig von
        Foundry VTT API (game, ui, Hooks)
```

### Dependency-Regel

**Regel**: **Äußere Schichten dürfen innere importieren, NICHT umgekehrt!**

```typescript
// ✅ ERLAUBT: Foundry Adapter → DI Infrastructure
import { createToken } from "@/di_infrastructure/tokens";

// ✅ ERLAUBT: Core → Configuration
import { MODULE_CONSTANTS } from "@/constants";

// ❌ VERBOTEN: Configuration → Core
import { CompositionRoot } from "@/core/composition-root"; // In constants.ts

// ❌ VERBOTEN: DI Infrastructure → Foundry Adapter
import { FoundryGameService } from "@/foundry/services/FoundryGameService"; // In container.ts
```

**Ausnahme**: `dependencyconfig.ts` importiert ALLES (ist die zentrale Verdrahtung).

### Schicht 1: CORE (Business Logic)

**Verantwortlichkeit**: Modul-Initialisierung, Hook-Registrierung, Public API

**Dateien**:
- `src/core/composition-root.ts` - Erstellt `ModuleApi`, Bootstrap-Logik
- `src/core/module-hook-registrar.ts` - Registriert Foundry Hooks
- `src/core/init-solid.ts` - Entry Point, ruft Bootstrap auf

**Regeln**:
- ✅ **Keine direkten Foundry API-Calls** (`game`, `ui`, `Hooks` nur via injected Services)
- ✅ **Interfaces statt Implementierungen** (`FoundryGame` statt `FoundryGameService`)
- ✅ **Result-Pattern** für alle Fehler

**Beispiel**:

```typescript
// src/core/composition-root.ts
export function createPublicApi(container: ServiceContainer): ModuleApi {
  return {
    getMetrics: () => {
      const collectorResult = container.resolveWithError(metricsCollectorToken);
      if (!collectorResult.ok) {
        return { error: "Metrics not available" };
      }
      return collectorResult.value.getSnapshot(); // ← Interface-Call
    }
  };
}
```

### Schicht 2: CONFIGURATION

**Verantwortlichkeit**: Konstanten, DI-Konfiguration

**Dateien**:
- `src/constants.ts` - Module-ID, Versionen, Magic Numbers
- `src/config/dependencyconfig.ts` - DI-Registrierungen

**Regeln**:
- ✅ **Nur Daten, kein Code** (außer `dependencyconfig.ts`)
- ✅ **`Object.freeze()`** für Immutability
- ✅ **Zentrale Wahrheit** (keine duplizierten Konstanten)

**Beispiel**:

```typescript
// src/constants.ts
export const MODULE_CONSTANTS = Object.freeze({
  ID: "fvtt-relationship-network",
  VERSION: "0.3.0",
  API: Object.freeze({
    VERSION: "1.0.0"
  })
});
```

### Schicht 3: DI INFRASTRUCTURE

**Verantwortlichkeit**: Dependency Injection, Service Lifecycle

**Dateien**:
- `src/di_infrastructure/container.ts` - ServiceContainer
- `src/di_infrastructure/resolution/ServiceResolver.ts` - Resolution-Logik
- `src/tokens/tokenindex.ts` - Injection Tokens

**Regeln**:
- ✅ **Framework-agnostisch** (keine Foundry-Dependencies)
- ✅ **Wiederverwendbar** (könnte in anderem Projekt genutzt werden)
- ✅ **Type-Safe** (Generics für Tokens)

**Beispiel**:

```typescript
// src/di_infrastructure/container.ts
export class ServiceContainer {
  register<T extends ServiceType>(
    token: Token<T>,
    implementation: Constructor<T>,
    lifecycle: ServiceLifecycle
  ): void {
    this.registrations.set(token.id, { implementation, lifecycle });
  }
}
```

### Schicht 4: FOUNDRY ADAPTER

**Verantwortlichkeit**: Foundry API-Wrapper, Version-Kompatibilität

**Dateien**:
- `src/foundry/interfaces/` - Versionsneutrale Interfaces
- `src/foundry/ports/v13/`, `v14/` - Version-spezifische Implementierungen
- `src/foundry/services/` - DI-kompatible Service-Wrapper
- `src/foundry/versioning/` - Port-Selection-Logik

**Regeln**:
- ✅ **Alle Foundry API-Calls hier** (nirgendwo anders!)
- ✅ **Result-Pattern** für alle Fehler
- ✅ **Interfaces für alle Services** (`FoundryGame`, `FoundryHooks`, etc.)

**Beispiel**:

```typescript
// src/foundry/interfaces/FoundryGame.ts
export interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
}

// src/foundry/ports/v13/FoundryGamePort.ts
export class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries() {
    return tryCatch(
      () => Array.from(game.journal.contents), // ← Einziger Ort mit game.journal!
      (error) => createFoundryError("OPERATION_FAILED", "Failed to get entries", {}, error)
    );
  }
}
```

## Konsequenzen

### Positiv

- ✅ **Testbarkeit**: Core testbar ohne Foundry (Mock-Interfaces)
- ✅ **Foundry-Version-Upgrade**: Nur Adapter-Schicht anfassen (Ports)
- ✅ **Klare Verantwortlichkeiten**: Jede Schicht hat einen Job
- ✅ **Dependency Inversion**: Core abhängig von Interfaces, nicht von Foundry
- ✅ **Wiederverwendbarkeit**: DI Infrastructure in anderen Projekten nutzbar

### Negativ

- ⚠️ **Mehr Dateien**: 4 Schichten → mehr Boilerplate
- ⚠️ **Indirection**: Mehr Schichten → mehr Klicks zum Code
- ⚠️ **Lernkurve**: Clean Architecture nicht trivial

### Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Schichten-Verletzung | Mittel | Mittel | ESLint-Plugin (z.B. `eslint-plugin-import`) für Schicht-Regeln |
| Über-Engineering | Niedrig | Niedrig | Schichten nur wo sinnvoll (kleine Utils können monolithisch sein) |
| Performance-Overhead | Sehr niedrig | Niedrig | DI-Resolution cached, Overhead vernachlässigbar |

## Validierung

**Tests**:
- **Core**: Testbar ohne Foundry (nur Mocks)
- **DI Infrastructure**: 100% testbar ohne Foundry
- **Foundry Adapter**: Integration Tests mit Foundry-Mocks

**Schichten-Regeln**:
- ✅ Core importiert NICHT aus `foundry/`
- ✅ DI Infrastructure importiert NICHT aus `foundry/` oder `core/`
- ✅ Configuration importiert NICHT aus anderen Schichten (außer Typen)

## Best Practices

### Schicht-Kommunikation

**Core → Foundry Adapter**: Via DI + Interfaces

```typescript
// Core
class ModuleBootstrapper {
  static dependencies = [foundryGameToken] as const;
  
  constructor(private foundryGame: FoundryGame) {} // ← Interface!
  
  async init() {
    const entriesResult = this.foundryGame.getJournalEntries();
    // ...
  }
}
```

**Foundry Adapter → Core**: NICHT! (Dependency-Regel)

**Configuration → Alle**: Import von Konstanten OK

```typescript
// Überall erlaubt
import { MODULE_CONSTANTS } from "@/constants";
```

### Neue Features hinzufügen

**Zwei Arten von Ports**:

1. **Infrastructure Ports** (Foundry-spezifisch): `FoundryGame`, `FoundryHooks`, `FoundryUI`
2. **Domain Ports** (platform-agnostisch): `JournalEventPort`, `PlatformUIPort`

**Szenario 1**: "Ich will Actors auslesen" (Infrastructure Port)

1. **Interface erstellen** (`src/foundry/interfaces/FoundryActor.ts`)

   ```typescript
   export interface FoundryActor {
     getActors(): Result<Actor[], FoundryError>;
   }
   ```

2. **Port implementieren** (`src/foundry/ports/v13/FoundryActorPort.ts`)

   ```typescript
   export class FoundryActorPortV13 implements FoundryActor {
     getActors() {
       return ok(Array.from(game.actors.contents));
     }
   }
   ```

3. **Service-Wrapper erstellen** (`src/foundry/services/FoundryActorService.ts`)

   ```typescript
   export class FoundryActorService implements FoundryActor {
     static dependencies = [portSelectorToken, foundryActorPortRegistryToken] as const;
     // ... getPort() Logik ...
   }
   ```

4. **Token erstellen** (`src/tokens/tokenindex.ts`)

   ```typescript
   export const foundryActorToken = createToken<FoundryActor>("FoundryActor");
   ```

5. **DI registrieren** (`src/config/dependencyconfig.ts`)

   ```typescript
   container.register(foundryActorToken, FoundryActorService, ServiceLifecycle.SINGLETON);
   ```

6. **In Core verwenden**

   ```typescript
   class MyFeature {
     static dependencies = [foundryActorToken] as const;
     
     constructor(private foundryActor: FoundryActor) {}
   }
   ```

**Szenario 2**: "Ich will platform-agnostische UI-Operationen" (Domain Port)

1. **Port Interface im Domain Layer** (`src/domain/ports/platform-ui-port.interface.ts`)

   ```typescript
   export interface PlatformUIPort {
     rerenderJournalDirectory(): Result<boolean, PlatformUIError>;
     notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError>;
   }
   ```

2. **Platform-spezifische Adapter im Infrastructure Layer** (`src/infrastructure/adapters/foundry/adapters/foundry-ui-adapter.ts`)

   ```typescript
   export class FoundryUIAdapter implements PlatformUIPort {
     constructor(private readonly foundryUI: FoundryUI) {}
     
     rerenderJournalDirectory(): Result<boolean, PlatformUIError> {
       const result = this.foundryUI.rerenderJournalDirectory();
       return result.ok ? ok(result.value) : err(this.mapError(result.error));
     }
   }
   ```

3. **Use-Case nutzt Domain Port** (`src/application/use-cases/...`)

   ```typescript
   export class TriggerUIReRenderUseCase {
     constructor(private readonly platformUI: PlatformUIPort) {}  // Domain Port, nicht Infrastructure!
   }
   ```

**Vorteil**: Use-Case ist vollständig platform-agnostisch → Multi-VTT-Support (Foundry, Roll20, Fantasy Grounds)

## Beispiele

### Vorher (Monolithisch)

```typescript
// SCHLECHT: Alles in einer Datei, kein DI
Hooks.on("ready", () => {
  const entries = game.journal.contents; // Foundry API
  const filtered = entries.filter(e => e.name.includes("NPC")); // Business-Logik
  ui.notifications.info(`Found ${filtered.length} NPCs`); // Foundry API
});
```

**Probleme**:
- ❌ Nicht testbar (braucht `game`, `ui`)
- ❌ Logik nicht wiederverwendbar
- ❌ Foundry API überall

### Nachher (Clean Architecture)

```typescript
// CORE: src/core/module-hook-registrar.ts
export class ModuleHookRegistrar {
  static dependencies = [foundryGameToken, foundryUIToken, loggerToken] as const;
  
  constructor(
    private foundryGame: FoundryGame, // Interface!
    private foundryUI: FoundryUI,     // Interface!
    private logger: Logger            // Interface!
  ) {}
  
  register(): void {
    Hooks.on("ready", () => this.onReady());
  }
  
  private onReady(): void {
    const entriesResult = this.foundryGame.getJournalEntries();
    if (!entriesResult.ok) {
      this.logger.error("Failed to get entries", { error: entriesResult.error });
      return;
    }
    
    const filtered = this.filterNPCs(entriesResult.value); // Business-Logik
    this.foundryUI.showNotification(`Found ${filtered.length} NPCs`);
  }
  
  private filterNPCs(entries: JournalEntry[]): JournalEntry[] {
    return entries.filter(e => e.name.includes("NPC"));
  }
}

// FOUNDRY ADAPTER: src/foundry/services/FoundryGameService.ts
export class FoundryGameService implements FoundryGame {
  getJournalEntries() {
    return ok(Array.from(game.journal.contents)); // Einziger Ort mit game.journal!
  }
}
```

**Vorteile**:
- ✅ Core testbar (Mocks für `foundryGame`, `foundryUI`, `logger`)
- ✅ Logik wiederverwendbar (`filterNPCs`)
- ✅ Foundry API nur in Adapter-Schicht

## Tooling

**ESLint-Plugin für Schicht-Regeln** (TODO):

```json
// .eslintrc.json
{
  "rules": {
    "import/no-restricted-paths": ["error", {
      "zones": [
        {
          "target": "./src/core",
          "from": "./src/foundry",
          "message": "Core darf nicht von Foundry Adapter abhängen"
        },
        {
          "target": "./src/di_infrastructure",
          "from": "./src/foundry",
          "message": "DI Infrastructure darf nicht von Foundry abhängen"
        }
      ]
    }]
  }
}
```

## Alternativen für die Zukunft

Falls Clean Architecture zu komplex wird:
1. **Vereinfachung**: Schichten 2 & 3 mergen (Config + DI)
2. **Micro-Services**: Modul in mehrere npm-Pakete aufteilen
3. **Monolith**: Zurück zu Option 1 (unwahrscheinlich)

**Aktuell**: Clean Architecture funktioniert hervorragend, kein Handlungsbedarf.

## Referenzen

- **Clean Architecture**: Robert C. Martin (Uncle Bob)
- **Hexagonal Architecture**: Alistair Cockburn (Ports & Adapters)
- Implementation: Gesamte `src/` Struktur
- [Clean Architecture Buch](https://www.amazon.de/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

## Verwandte ADRs

- [ADR-0002](0002-custom-di-container-instead-of-tsyringe.md) - DI Infrastructure ermöglicht Clean Architecture
- [ADR-0003](0003-port-adapter-for-foundry-version-compatibility.md) - Ports = Foundry Adapter
- [ADR-0001](0001-use-result-pattern-instead-of-exceptions.md) - Alle Schichten nutzen Result-Pattern

