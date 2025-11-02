# Architecture Documentation

## Beziehungsnetzwerke für Foundry VTT - Architektur

Dieses Dokument beschreibt die Architektur des Foundry VTT Relationship App Moduls.

---

## Schichtenarchitektur

Das Modul folgt einer klaren Schichtentrennung mit unidirektionalen Abhängigkeiten:

```
┌─────────────────────────────────────────────────┐
│  Core Layer (Bootstrap & Orchestration)         │
│  • init-solid.ts                                │
│  • composition-root.ts                          │
│  • module-hook-registrar.ts                     │
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
class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V13-spezifische Logik
  }
}

// 3. Service nutzt Interface, nicht konkrete Implementierung
class FoundryGameService implements FoundryGame {
  private port: FoundryGame;  // Wird zur Laufzeit aufgelöst
}
```

### Child-Scope Registrierungen (NEU)

**Wichtig**: Children erben Parent-Registrierungen, können aber eigene hinzufügen:

```typescript
const parent = ServiceContainer.createRoot();
parent.registerClass(LoggerToken, Logger, SINGLETON);
parent.validate();

// Child kann eigene Services registrieren
const child = parent.createScope("request").value!;
child.registerClass(RequestToken, RequestContext, SCOPED); // ✅ Child-spezifisch
child.validate(); // ✅ Child muss selbst validieren!

const logger = child.resolve(LoggerToken);    // ✅ Von Parent (geteilt)
const ctx = child.resolve(RequestToken);       // ✅ Von Child (isoliert)
```

### Singleton-Scoping-Semantik

- **Parent-Singletons**: Über alle Scopes geteilt (gleiche Instanz)
- **Child-Singletons**: Nur in diesem Child + dessen Children sichtbar

```typescript
const parent = ServiceContainer.createRoot();
parent.registerClass(SharedToken, SharedService, SINGLETON);
parent.validate();

const child1 = parent.createScope().value!;
const child2 = parent.createScope().value!;

child1.registerClass(Child1Token, Child1Service, SINGLETON);
child1.validate();

// Shared singleton: gleiche Instanz
const shared1 = child1.resolve(SharedToken);
const shared2 = child2.resolve(SharedToken);
console.log(shared1 === shared2); // true

// Child singleton: isoliert
const c1 = child1.resolve(Child1Token);
const c2Result = child2.resolveWithError(Child1Token);
console.log(c2Result.ok); // false (nicht in child2)
```

### Komponenten

#### 1. **Interfaces** (`src/foundry/interfaces/`)
Definieren den Vertrag für Foundry-Interaktionen:
- `FoundryGame` - Journal-Zugriff
- `FoundryHooks` - Hook-System
- `FoundryDocument` - Dokument-Flags
- `FoundryUI` - UI-Manipulationen

#### 2. **Ports** (`src/foundry/ports/v13/`)
Versionsspezifische Implementierungen der Interfaces:
- `FoundryGamePortV13`
- `FoundryHooksPortV13`
- `FoundryDocumentPortV13`
- `FoundryUIPortV13`

#### 3. **Services** (`src/foundry/services/`)
Version-agnostische Wrapper mit Lazy-Loading:
```typescript
class FoundryGameService implements FoundryGame {
  private getPort(): Result<FoundryGame, string> {
    // Wählt automatisch den richtigen Port basierend auf Foundry-Version
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) return err(result.error);
      this.port = result.value;
    }
    return ok(this.port);
  }
}
```

#### 4. **PortSelector** (`src/foundry/versioning/portselector.ts`)
Wählt den höchsten kompatiblen Port ≤ Foundry-Version:
- Foundry v13 → v13 Port
- Foundry v14 → v14 Port (falls vorhanden), sonst v13

#### 5. **PortRegistry** (`src/foundry/versioning/portregistry.ts`)
Registry für verfügbare Port-Implementierungen:
```typescript
const registry = new PortRegistry<FoundryGame>();
registry.register(13, () => new FoundryGamePortV13());
registry.register(14, () => new FoundryGamePortV14()); // Zukünftig
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
container.registerClass(loggerToken, ConsoleLoggerService, SINGLETON);

// 3. Überall im Code auflösen
const logger = container.resolve(loggerToken);
```

### Dependency Declaration

Services deklarieren Dependencies als statische Property:
```typescript
class FoundryGameService {
  static dependencies = [portSelectorToken, registryToken] as const;
  
  constructor(
    portSelector: PortSelector, 
    registry: PortRegistry<FoundryGame>
  ) { }
}
```

---

## Erweiterung für neue Foundry-Versionen

### Schritt 1: Port-Implementierung erstellen

```typescript
// src/foundry/ports/v14/FoundryGamePort.ts
export class FoundryGamePortV14 implements FoundryGame {
  getJournalEntries(): Result<JournalEntry[], string> {
    // V14-spezifische Implementierung
  }
}
```

### Schritt 2: Port registrieren

```typescript
// src/config/dependencyconfig.ts
const gamePortRegistry = new PortRegistry<FoundryGame>();
gamePortRegistry.register(13, () => new FoundryGamePortV13());
gamePortRegistry.register(14, () => new FoundryGamePortV14()); // NEU
```

### Schritt 3: module.json aktualisieren

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

---

## Bootstrap-Prozess

### Phase 1: Eager Bootstrap (vor Foundry init)

```typescript
// src/core/init-solid.ts
const root = new CompositionRoot();
const bootstrapResult = root.bootstrap();
// → Erstellt ServiceContainer
// → Registriert alle Dependencies
// → Validiert Container
```

### Phase 2: Foundry init Hook

```typescript
Hooks.on("init", () => {
  root.exposeToModuleApi();           // API unter game.modules.get().api
  new ModuleHookRegistrar().registerAll();  // Hooks registrieren
});
```

### Phase 3: Foundry ready Hook

```typescript
Hooks.on("ready", () => {
  // Modul voll einsatzbereit
  // Services über api.resolve() nutzbar
});
```

---

## Fehlerbehandlung

### Ebenen

1. **Port-Ebene**: Foundry-API-Fehler → Result
2. **Service-Ebene**: Port-Selektion-Fehler → Result
3. **Orchestrator-Ebene** (z.B. ModuleHookRegistrar): Result-Handling + Logging

### Container-Fehler

Dedizierte Error-Klassen mit Cause-Chains:
- `CircularDependencyError` - Zirkelbezug erkannt
- `ScopeRequiredError` - Scoped Service ohne Scope
- `InvalidLifecycleError` - Ungültiger Lifecycle
- `FactoryFailedError` - Factory-Fehler mit ursprünglicher Ursache

---

## Code-Konventionen

### UTF-8 Encoding
**Alle Dateien MÜSSEN UTF-8 ohne BOM sein.**  
Deutsche Umlaute (ä, ö, ü, ß) müssen korrekt dargestellt werden.

### Naming
- **Interfaces**: PascalCase ohne "I"-Präfix (`FoundryGame`)
- **Services**: `<Name>Service` (`FoundryGameService`)
- **Ports**: `<Name>Port<Version>` (`FoundryGamePortV13`)
- **Tokens**: camelCase mit "Token"-Suffix (`loggerToken`)

### Result Pattern
- **Alle externen Interaktionen** (Foundry API, Dateisystem) geben Result zurück
- **throw** nur für Programmierfehler, nie für erwartbare Fehler

### Logging
- Services loggen **nicht** intern
- Logging erfolgt auf Orchestrator-Ebene (z.B. ModuleHookRegistrar)
- Konsequenz: Services bleiben rein funktional

---

## Abhängigkeitsdiagramm

```
CompositionRoot
    │
    ├─▶ ServiceContainer
    │       │
    │       ├─▶ Logger (Singleton, mit Fallback)
    │       │
    │       ├─▶ PortSelector (Singleton)
    │       │
    │       ├─▶ PortRegistries (Values)
    │       │   ├─▶ FoundryGamePortRegistry
    │       │   ├─▶ FoundryHooksPortRegistry
    │       │   ├─▶ FoundryDocumentPortRegistry
    │       │   └─▶ FoundryUIPortRegistry
    │       │
    │       └─▶ Services (Singletons)
    │           ├─▶ FoundryGameService
    │           │   └─▶ (lazy) FoundryGamePortV13
    │           │
    │           ├─▶ FoundryHooksService
    │           │   └─▶ (lazy) FoundryHooksPortV13
    │           │
    │           ├─▶ FoundryDocumentService
    │           │   └─▶ (lazy) FoundryDocumentPortV13
    │           │
    │           └─▶ FoundryUIService
    │               └─▶ (lazy) FoundryUIPortV13
    │
    └─▶ ModuleHookRegistrar
        └─▶ Nutzt Services via Container
```

---

## Testing-Strategie

### Unit Tests
- **Ports**: Mocken Foundry-API
- **Services**: Mocken PortSelector/PortRegistry
- **Container**: Testen Lifecycle und Validation

### Integration Tests
- Reale Port-Selektion
- Service-Port-Interaktion

### Headless Tests
Soft-Abort in `init-solid.ts` erlaubt Tests ohne Foundry:
```typescript
if (typeof Hooks === "undefined") {
  logger.warn("Foundry Hooks API not available - skipped");
  // Keine Hooks registriert, aber Modul geladen
}
```

---

## Weiterführende Dokumentation

- **TypeScript Configuration**: `tsconfig.json` - Strict Mode aktiviert
- **DI Infrastructure**: `src/di_infrastructure/` - Container-Implementierung
- **Foundry Adapter**: `src/foundry/` - Port-Pattern-Implementierung
- **Core**: `src/core/` - Bootstrap und Orchestrierung

---

**Letzte Aktualisierung**: 2025-01-06

