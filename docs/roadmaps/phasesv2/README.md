# Roadmap Phasen v2 – MVP Implementation (Finalisierte Strategie)

**Status:** Roadmap basierend auf finalisierten strategischen Entscheidungen
**Datum:** 2026-01-11
**Basis:** Strategische Gesamtanalyse (finalisiert)

---

## Übersicht

Die MVP-Implementation ist in 6 Phasen unterteilt, basierend auf der finalisierten strategischen Analyse:

1. **[Phase 1 – Foundation](./phase-1-foundation.md)**: Document Types, Schemas, Parser (Domain)
2. **[Phase 2 – Infrastructure](./phase-2-infrastructure.md)**: Foundry Adapters + DI + Port-Versioning
3. **[Phase 3 – Application](./phase-3-application.md)**: UseCases + Services + Schema-Migration
4. **[Phase 4 – UI: Graph & Node Sheets](./phase-4-ui-sheets.md)**: WindowSystemBridgeMixin + Cytoscape
5. **[Phase 5 – Player View + Overlay](./phase-5-player-view-overlay.md)**: MVP Collaboration
6. **[Phase 6 – MVP Hardening](./phase-6-mvp-hardening.md)**: Stabilisierung + Release + Public API

---

## Finalisierte Strategische Entscheidungen (Basis für Roadmaps)

### 1. Datenmodell & Schema ✅
- **Persistenz:** System-Struktur (Single Source of Truth in `JournalEntryPage.system`)
- **Schema-Versioning:** Einfaches Versions-Upgrade (sequenzielle Versionsnummern: 1, 2, 3...)
- **Graph-Erweiterbarkeit:** In system erweitern

### 2. Foundry-Integration & Kompatibilität ✅
- **Version-Support:** N-1, N, N+1 (3 Versionen)
- **Breaking Changes:** Port-Versioning (jede Version hat ihren Port)
- **Deprecation:** Sofort (N-1 nur critical updates, älter = kein Support)
- **Testing:** Vollständige Tests für jeden Port

### 3. UI-Architektur & Sheets ✅
- **Graph-Sheet:** JournalEntryPageSheet mit Cytoscape-Integration (WindowSystemBridgeMixin)
- **Node-Sheet:** JournalEntryPageSheet für Node-Editing (WindowSystemBridgeMixin)
- **UI-Erweiterbarkeit:** Registry-Methoden in API (Service-Override für API-Exposed Services)

### 4. Erweiterbarkeit ✅
- **Extension-Points:** Automatisch verfügbar, sobald Services in der API exposed sind
- **Public API:** Stable (Semantic Versioning)
- **Registry-Methoden:** `registerServiceOverride` / `registerServiceExtension` in API

### 5. Performance ✅
- **Cytoscape-Optimierungen:** Canvas-Renderer + LOD + Filtering (optional)
- **Memory-Management:** Adaptive (LRU-basiert)
- **Performance-Ziele:** Initial Load (< 200ms/500ms/1000ms), FPS (≥60/≥30/≥20)

### 6. Migration & Kompatibilität ✅
- **Schema-Migration:** Hybrid (Automatisch + Backup)
- **Backup-Strategie:** system.lastVersion beibehalten
- **Rollback-Mechanismus:** Bei fehlgeschlagener Migration - Daten wiederherstellen, Fehlermeldung, Modulladen abbrechen (Graceful Degradation)

---

## Zwei JournalEntryPage Types

Die Implementation umfasst zwei verschiedene JournalEntryPage-Sheets:

### 1. Graph-Sheet (`relationship_app_graph`)
- Visualisierung von Beziehungsnetzwerken
- Cytoscape-Integration über WindowSystemBridgeMixin
- Nodes, Edges, Layout
- Vollständige Implementation in Phase 4

### 2. Node-Sheet (`relationship_app_node`)
- Datasheet für Wissensobjekte/Knoten
- Form-basierte UI über WindowSystemBridgeMixin
- Node-Daten (Name, Kind, Fraktion, Relation, etc.)
- Vollständige Implementation in Phase 4

---

## Sheet-Architektur (WindowSystemBridgeMixin)

Beide Sheets nutzen das **WindowSystemBridgeMixin** Pattern:

- Sheets erben von `JournalEntryPageHandlebarsSheet`
- Bridge-Mixin erweitert Sheets mit:
  - DI-Service-Zugriff über Public API (`game.modules.get(MODULE_ID).api`)
  - Window-System-Features (Window-Controller, Svelte-Rendering)
  - Scope-Management für DI-Services
- SOLID-konform: Komposition statt Integration
- Foundry-kompatibel: Sheets werden von Foundry instanziiert und verwaltet

**Referenz:** [UI-Architektur Analyse](../../analysis/ui-architecture-sheets.md)

---

## Abhängigkeiten

```
Phase 1 (Foundation)
    ↓
Phase 2 (Infrastructure + Port-Versioning)
    ↓
Phase 3 (Application + Schema-Migration)
    ↓
Phase 4 (UI: Sheets + Cytoscape)
    ↓
Phase 5 (Player View + Overlay)
    ↓
Phase 6 (Hardening + Public API)
```

---

## Unterschiede zu Phases v1

**Wichtige Änderungen basierend auf finalisierter Strategie:**

1. **Foundry-Integration:** Port-Versioning-Strategie in Phase 2 integriert
2. **UI-Architektur:** WindowSystemBridgeMixin-Pattern in Phase 4
3. **Migration:** Schema-Migration-Strategie in Phase 3 integriert
4. **Public API:** Initiale Public API in Phase 6 (MVP-ready)
5. **Performance:** Performance-Ziele als Anforderungen definiert
6. **Rollback:** Rollback-Mechanismus in Phase 3 (Migration) integriert

---

## Referenzen

### Strategische Analysen
- [Strategische Gesamtanalyse - Gesamtkonzept](../../analysis/strategische-gesamtanalyse-gesamtkonzept.md)
- [Datenmodell & Schema-Strategie](../../analysis/data-model-schema-strategy.md)
- [Foundry-Integration & Kompatibilität](../../analysis/foundry-integration-compatibility.md)
- [UI-Architektur & Sheets](../../analysis/ui-architecture-sheets.md)
- [Erweiterbarkeits-Strategie](../../analysis/extensibility-strategy.md)
- [Performance- & Skalierungs-Strategie](../../analysis/performance-scalability-strategy.md)
- [Migration- & Kompatibilitäts-Strategie](../../analysis/migration-compatibility-strategy.md)

### Roadmaps
- [MVP-Roadmap Variante 2](../mvp-roadmap-variante-2.md)
- [Phases v1 README](../phases%20v1/README.md)

---

## Status

**Aktueller Status:** Basierend auf finalisierten strategischen Entscheidungen

Alle strategischen Entscheidungen sind getroffen und dokumentiert. Die Roadmaps in diesem Ordner spiegeln die finalisierte Strategie wider.
