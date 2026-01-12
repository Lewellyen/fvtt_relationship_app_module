# Roadmap Phasen – MVP Implementation

Dieser Ordner enthält die detaillierte Aufschlüsselung der Roadmap v2 in einzelne Phasen.

## Übersicht

Die MVP-Implementation ist in 6 Phasen unterteilt:

1. **[Phase 1 – Foundation](./phase-1-foundation.md)**: Document Types, Schemas, Parser (Domain)
2. **[Phase 2 – Infrastructure](./phase-2-infrastructure.md)**: Foundry Adapters + DI
3. **[Phase 3 – Application](./phase-3-application.md)**: UseCases + Services (autosave-ready)
4. **[Phase 4 – UI: Graph Editor](./phase-4-ui-graph-editor.md)**: Cytoscape + Dual Editor
5. **[Phase 5 – Player View + Overlay](./phase-5-player-view-overlay.md)**: MVP Collaboration
6. **[Phase 6 – MVP Hardening](./phase-6-mvp-hardening.md)**: Stabilisierung + Release

## Zwei JournalEntryPage Types

Die Implementation umfasst zwei verschiedene JournalEntryPage-Sheets:

### 1. Graph-Sheet (`relationship_app_graph`)
- Visualisierung von Beziehungsnetzwerken
- Cytoscape-Integration
- Nodes, Edges, Layout
- Vollständige Implementation in Phase 4

### 2. Node-Sheet (`relationship_app_node`)
- Datasheet für Wissensobjekte/Knoten
- Form-basierte UI
- Node-Daten (Name, Kind, Fraktion, Relation, etc.)
- Basic Implementation in Phase 4, erweiterbar in späteren Phasen

## Sheet-Registrierung

Die Registrierung beider Sheets erfolgt in **Phase 1** und basiert auf der Analyse des Vorgängerprojekts:

- **Analyse-Dokumentation**: [JournalEntryPageSheet-Registrierung Analyse](../../analysis/journal-entry-page-sheet-registration-analyse.md)
- **Implementierung**: Phase 1, Abschnitt 6 (JournalEntryPageSheet-Registrierung)

**Wichtige Komponenten:**
- Konstanten (JOURNAL_PAGE_SHEET_TYPE)
- RegistrationService (beide Sheets + Models)
- DataModel-Klassen (RelationshipGraphDataModel, RelationshipNodeDataModel)
- Sheet-Klassen (Stubs in Phase 1, vollständig in Phase 4)

## Abhängigkeiten

```
Phase 1 (Foundation)
    ↓
Phase 2 (Infrastructure)
    ↓
Phase 3 (Application)
    ↓
Phase 4 (UI)
    ↓
Phase 5 (Player View)
    ↓
Phase 6 (Hardening)
```

## Referenzen

- **Roadmap v2**: [mvp-roadmap-variante-2.md](../mvp-roadmap-variante-2.md)
- **Analyse**: [journal-entry-page-sheet-registration-analyse.md](../../analysis/journal-entry-page-sheet-registration-analyse.md)
- **Variante-Analyse**: [variante-analyse.md](../variante-analyse.md)

## Status

**Aktueller Status:** Geplant

Alle Phasen sind detailliert ausgearbeitet und bereit für die Implementation.
