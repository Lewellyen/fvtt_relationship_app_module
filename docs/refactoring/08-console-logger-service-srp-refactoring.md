# Refactoring-Plan: ConsoleLoggerService SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Niedrig
**Betroffene Datei:** `src/infrastructure/logging/ConsoleLoggerService.ts`

---

## Problem-Beschreibung

Die `ConsoleLoggerService`-Klasse verletzt das Single Responsibility Principle (SRP) mit 4 verschiedenen Verantwortlichkeiten:

1. **Logging** (delegiert zu BaseConsoleLogger)
2. **RuntimeConfig-Integration** (RuntimeConfigLoggerDecorator)
3. **Trace-Context-Integration** (TraceContextLoggerDecorator)
4. **Stack-Trace-Integration** (StackTraceLoggerDecorator)

**Aktuelle Architektur:**
- ConsoleLoggerService komponiert Logger aus BaseConsoleLogger und mehreren Decorators
- Führt Decorator-Komposition im Constructor durch
- Delegiert alle Logger-Methoden an komponierten Logger

**Problem:** Obwohl Decorator-Pattern genutzt wird, ist ConsoleLoggerService für die Komposition verantwortlich, was eine separate Verantwortlichkeit ist. Die Komposition sollte in eine separate Factory-Klasse ausgelagert werden.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
ConsoleLoggerService (nur Logger-Interface)
└── Delegiert zu komponiertem Logger

LoggerCompositionFactory (nur Komposition)
├── createLogger(config, traceContext?)
└── Komponiert BaseLogger + Decorators

BaseConsoleLogger (bereits vorhanden)
└── Basis-Logging

RuntimeConfigLoggerDecorator (bereits vorhanden)
└── RuntimeConfig-Integration

TraceContextLoggerDecorator (bereits vorhanden)
└── Trace-Context-Integration

StackTraceLoggerDecorator (bereits vorhanden)
└── Stack-Trace-Integration
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `ConsoleLoggerService` | Nur Logger-Interface | Delegiert zu komponiertem Logger |
| `LoggerCompositionFactory` | Nur Logger-Komposition | `createLogger()` |
| `BaseConsoleLogger` | Nur Basis-Logging | (bereits vorhanden) |
| `RuntimeConfigLoggerDecorator` | Nur RuntimeConfig-Integration | (bereits vorhanden) |
| `TraceContextLoggerDecorator` | Nur Trace-Context-Integration | (bereits vorhanden) |
| `StackTraceLoggerDecorator` | Nur Stack-Trace-Integration | (bereits vorhanden) |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von ConsoleLoggerService testen
   - Logger-Komposition testen
   - Decorator-Integration testen

2. **Interfaces definieren**
   ```typescript
   interface ILoggerCompositionFactory {
     createLogger(
       config: RuntimeConfigService,
       traceContext?: TraceContext
     ): Logger;
   }
   ```

### Phase 2: LoggerCompositionFactory erstellen

3. **LoggerCompositionFactory erstellen**
   - Datei: `src/infrastructure/logging/factory/logger-composition-factory.ts`
   - Implementiert `ILoggerCompositionFactory`
   - Enthält Kompositions-Logik aus ConsoleLoggerService Constructor
   - Tests schreiben

### Phase 3: ConsoleLoggerService refactoren

4. **ConsoleLoggerService umbauen**
   - Kompositions-Logik entfernen aus Constructor → delegiert zu `LoggerCompositionFactory`
   - ConsoleLoggerService erhält komponierten Logger als Dependency
   - Alle Logger-Methoden delegieren weiterhin zu komponiertem Logger
   - Dependencies injizieren: `LoggerCompositionFactory`

5. **Constructor anpassen**
   - LoggerCompositionFactory als Parameter
   - Factory erstellt Logger
   - ConsoleLoggerService speichert Logger

6. **Alternative: Factory-Methode**
   - Statt Dependency-Injection: Factory-Methode `create()` nutzen
   - ConsoleLoggerService.create(config, traceContext?) → erstellt Logger via Factory

### Phase 4: Integration & Tests

7. **Integration Tests**
   - ConsoleLoggerService + LoggerCompositionFactory zusammen testen
   - Vollständiger Flow: Create → Compose → Log
   - Alle Decorators funktionieren korrekt

8. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt unverändert**: Alle Public-Methoden bleiben erhalten
- **Interne Implementierung ändert sich**: Komposition wird extrahiert
- **Keine Breaking Changes**: Externe Consumer merken keine Änderung

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/console-logger-service-srp`
2. **LoggerCompositionFactory implementieren**: Parallel zu bestehendem Code
3. **ConsoleLoggerService refactoren**: Komposition extrahieren
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **LoggerCompositionFactory**
  - `createLogger()` komponiert Logger korrekt
  - Alle Decorators werden korrekt angewendet
  - Trace-Context ist optional
  - Edge Cases (null config, missing traceContext)

- **ConsoleLoggerService (refactored)**
  - Alle Logger-Methoden delegieren korrekt
  - Logger wird korrekt komponiert via Factory

### Integration Tests

- **ConsoleLoggerService + LoggerCompositionFactory**
  - Logger-Komposition funktioniert
  - Alle Decorators funktionieren
  - Logging funktioniert korrekt

- **Vollständiger Flow**
  - Create → Compose → Log → Decorators

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Keine Breaking Changes erwartet**

- Public API bleibt unverändert
- Interne Implementierung ändert sich nur
- Externe Consumer merken keine Änderung

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Factory-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Kompositions-Fehler**
   - **Risiko**: Logger wird nicht korrekt komponiert
   - **Mitigation**: Umfassende Tests für alle Kompositions-Szenarien

3. **Decorator-Reihenfolge**
   - **Risiko**: Decorator-Reihenfolge ist falsch
   - **Mitigation**: Tests für Decorator-Reihenfolge

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ ConsoleLoggerService ist nur für Logger-Interface zuständig
- ✅ LoggerCompositionFactory verwaltet Logger-Komposition
- ✅ Alle Decorators funktionieren korrekt
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Keine Breaking Changes
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll LoggerCompositionFactory als Singleton oder pro Logger-Instanz sein?
2. Wie wird Logger-Caching gehandhabt?
3. Soll LoggerCompositionFactory auch für andere Logger-Types verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [ConsoleLoggerService Source Code](../../src/infrastructure/logging/ConsoleLoggerService.ts)
- [BaseConsoleLogger](../../src/infrastructure/logging/BaseConsoleLogger.ts)
- [RuntimeConfigLoggerDecorator](../../src/infrastructure/logging/RuntimeConfigLoggerDecorator.ts)
- [TraceContextLoggerDecorator](../../src/infrastructure/logging/TraceContextLoggerDecorator.ts)
- [StackTraceLoggerDecorator](../../src/infrastructure/logging/StackTraceLoggerDecorator.ts)

---

**Letzte Aktualisierung:** 2025-12-10

