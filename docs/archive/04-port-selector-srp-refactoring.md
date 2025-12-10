# Refactoring-Plan: PortSelector SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/infrastructure/adapters/foundry/versioning/portselector.ts`

---

## Problem-Beschreibung

Die `PortSelector`-Klasse verletzt das Single Responsibility Principle (SRP) mit 4 verschiedenen Verantwortlichkeiten:

1. **Port-Auswahl** (`selectPortFromTokens`, Version-Matching-Algorithmus)
2. **Event-Emission** (emit success/failure events)
3. **Self-Registration** (registriert sich selbst bei ObservabilityRegistry)
4. **Performance-Tracking** (inline performance.now() tracking)

**Aktuelle Architektur:**
- PortSelector führt Port-Auswahl durch
- Emittiert Events direkt via `eventEmitter.emit()`
- Registriert sich selbst bei ObservabilityRegistry im Constructor
- Führt inline Performance-Tracking mit `performance.now()` durch

**Problem:** Port-Auswahl, Event-Handling und Observability sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

**Hinweis:** Es existiert bereits ein `PortSelectionObserver`, aber PortSelector nutzt EventEmitter direkt statt über den Observer.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
PortSelector (nur Port-Auswahl)
├── selectPortFromTokens()
└── Version-Matching-Algorithmus

PortSelectionEventEmitter (bereits vorhanden)
└── emit(), subscribe()

PortSelectionObserver (bereits vorhanden)
└── handleEvent()

PortSelectionObservability (neu)
├── registerWithObservabilityRegistry()
└── setupObservability()

PortSelectionPerformanceTracker (neu)
├── startTracking()
└── endTracking() → durationMs
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `PortSelector` | Nur Port-Auswahl | `selectPortFromTokens()` |
| `PortSelectionEventEmitter` | Nur Event-Emission | `emit()`, `subscribe()` (bereits vorhanden) |
| `PortSelectionObserver` | Nur Observability-Handling | `handleEvent()` (bereits vorhanden) |
| `PortSelectionObservability` | Nur Self-Registration | `registerWithObservabilityRegistry()` |
| `PortSelectionPerformanceTracker` | Nur Performance-Tracking | `startTracking()`, `endTracking()` |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von PortSelector testen
   - Event-Emission testen
   - Observability-Registration testen
   - Performance-Tracking testen

2. **Interfaces definieren**
   ```typescript
   interface IPortSelectionObservability {
     registerWithObservabilityRegistry(selector: PortSelector): void;
     setupObservability(selector: PortSelector, observer: PortSelectionObserver): void;
   }

   interface IPortSelectionPerformanceTracker {
     startTracking(): void;
     endTracking(): number; // returns durationMs
   }
   ```

### Phase 2: Neue Klassen erstellen

3. **PortSelectionObservability erstellen**
   - Datei: `src/infrastructure/adapters/foundry/versioning/port-selection-observability.ts`
   - Implementiert `IPortSelectionObservability`
   - Enthält Self-Registration-Logik aus Constructor
   - Tests schreiben

4. **PortSelectionPerformanceTracker erstellen**
   - Datei: `src/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker.ts`
   - Implementiert `IPortSelectionPerformanceTracker`
   - Enthält Performance-Tracking-Logik aus `selectPortFromTokens()`
   - Tests schreiben

### Phase 3: PortSelector refactoren

5. **PortSelector umbauen**
   - Constructor: Observability-Registration entfernen → delegiert zu `PortSelectionObservability`
   - `selectPortFromTokens()`: Performance-Tracking entfernen → delegiert zu `PortSelectionPerformanceTracker`
   - `selectPortFromTokens()`: Event-Emission entfernen → nutzt `PortSelectionObserver` statt direkt EventEmitter
   - Dependencies injizieren: `PortSelectionObservability`, `PortSelectionPerformanceTracker`, `PortSelectionObserver`

6. **Event-Emission refactoren**
   - PortSelector nutzt `PortSelectionObserver` statt direkt `eventEmitter.emit()`
   - Observer ruft `eventEmitter.emit()` auf
   - PortSelector ruft `observer.handleEvent()` auf

7. **Performance-Tracking refactoren**
   - `performance.now()` entfernen aus `selectPortFromTokens()`
   - Performance-Tracker starten vor Port-Auswahl
   - Performance-Tracker beenden nach Port-Auswahl
   - Duration an Observer übergeben

### Phase 4: Integration & Tests

8. **Integration Tests**
   - PortSelector + Observability zusammen testen
   - PortSelector + Performance-Tracker zusammen testen
   - PortSelector + Observer zusammen testen
   - Vollständiger Flow: Select → Track → Emit → Observe

9. **Performance Tests**
   - Sicherstellen, dass keine Performance-Regression auftritt
   - Performance-Tracking sollte nicht langsamer sein

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt größtenteils unverändert**: `selectPortFromTokens()` bleibt erhalten
- **Event-Emission bleibt kompatibel**: Events werden weiterhin emittiert, nur über Observer
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/port-selector-srp`
2. **Neue Klassen implementieren**: Parallel zu bestehendem Code
3. **PortSelector schrittweise umbauen**: Observability → Performance → Events
4. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
5. **Code Review**: Review der Refactoring-Änderungen
6. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **PortSelectionObservability**
  - `registerWithObservabilityRegistry()` registriert korrekt
  - `setupObservability()` richtet Observability ein

- **PortSelectionPerformanceTracker**
  - `startTracking()` startet Tracking
  - `endTracking()` gibt korrekte Duration zurück
  - Edge Cases (kein Start, mehrfaches Enden)

- **PortSelector (refactored)**
  - `selectPortFromTokens()` führt Port-Auswahl durch
  - Delegiert Performance-Tracking korrekt
  - Delegiert Event-Emission korrekt über Observer

### Integration Tests

- **PortSelector + Observability**
  - Self-Registration funktioniert
  - Observability ist eingerichtet

- **PortSelector + Performance-Tracker**
  - Performance wird korrekt getrackt
  - Duration wird korrekt berechnet

- **PortSelector + Observer**
  - Events werden korrekt emittiert
  - Observer wird korrekt aufgerufen

- **Vollständiger Flow**
  - Port-Auswahl → Performance-Tracking → Event-Emission → Observability

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Minimale Breaking Changes**

- `onEvent()` bleibt erhalten (delegiert zu EventEmitter)
- Event-Struktur bleibt unverändert
- Public API bleibt kompatibel

**Mögliche Breaking Changes (zu prüfen):**

- Falls externe Code direkt auf EventEmitter zugreift (sollte nicht der Fall sein)

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **Event-Synchronisation**
   - **Risiko**: Events werden nicht korrekt emittiert über Observer
   - **Mitigation**: Umfassende Tests, Observer-Pattern korrekt implementieren

3. **Observability-Registration**
   - **Risiko**: Self-Registration funktioniert nicht korrekt
   - **Mitigation**: Integration Tests

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ PortSelector führt nur noch Port-Auswahl durch
- ✅ PortSelectionObservability verwaltet Self-Registration
- ✅ PortSelectionPerformanceTracker verwaltet Performance-Tracking
- ✅ PortSelectionObserver verwaltet Event-Emission
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll PortSelectionObservability als Singleton oder pro PortSelector-Instanz sein?
2. Wie wird Performance-Tracking mit Event-Emission synchronisiert?
3. Soll PortSelectionPerformanceTracker auch für andere Selektoren verwendet werden?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [PortSelector Source Code](../../src/infrastructure/adapters/foundry/versioning/portselector.ts)
- [PortSelectionObserver](../../src/infrastructure/adapters/foundry/versioning/port-selection-observer.ts)
- [PortSelectionEventEmitter](../../src/infrastructure/adapters/foundry/versioning/port-selection-events.ts)

---

**Letzte Aktualisierung:** 2025-12-10

