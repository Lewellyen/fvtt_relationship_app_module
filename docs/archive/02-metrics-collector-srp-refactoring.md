# Refactoring-Plan: MetricsCollector SRP-Verletzung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Hoch
**Betroffene Datei:** `src/infrastructure/observability/metrics-collector.ts`

---

## Problem-Beschreibung

Die `MetricsCollector`-Klasse verletzt das Single Responsibility Principle (SRP) mit 4 verschiedenen Verantwortlichkeiten:

1. **Metrics-Sammlung** (`recordResolution`, `recordPortSelection`, `recordCacheAccess`)
2. **Snapshot-Erstellung** (`getSnapshot`, Berechnung von Durchschnitten)
3. **Persistence-Management** (`getPersistenceState`, `restoreFromPersistenceState`)
4. **State-Management** (`reset`, `onStateChanged`)

**Aktuelle Architektur:**
- MetricsCollector sammelt Metrics in internen Datenstrukturen
- Berechnet Durchschnitte direkt in `getSnapshot()`
- Verwaltet Persistence-State (obwohl Persistence in `PersistentMetricsCollector` ist)
- Verwaltet State-Änderungen via `onStateChanged()`

**Problem:** Sammeln, Aggregieren und Persistieren sind unterschiedliche Verantwortlichkeiten, die getrennt werden sollten.

---

## Ziel-Architektur

### Neue Klassen-Struktur

```
MetricsCollector (nur Sammlung)
├── recordResolution()
├── recordPortSelection()
├── recordCacheAccess()
└── getRawMetrics() → RawMetrics

MetricsAggregator (nur Aggregation)
├── aggregate(metrics: RawMetrics) → MetricsSnapshot
└── calculateAverage(times: number[]) → number

MetricsPersistenceManager (nur Persistence)
├── serialize(metrics: RawMetrics) → MetricsPersistenceState
└── deserialize(state: MetricsPersistenceState) → RawMetrics

MetricsStateManager (nur State-Management)
├── reset()
└── onStateChanged(callback: () => void)
```

### Verantwortlichkeiten

| Klasse | Verantwortlichkeit | Methoden |
|--------|-------------------|----------|
| `MetricsCollector` | Nur Sammlung von Metrics | `recordResolution`, `recordPortSelection`, `recordCacheAccess`, `getRawMetrics` |
| `MetricsAggregator` | Nur Aggregation zu Snapshots | `aggregate`, `calculateAverage`, `calculateCacheHitRate` |
| `MetricsPersistenceManager` | Nur Persistence | `serialize`, `deserialize` |
| `MetricsStateManager` | Nur State-Management | `reset`, `onStateChanged`, `subscribe` |

---

## Schritt-für-Schritt Refactoring-Plan

### Phase 1: Vorbereitung (Tests & Interfaces)

1. **Tests für aktuelle Funktionalität schreiben**
   - Alle Public-Methoden von MetricsCollector testen
   - Snapshot-Berechnungen testen
   - Persistence-State testen

2. **Interfaces definieren**
   ```typescript
   interface IRawMetrics {
     containerResolutions: number;
     resolutionErrors: number;
     cacheHits: number;
     cacheMisses: number;
     portSelections: Map<number, number>;
     portSelectionFailures: Map<number, number>;
     resolutionTimes: Float64Array;
     resolutionTimesIndex: number;
     resolutionTimesCount: number;
   }

   interface IMetricsCollector {
     recordResolution(token: InjectionToken<unknown>, durationMs: number, success: boolean): void;
     recordPortSelection(version: number): void;
     recordPortSelectionFailure(version: number): void;
     recordCacheAccess(hit: boolean): void;
     getRawMetrics(): IRawMetrics;
   }

   interface IMetricsAggregator {
     aggregate(metrics: IRawMetrics): MetricsSnapshot;
     calculateAverage(times: Float64Array, count: number): number;
     calculateCacheHitRate(hits: number, misses: number): number;
   }

   interface IMetricsPersistenceManager {
     serialize(metrics: IRawMetrics): MetricsPersistenceState;
     deserialize(state: MetricsPersistenceState | null | undefined): IRawMetrics;
   }

   interface IMetricsStateManager {
     reset(): void;
     onStateChanged(callback: () => void): void;
     unsubscribe(callback: () => void): void;
   }
   ```

### Phase 2: Neue Klassen erstellen

3. **MetricsAggregator erstellen**
   - Datei: `src/infrastructure/observability/metrics-aggregator.ts`
   - Implementiert `IMetricsAggregator`
   - Enthält alle Berechnungs-Logik aus `getSnapshot()`
   - Tests schreiben

4. **MetricsPersistenceManager erstellen**
   - Datei: `src/infrastructure/observability/metrics-persistence/metrics-persistence-manager.ts`
   - Implementiert `IMetricsPersistenceManager`
   - Enthält `getPersistenceState()` und `restoreFromPersistenceState()` Logik
   - Tests schreiben

5. **MetricsStateManager erstellen**
   - Datei: `src/infrastructure/observability/metrics-state/metrics-state-manager.ts`
   - Implementiert `IMetricsStateManager`
   - Verwaltet State-Änderungen via Observer-Pattern
   - Tests schreiben

### Phase 3: MetricsCollector refactoren

6. **MetricsCollector umbauen**
   - Nur noch Sammlung von Metrics
   - `getSnapshot()` entfernen → delegiert zu `MetricsAggregator`
   - `getPersistenceState()` entfernen → delegiert zu `MetricsPersistenceManager`
   - `restoreFromPersistenceState()` entfernen → delegiert zu `MetricsPersistenceManager`
   - `reset()` delegiert zu `MetricsStateManager`
   - `onStateChanged()` delegiert zu `MetricsStateManager`

7. **Neue Methode `getRawMetrics()` hinzufügen**
   - Gibt interne Metrics-Datenstruktur zurück
   - Wird von Aggregator und Persistence-Manager verwendet

8. **Dependencies injizieren**
   - `MetricsAggregator` als Dependency
   - `MetricsPersistenceManager` als Dependency (optional)
   - `MetricsStateManager` als Dependency

### Phase 4: PersistentMetricsCollector anpassen

9. **PersistentMetricsCollector refactoren**
   - Nutzt `MetricsPersistenceManager` für Serialization/Deserialization
   - Nutzt `MetricsStateManager` für State-Änderungen
   - Abonniert State-Änderungen für Persistence

### Phase 5: Integration & Tests

10. **Integration Tests**
    - MetricsCollector + MetricsAggregator zusammen testen
    - MetricsCollector + MetricsPersistenceManager zusammen testen
    - PersistentMetricsCollector mit allen Komponenten testen

11. **Performance Tests**
    - Sicherstellen, dass keine Performance-Regression auftritt
    - Aggregation sollte nicht langsamer sein

---

## Migration-Strategie

### Backward Compatibility

- **Public API bleibt größtenteils unverändert**: `getSnapshot()` bleibt erhalten, delegiert intern
- **Neue Methoden hinzufügen**: `getRawMetrics()` für erweiterte Nutzung
- **Interne Implementierung ändert sich**: Nur interne Struktur wird refactored

### Rollout-Plan

1. **Feature Branch erstellen**: `refactor/metrics-collector-srp`
2. **Neue Klassen implementieren**: Parallel zu bestehendem Code
3. **MetricsCollector schrittweise umbauen**: Aggregator → Persistence → State
4. **PersistentMetricsCollector anpassen**: Nutzt neue Komponenten
5. **Tests durchlaufen lassen**: Alle Tests müssen grün sein
6. **Code Review**: Review der Refactoring-Änderungen
7. **Merge**: In Main-Branch mergen

---

## Tests

### Unit Tests

- **MetricsAggregator**
  - `aggregate()` mit verschiedenen Metrics
  - `calculateAverage()` mit verschiedenen Arrays
  - `calculateCacheHitRate()` mit verschiedenen Hit/Miss-Ratios
  - Edge Cases (leere Arrays, Division durch Null)

- **MetricsPersistenceManager**
  - `serialize()` mit verschiedenen Metrics
  - `deserialize()` mit verschiedenen States
  - Null/Undefined Handling
  - Invalid State Handling

- **MetricsStateManager**
  - `reset()` mit verschiedenen States
  - `onStateChanged()` mit mehreren Callbacks
  - `unsubscribe()` Funktionalität

- **MetricsCollector (refactored)**
  - Alle Recording-Methoden
  - `getRawMetrics()` gibt korrekte Daten zurück
  - `getSnapshot()` delegiert korrekt zu Aggregator

### Integration Tests

- **MetricsCollector + MetricsAggregator**
  - Vollständiger Flow: Record → Get Snapshot
  - Verschiedene Metrics-Typen

- **MetricsCollector + MetricsPersistenceManager**
  - Serialize → Deserialize → Verify

- **PersistentMetricsCollector**
  - Vollständiger Flow mit allen Komponenten
  - State-Änderungen triggern Persistence

### Regression Tests

- Alle bestehenden Tests müssen weiterhin funktionieren
- Keine Performance-Regression

---

## Breaking Changes

**Minimale Breaking Changes**

- `getSnapshot()` bleibt erhalten (delegiert intern)
- `getPersistenceState()` und `restoreFromPersistenceState()` bleiben als protected Methods (für PersistentMetricsCollector)
- Neue Public-Methode: `getRawMetrics()` für erweiterte Nutzung

**Mögliche Breaking Changes (zu prüfen):**

- Falls externe Code direkt auf interne Metrics-Struktur zugreift (sollte nicht der Fall sein)

---

## Risiken

### Technische Risiken

1. **Performance-Regression**
   - **Risiko**: Zusätzliche Delegation-Layer könnten Performance beeinträchtigen
   - **Mitigation**: Performance Tests durchführen, ggf. optimieren

2. **State-Synchronisation**
   - **Risiko**: State-Manager synchronisiert nicht korrekt mit Collector
   - **Mitigation**: Umfassende Tests, Observer-Pattern korrekt implementieren

3. **Persistence-Kompatibilität**
   - **Risiko**: Alte Persistence-States sind nicht kompatibel
   - **Mitigation**: Migration-Logik für alte States

### Projekt-Risiken

1. **Zeitaufwand**
   - **Risiko**: Refactoring dauert länger als erwartet
   - **Mitigation**: Schrittweise Vorgehen, Feature Branch

2. **Code-Review-Komplexität**
   - **Risiko**: Große PR mit vielen Änderungen
   - **Mitigation**: Kleine, inkrementelle Commits

---

## Erfolgs-Kriterien

- ✅ MetricsCollector sammelt nur noch Metrics
- ✅ MetricsAggregator aggregiert zu Snapshots
- ✅ MetricsPersistenceManager verwaltet Persistence
- ✅ MetricsStateManager verwaltet State-Änderungen
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ Keine Performance-Regression
- ✅ PersistentMetricsCollector funktioniert korrekt
- ✅ Code Review bestanden
- ✅ Dokumentation aktualisiert

---

## Offene Fragen

1. Soll MetricsStateManager als Singleton oder pro Collector-Instanz sein?
2. Wie wird State-Synchronisation zwischen Collector und State-Manager gehandhabt?
3. Soll MetricsAggregator stateless sein oder State cachen?

---

## Referenzen

- [SOLID-Analyse: SRP](../Analyse/solid-01-single-responsibility-principle.md)
- [MetricsCollector Source Code](../../src/infrastructure/observability/metrics-collector.ts)
- [PersistentMetricsCollector](../../src/infrastructure/observability/metrics-persistence/persistent-metrics-collector.ts)
- [MetricsRecorder Interface](../../src/infrastructure/observability/interfaces/metrics-recorder.ts)

---

**Letzte Aktualisierung:** 2025-12-10

