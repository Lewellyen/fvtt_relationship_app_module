# ADR-0003: Port-Adapter for Foundry Version Compatibility

**Status**: Accepted  
**Datum**: 2025-11-06  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: Foundry VTT v13+, Multi-Version Support

---

## Kontext und Problemstellung

Foundry VTT entwickelt sich aktiv weiter mit Breaking Changes zwischen Major Versions:
- **v10**: Legacy API
- **v11**: DataModel-Migration
- **v12**: Significant API Changes
- **v13**: Neue Features, API-Refactoring
- **v14+**: Zukünftige Versionen

**Probleme mit direkter Foundry-API-Nutzung:**

1. **Breaking Changes**: Code bricht bei neuen Foundry-Versionen
2. **Eager Loading**: Import von v14-Klassen crasht in v13 (API nicht verfügbar)
3. **Conditional Logic**: Versions-Checks überall im Code verstreut
4. **Schwierige Tests**: Foundry-Globale schwer zu mocken
5. **Tight Coupling**: Business-Logik direkt abhängig von Foundry API

## Betrachtete Optionen

### Option 1: Direkte Foundry-API-Nutzung

```typescript
function getJournalEntries() {
  if (game.version.startsWith("13")) {
    // v13 API
    return game.journal.contents;
  } else if (game.version.startsWith("14")) {
    // v14 API (hypothetisch)
    return game.journal.getAll();
  }
  throw new Error("Unsupported version");
}
```

**Nachteile**:
- ❌ Versions-Checks überall
- ❌ Schwer wartbar
- ❌ Schwierig zu testen

### Option 2: Strateg y Pattern mit Runtime-Selection

```typescript
interface FoundryStrategy {
  getJournalEntries(): JournalEntry[];
}

class V13Strategy implements FoundryStrategy {
  getJournalEntries() { return game.journal.contents; }
}

// Runtime selection
const strategy = game.version.startsWith("13") 
  ? new V13Strategy() 
  : new V14Strategy();
```

**Nachteile**:
- ❌ **Eager Instantiation**: `new V14Strategy()` crasht in v13 (V14-Konstruktor greift auf nicht-existierende API zu)

### Option 3: Port-Adapter Pattern mit Lazy Instantiation

```typescript
// Port Interface (versionsneutral)
interface FoundryGame {
  getJournalEntries(): Result<JournalEntry[], FoundryError>;
  getJournalEntryById(id: string): Result<JournalEntry | null, FoundryError>;
}

// Version-spezifische Implementierung
class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries() {
    return ok(Array.from(game.journal.contents));
  }
}

// Factory-basierte Selection (KRITISCH!)
const factories = new Map([
  [13, () => new FoundryGamePortV13()], // Nicht ausgeführt bis selected!
  [14, () => new FoundryGamePortV14()]  // Wird NIE ausgeführt in v13
]);

const port = selectPort(factories); // Nur kompatible Factory wird ausgeführt
```

**Vorteile**:
- ✅ **Lazy Instantiation**: V14-Konstruktor wird nie aufgerufen in v13
- ✅ **Type-Safe**: Alle Versionen implementieren gleiches Interface
- ✅ **Testbar**: Port-Implementierungen einfach mockbar
- ✅ **Clean**: Versions-Logik zentralisiert in PortSelector

## Entscheidung

**Gewählt: Option 3 - Port-Adapter Pattern mit Lazy Instantiation**

### Komponenten

**1. Port Interfaces** (`src/foundry/interfaces/`)

Versionsneutrale Interfaces für Foundry API:

```typescript
// src/foundry/interfaces/FoundryGame.ts
export interface FoundryGame {
  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError>;
  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError>;
}
```

**2. Port Implementations** (`src/foundry/ports/v13/`, `src/foundry/ports/v14/`, ...)

Version-spezifische Implementierungen:

```typescript
// src/foundry/ports/v13/FoundryGamePort.ts
export class FoundryGamePortV13 implements FoundryGame {
  getJournalEntries() {
    return tryCatch(
      () => Array.from(game.journal.contents),
      (error) => createFoundryError("OPERATION_FAILED", "Failed to get journal entries", {}, error)
    );
  }
}
```

**3. PortRegistry** (`src/foundry/versioning/portregistry.ts`)

Registry für Factory-Functions (lazy instantiation):

```typescript
const gamePortRegistry = new PortRegistry<FoundryGame>();
gamePortRegistry.registerPort(13, () => new FoundryGamePortV13());
gamePortRegistry.registerPort(14, () => new FoundryGamePortV14());
```

**4. PortSelector** (`src/foundry/versioning/portselector.ts`)

Wählt kompatible Version basierend auf `game.version`:

```typescript
const factories = gamePortRegistry.getFactories();
const portResult = portSelector.selectPortFromFactories(factories);
// Nur die passende Factory wird ausgeführt!
```

**5. Service Wrappers** (`src/foundry/services/`)

Wrappen Ports für DI-Integration:

```typescript
export class FoundryGameService implements FoundryGame, Disposable {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken] as const;

  private port: FoundryGame | null = null;

  getJournalEntries() {
    const portResult = this.getPort(); // Lazy
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }
}
```

### Selection Logic

**Regel**: Nutze höchste kompatible Version ≤ aktuelle Foundry-Version

```
Foundry v13 running:
  Available: [13, 14]
  → Select: v13 (höchste ≤ 13)

Foundry v14 running:
  Available: [13, 14]
  → Select: v14 (höchste ≤ 14)

Foundry v15 running:
  Available: [13, 14]
  → Select: v14 (höchste ≤ 15, Fallback auf v14)
```

## Konsequenzen

### Positiv

- ✅ **Crash-Safety**: V14-Code wird nie in v13 geladen/instantiiert
- ✅ **Forward-Compatible**: V15 kann v14-Port nutzen (graceful degradation)
- ✅ **Testbarkeit**: Ports einfach mockbar (keine Foundry-Globale nötig)
- ✅ **Type-Safety**: Interface erzwingt Implementierung aller Methoden
- ✅ **Separation of Concerns**: Business-Logik (Services) ↔ Foundry-API (Ports)
- ✅ **Performance**: Lazy Instantiation, nur ein Port pro Service
- ✅ **Metrics**: Port-Selection-Erfolg/Fehler trackbar

### Negativ

- ⚠️ **Boilerplate**: Jede Foundry-API-Änderung → neuer Port + Registry-Entry
- ⚠️ **Indirection**: Mehr Schichten zwischen Business-Logik und Foundry
- ⚠️ **Version-Proliferation**: Potenziell viele Port-Versionen

### Risiken & Mitigation

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Foundry v14 Breaking Changes | Hoch | Mittel | Ports bereits vorbereitet, v13 als Fallback |
| Port-Inkonsistenzen | Niedrig | Mittel | Interface erzwingt Konsistenz |
| Selection-Fehler | Niedrig | Hoch | Extensive Tests, Production-Logging |

## Alternativen für die Zukunft

Falls das Port-Pattern zu aufwändig wird:
1. **Foundry v13-Only**: Nur v13 supporten, Ports entfernen
2. **Foundry API Wrapper Library**: Ports in eigene npm-Library auslagern
3. **Polyfills**: V13-API auf v14 polyfill en statt neue Ports

**Aktuell**: Port-Pattern funktioniert gut, kein Handlungsbedarf.

## Validierung

**Tests**:
- Unit Tests: 20 Tests für PortSelector, 14 Tests für PortRegistry
- Integration Tests: 6 Tests für Lazy Instantiation
- Service Tests: Alle Services testen Port-Selection-Fehler

**Production**:
- Metrics zeigen 0 Port-Selection-Failures in v13
- Performance: Port-Selection <1ms (fast-path cached)

## Referenzen

- **Hexagonal Architecture**: Ports and Adapters (Alistair Cockburn)
- Implementation: `src/foundry/versioning/`, `src/foundry/ports/`, `src/foundry/services/`
- Tests: `src/foundry/versioning/__tests__/`
- [Foundry VTT API Docs](https://foundryvtt.com/api/)

## Verwandte ADRs

- [ADR-0001](0001-use-result-pattern-instead-of-exceptions.md) - Ports verwenden Result-Pattern
- [ADR-0002](0002-custom-di-container-instead-of-tsyringe.md) - Container injiziert Ports

