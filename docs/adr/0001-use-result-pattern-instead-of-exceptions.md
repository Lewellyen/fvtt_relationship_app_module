# ADR-0001: Use Result Pattern instead of Exceptions

**Status**: Accepted  
**Datum**: 2025-11-06  
**Entscheider**: Andreas Rothe  
**Technischer Kontext**: TypeScript strict mode, Foundry VTT Module

---

## Kontext und Problemstellung

Foundry VTT Module müssen robust mit Fehlern umgehen, da sie in einer Umgebung mit:
- Mehreren aktiven Modulen (potenzielle Konflikte)
- Verschiedenen Foundry-Versionen (API-Unterschiede)
- Benutzer-generierten Daten (ungültige Eingaben)
- Asynchronen Operationen (Netzwerk, Datei-IO)

laufen.

**Probleme mit Exception-basiertem Error-Handling:**

1. **Unzuverlässige Type-Safety**: TypeScript tracked keine Exceptions in Function-Signatures
2. **Versteckte Fehlerquellen**: Caller wissen nicht welche Exceptions geworfen werden können
3. **Fehlende Compile-Time-Checks**: Vergessene try/catch führen zu Runtime-Crashes
4. **Schlechte Kompatibilität**: Foundry API wirft manchmal, manchmal returned undefined
5. **Schwierige Testbarkeit**: Exception-Pfade schwerer zu testen als Result-Pfade

## Betrachtete Optionen

### Option 1: Exception-basiertes Error-Handling (Standard JavaScript/TypeScript)

```typescript
function getJournalEntry(id: string): JournalEntry {
  if (!game.journal) {
    throw new Error("Journal API not available");
  }
  const entry = game.journal.get(id);
  if (!entry) {
    throw new Error(`Entry ${id} not found`);
  }
  return entry;
}

// Caller muss wissen dass Exceptions geworfen werden können
try {
  const entry = getJournalEntry("abc123");
} catch (error) {
  console.error(error);
}
```

**Vorteile**:
- ✅ Etabliertes Pattern in JavaScript/TypeScript
- ✅ Weniger Boilerplate-Code
- ✅ Stack-Traces automatisch

**Nachteile**:
- ❌ Keine Type-Safety für Fehler
- ❌ Caller können try/catch vergessen
- ❌ Schwer zu testen (alle Error-Pfade)
- ❌ Inkonsistent mit Foundry API (manchmal throws, manchmal undefined)

### Option 2: Result Pattern (Functional Error-Handling)

```typescript
function getJournalEntry(id: string): Result<JournalEntry, FoundryError> {
  if (!game.journal) {
    return err(createFoundryError("API_NOT_AVAILABLE", "Journal API not available"));
  }
  const entry = game.journal.get(id);
  if (!entry) {
    return err(createFoundryError("NOT_FOUND", `Entry ${id} not found`));
  }
  return ok(entry);
}

// Caller MUSS Result prüfen (Type-System erzwingt es)
const result = getJournalEntry("abc123");
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}
```

**Vorteile**:
- ✅ **Type-Safety**: Errors sind Teil der Function-Signature
- ✅ **Compile-Time-Checks**: TypeScript erzwingt Error-Handling
- ✅ **Explizit**: Caller sehen sofort dass Fehler möglich sind
- ✅ **Testbar**: Alle Pfade leicht testbar
- ✅ **Kompatibel**: Funktioniert mit Foundry API (kein Umbau nötig)
- ✅ **Chainable**: map(), andThen(), match() für funktionale Komposition

**Nachteile**:
- ❌ Mehr Boilerplate (ok(), err() wrapper)
- ❌ Ungewohnt für JS/TS-Entwickler (mehr Rust/Haskell-Style)

### Option 3: Hybrid-Ansatz

Exceptions für unerwartete Fehler, Result für erwartete Fehler.

**Nachteile**:
- ❌ Inkonsistent - schwer zu wissen wann welches Pattern
- ❌ Caller müssen beide Patterns unterstützen

## Entscheidung

**Gewählt: Option 2 - Result Pattern**

Alle Funktionen die fehlschlagen können geben `Result<T, E>` zurück.

### Implementierung

**Core Type** (`src/types/result.ts`):

```typescript
export type Ok<T> = { ok: true; value: T };
export type Err<E> = { ok: false; error: E };
export type Result<T, E> = Ok<T> | Err<E>;
```

**Utility Functions** (`src/utils/result.ts`):

- `ok(value)` - Erstellt Success-Result
- `err(error)` - Erstellt Error-Result
- `map()`, `andThen()` - Chainable Operations
- `match()` - Pattern-Matching
- `fromPromise()` - Promise → Result Conversion
- `all()` - Multiple Results kombinieren

**Error Types**:

- `ContainerError` - DI-Container Fehler
- `FoundryError` - Foundry API Fehler

### Ausnahmen (Exceptions erlaubt)

1. **Öffentliche API** (`src/core/module-api.ts`): `container.resolve()` wirft Exceptions für externe Module (die das Result-Pattern nicht kennen)
2. **Unerwartete Fehler**: Assertion-Failures, Programming-Errors (sollen crashen)

## Konsequenzen

### Positiv

- ✅ **Robustheit**: Alle Fehlerquellen explizit behandelt
- ✅ **Type-Safety**: Compiler erzwingt Error-Handling
- ✅ **Wartbarkeit**: Funktions-Signaturen dokumentieren Fehlerquellen
- ✅ **Testbarkeit**: >95% Test-Coverage durch einfaches Error-Path-Testing
- ✅ **Konsistenz**: Einheitliches Pattern durchgehend

### Negativ

- ⚠️ **Learning Curve**: Team muss Result-Pattern lernen
- ⚠️ **Boilerplate**: Mehr Code (if/else checks)
- ⚠️ **Inkompatibel**: Nicht direkt kompatibel mit Exception-based Libraries

### Neutral

- 📝 **Dokumentation**: Result-Pattern gut dokumentiert in README und ARCHITECTURE.md
- 📝 **Utils**: Umfangreiche Utility-Library für Result-Handling
- 📝 **Migration**: Vollständige Migration abgeschlossen (alle Services verwenden Result)

## Referenzen

- [Rust Result Type](https://doc.rust-lang.org/std/result/)
- [Railway Oriented Programming (F#)](https://fsharpforfunandprofit.com/rop/)
- [Neverthrow (TypeScript Result Library)](https://github.com/supermacro/neverthrow)
- Implementation: `src/types/result.ts`, `src/utils/result.ts`
- Tests: `src/utils/__tests__/result.test.ts` (34 Tests)

## Verwandte ADRs

- [ADR-0002](0002-custom-di-container-instead-of-tsyringe.md) - DI-Container verwendet Result-Pattern intern
- [ADR-0004](0004-branded-types-for-api-safety.md) - API-Boundary unterscheidet Result vs. Exceptions

