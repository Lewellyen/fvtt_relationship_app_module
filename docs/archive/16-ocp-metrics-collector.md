# OCP-Plan: MetricsCollector – dynamische Metrik-Registrierung

**Erstellungsdatum:** 2025-12-10
**Status:** Geplant
**Priorität:** Mittel
**Betroffene Datei:** `src/infrastructure/observability/metrics-collector.ts`

---

## Problem-Beschreibung
- Feste Felder für einzelne Metriken (containerResolutions, cacheHits, retries …).
- Snapshot- und Persistenzlogik hängt an konkreten Properties.
- Neue Metriken erfordern Codeänderungen quer durch Collector, Snapshotter und Persistence → OCP-Verstoß.

---

## Ziel-Architektur
- `MetricDefinition`-Registry definiert Name, Initialwert, Reducer/Aggregator und Snapshot-Serializer.
- `MetricsCollector` verwaltet eine generische Map auf Basis der Registry und kennt keine festen Properties mehr.
- Snapshot/Persistence iterieren über registrierte Definitionen und sind damit erweiterbar.

### Verantwortlichkeiten
| Komponente | Aufgabe |
| --- | --- |
| `MetricsCollector` | Nimmt Events entgegen und aktualisiert Metriken gemäß Registry. |
| `MetricDefinition` (Interface) | Beschreibt Initialwert, Reducer/Aggregator und Serialisierung. |
| `MetricDefinitionRegistry` (neu) | Liefert alle Definitionen; steuert verfügbare Metriken. |
| `MetricSnapshotSerializer` (neu/entkoppelt) | Serialisiert generische Metrikzustände für UI/Persistence. |

---

## Schritt-für-Schritt Refactoring-Plan
1. **Definitionen kapseln**
   - Interface für `MetricDefinition<T>` mit Reducer, Default-State, Serializer.
   - Registry mit Priorität/Key-Schutz, um Kollisionen zu verhindern.

2. **Collector umbauen**
   - Interne Struktur: `Map<string, MetricState>` statt fester Properties.
   - Event-Handler nutzen `MetricDefinition` (Reducer) je Key.

3. **Snapshot/Persistence anpassen**
   - Snapshotter iteriert über Registry + Map und nutzt Serializer je Definition.
   - Persistence nutzt dieselbe generische Struktur.

4. **Tests erweitern**
   - Hinzufügen neuer Metrik per Registry-Mock ohne Codeänderung verifizieren.
   - Regressionstests für bestehende Metriken (container, cache, retry etc.).

5. **Migration**
   - Bestehende Metriken als `MetricDefinition`-Einträge abbilden.
   - Deprecation: alte Properties solange parallel halten, bis Adapter umgestellt sind (falls nötig).

---

## Erfolgskriterien
- Keine hartkodierten Metrik-Properties im Collector mehr.
- Neue Metriken werden ausschließlich über Registry-Einträge ergänzt.
- Snapshot/Persistence funktionieren generisch für alle registrierten Definitionen.
- SRP-Zuschnitt aus `02-metrics-collector-srp-refactoring.md` bleibt intakt.
