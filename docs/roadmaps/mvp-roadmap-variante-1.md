# MVP-Roadmap: Beziehungsnetzwerke - Variante 1

**Zweck:** Detaillierte Roadmap für MVP-Implementierung der Beziehungsnetzwerk-Funktionalität
**Zielgruppe:** Maintainer, Architekten, Entwickler
**Status:** Variante 1 - JournalEntryPage-basierte Speicherung
**Letzte Aktualisierung:** 2026-01-XX
**Projekt-Version:** 0.55.3 → MVP (1.0.0)

---

## Übersicht

Diese Roadmap beschreibt die schrittweise Implementierung der Kernfunktionalität **Beziehungsnetzwerke** bis zum MVP. Die Roadmap basiert auf der Entscheidung für **JournalEntryPage als Document Type** für die Speicherung von Graph-Daten.

### Entscheidungsgrundlage

**Gewählte Speicherungsstrategie:** JournalEntryPage (Document Type)
**Grundlage:** [Speicherungsstrategie-Analyse](./speicherungsstrategie-analyse.md) (Flags vs. JournalEntryPage)

**Kernargumente:**
- ✅ Hybrid-Architektur optimal unterstützt (Teilnetzwerke + globale Zusammensicht)
- ✅ Dualer Editor nativ unterstützt (UI-Editor + Text-Editor)
- ✅ Bessere UX-Integration (Graph als "Seite" im Journal)
- ✅ Keine Größenlimits
- ✅ Bereits in `module.json` vorbereitet

---

## MVP-Definition

### Scope

**Kernfunktionalität:**
- Beziehungsnetzwerke zwischen **allen Foundry-Entitäten** (Actors, Journals, Items, Scenes, etc.)
- **Hybrid-Architektur:** Teilnetzwerke (JournalEntryPage) + optionale globale Zusammensicht
- **Dualer Editor:** UI-Editor (Cytoscape.js) + Text-Editor (JSON)
- **Berechtigungen:** Alle Spieler können verwalten (mit Foundry-Berechtigungen)

**Nicht im MVP:**
- Erweiterte Filter- und Suchfunktionen
- Graph-Layout-Algorithmen (außer Basis-Layout)
- Export/Import-Funktionen
- Performance-Optimierungen für sehr große Netzwerke (>1000 Nodes)

### Erfolgskriterien

1. ✅ Benutzer können Graph-Pages in Journals erstellen
2. ✅ Beziehungen zwischen Entitäten visuell darstellen
3. ✅ Graph im UI-Editor (Cytoscape) bearbeiten
4. ✅ Graph im Text-Editor (JSON) bearbeiten
5. ✅ Globale Zusammensicht aller Teilnetzwerke
6. ✅ Berechtigungen werden korrekt geprüft

---

## Architektur-Übersicht

### Datenmodell

```
Journal
  └── JournalEntryPage (type: "relationship_app_graph")
       └── Text-Content: JSON
            └── GraphData {
                  nodes: GraphNode[],
                  edges: GraphEdge[],
                  metadata: GraphMetadata
                }
```

### Schichten-Architektur

```
Framework Layer
  └── Window Definitions (Graph Editor Window)
       └── Svelte Components (Cytoscape Integration)

Application Layer
  ├── GraphDataService (Business Logic)
  ├── GraphAggregationService (Globale Zusammensicht)
  └── Use Cases
       ├── LoadGraphPageUseCase
       ├── SaveGraphPageUseCase
       └── AggregateGraphsUseCase

Domain Layer
  ├── Entities (GraphData, GraphNode, GraphEdge, JournalEntryPage)
  └── Ports
       ├── PlatformJournalEntryPageRepository
       └── PlatformJournalEntryPageCollectionPort

Infrastructure Layer
  ├── FoundryJournalEntryPageRepositoryAdapter
  └── FoundryJournalEntryPageCollectionAdapter
```

---

## Roadmap-Phasen

## Phase 1: Foundation - Domain Models & Ports (Woche 1-2)

**Ziel:** Domain-Modelle und Port-Interfaces definieren

### Tasks

#### 1.1 Domain Entities definieren

**Dateien:**
- `src/domain/entities/journal-entry-page.ts`
- `src/domain/entities/graph-data.ts`
- `src/domain/entities/graph-node.ts`
- `src/domain/entities/graph-edge.ts`
- `src/domain/types/graph-metadata.ts`

**Entitäten:**
```typescript
// JournalEntryPage (Domain Entity)
interface JournalEntryPage {
  readonly id: string;
  readonly journalId: string;
  readonly name: string;
  readonly type: "relationship_app_graph";
  readonly text: string; // JSON-Content
}

// GraphData (Domain Entity)
interface GraphData {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  readonly metadata: GraphMetadata;
}

// GraphNode (Domain Entity)
interface GraphNode {
  readonly id: string;
  readonly entityId: string; // ID der Foundry-Entität (Actor, Journal, etc.)
  readonly entityType: EntityType; // "Actor" | "Journal" | "Item" | "Scene"
  readonly label: string;
  readonly position?: { x: number; y: number };
  readonly metadata?: Record<string, unknown>;
}

// GraphEdge (Domain Entity)
interface GraphEdge {
  readonly id: string;
  readonly sourceId: string; // Node-ID
  readonly targetId: string; // Node-ID
  readonly label?: string;
  readonly relationshipType?: string;
  readonly metadata?: Record<string, unknown>;
}

// GraphMetadata (Domain Type)
interface GraphMetadata {
  readonly version: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly authorId?: string;
}
```

**Abhängigkeiten:** Keine

**Tests:**
- Unit-Tests für alle Domain Entities
- Valibot-Schemas für Validierung

---

#### 1.2 Port-Interfaces erstellen

**Dateien:**
- `src/domain/ports/repositories/platform-journal-entry-page-repository.interface.ts`
- `src/domain/ports/collections/platform-journal-entry-page-collection-port.interface.ts`

**Ports:**
```typescript
// PlatformJournalEntryPageRepository
interface PlatformJournalEntryPageRepository
  extends PlatformEntityRepository<JournalEntryPage> {
  // Erbt: getAll, getById, create, update, delete, setFlag, getFlag, unsetFlag
}

// PlatformJournalEntryPageCollectionPort
interface PlatformJournalEntryPageCollectionPort
  extends PlatformEntityCollectionPort<JournalEntryPage> {
  // Erbt: getAll, getById, getByIds, query

  /**
   * Findet alle Graph-Pages (type: "relationship_app_graph")
   */
  findGraphPages(): Result<JournalEntryPage[], EntityCollectionError>;

  /**
   * Findet alle Graph-Pages für ein bestimmtes Journal
   */
  findGraphPagesByJournal(journalId: string): Result<JournalEntryPage[], EntityCollectionError>;
}
```

**Abhängigkeiten:** 1.1 (Domain Entities)

**Tests:**
- Interface-Definitionen (keine Implementierung notwendig)
- Type-Tests (TypeScript Compiler)

---

#### 1.3 Valibot-Schemas für Validierung

**Dateien:**
- `src/domain/validation/graph-data.schema.ts`
- `src/domain/validation/journal-entry-page.schema.ts`

**Schemas:**
- GraphData-Schema (Valibot)
- GraphNode-Schema (Valibot)
- GraphEdge-Schema (Valibot)
- JournalEntryPage-Schema (Valibot)

**Abhängigkeiten:** 1.1 (Domain Entities)

**Tests:**
- Schema-Validierungstests
- Edge-Cases (leere Arrays, null-Werte, etc.)

---

### Deliverables Phase 1

- ✅ Domain Entities definiert und getestet
- ✅ Port-Interfaces definiert
- ✅ Valibot-Schemas implementiert
- ✅ 100% Type Coverage
- ✅ Alle Tests bestehen

---

## Phase 2: Infrastructure - Foundry Adapter (Woche 2-3)

**Ziel:** Foundry-Adapter für JournalEntryPage-Operationen implementieren

### Tasks

#### 2.1 Foundry JournalEntryPage Types & Casts

**Dateien:**
- `src/infrastructure/adapters/foundry/types.ts` (erweitern)
- `src/infrastructure/adapters/foundry/runtime-casts.ts` (erweitern)

**Funktionalität:**
- Type-Definitionen für Foundry JournalEntryPage
- Runtime-Casts für JournalEntryPage
- Type-Guards für Document-Type-Prüfung

**Abhängigkeiten:** 1.1 (Domain Entities)

**Tests:**
- Runtime-Cast-Tests
- Type-Guard-Tests

---

#### 2.2 FoundryJournalEntryPageRepositoryAdapter

**Dateien:**
- `src/infrastructure/adapters/foundry/repository-adapters/foundry-journal-entry-page-repository-adapter.ts`

**Funktionalität:**
- Implementiert `PlatformJournalEntryPageRepository`
- CRUD-Operationen für JournalEntryPage
- Flag-Operationen (falls notwendig)
- JSON-Parsing/Serialisierung für Text-Content

**Abhängigkeiten:** 2.1, 1.3 (Valibot-Schemas)

**Wiederverwendung:**
- Pattern analog zu `FoundryJournalRepositoryAdapter`
- Verwendung von `FoundryDocumentPort` für CRUD
- Verwendung von `FoundryGamePort` für Journal-Zugriff

**Tests:**
- Unit-Tests für alle CRUD-Operationen
- Integration-Tests mit Foundry-Mocks
- Error-Handling-Tests

---

#### 2.3 FoundryJournalEntryPageCollectionAdapter

**Dateien:**
- `src/infrastructure/adapters/foundry/collection-adapters/foundry-journal-entry-page-collection-adapter.ts`

**Funktionalität:**
- Implementiert `PlatformJournalEntryPageCollectionPort`
- Query-Operationen für Graph-Pages
- `findGraphPages()` - Alle Graph-Pages finden
- `findGraphPagesByJournal()` - Graph-Pages eines Journals finden

**Abhängigkeiten:** 2.1, 2.2

**Tests:**
- Unit-Tests für Query-Operationen
- Integration-Tests

---

#### 2.4 DI-Registrierung

**Dateien:**
- `src/framework/config/modules/entity-ports.config.ts` (erweitern)

**Funktionalität:**
- Token-Registrierung für Repository und Collection
- Adapter-Instanziierung
- Dependency-Injection-Konfiguration

**Tokens:**
- `journalEntryPageRepositoryToken`
- `journalEntryPageCollectionPortToken`

**Abhängigkeiten:** 2.2, 2.3

**Tests:**
- DI-Container-Tests
- Token-Resolution-Tests

---

### Deliverables Phase 2

- ✅ Foundry-Adapter implementiert
- ✅ DI-Registrierung abgeschlossen
- ✅ Alle Tests bestehen (Unit + Integration)
- ✅ 100% Code Coverage

---

## Phase 3: Application Layer - Services & Use Cases (Woche 3-4)

**Ziel:** Business Logic für Graph-Verwaltung implementieren

### Tasks

#### 3.1 GraphDataService

**Dateien:**
- `src/application/services/GraphDataService.ts`

**Funktionalität:**
- Graph-Daten aus JournalEntryPage laden
- Graph-Daten in JournalEntryPage speichern
- JSON-Parsing/Serialisierung (mit Validierung)
- Graph-Daten-Validierung (Valibot)

**Abhängigkeiten:** 2.4 (DI-Tokens), 1.3 (Valibot-Schemas)

**Services:**
```typescript
class GraphDataService {
  loadGraphData(pageId: string): Result<GraphData, GraphDataError>;
  saveGraphData(pageId: string, graphData: GraphData): Promise<Result<void, GraphDataError>>;
  validateGraphData(json: string): Result<GraphData, ValidationError>;
}
```

**Tests:**
- Unit-Tests für alle Service-Methoden
- Validierungs-Tests
- Error-Handling-Tests

---

#### 3.2 GraphAggregationService

**Dateien:**
- `src/application/services/GraphAggregationService.ts`

**Funktionalität:**
- Alle Graph-Pages finden
- Graph-Daten aggregieren (globale Zusammensicht)
- Duplikat-Entfernung (gleiche Nodes in mehreren Teilnetzwerken)
- Node/Edge-Merging-Logik

**Abhängigkeiten:** 2.4 (DI-Tokens), 3.1 (GraphDataService)

**Services:**
```typescript
class GraphAggregationService {
  aggregateAllGraphs(): Promise<Result<GraphData, AggregationError>>;
  aggregateJournalGraphs(journalId: string): Promise<Result<GraphData, AggregationError>>;
  mergeGraphData(graphs: GraphData[]): Result<GraphData, AggregationError>;
}
```

**Tests:**
- Unit-Tests für Aggregation
- Merge-Logik-Tests
- Duplikat-Handling-Tests

---

#### 3.3 Use Cases

**Dateien:**
- `src/application/use-cases/load-graph-page.use-case.ts`
- `src/application/use-cases/save-graph-page.use-case.ts`
- `src/application/use-cases/aggregate-graphs.use-case.ts`

**Funktionalität:**
- Use Cases orchestrieren Services
- Error-Handling
- Logging/Notifications

**Abhängigkeiten:** 3.1, 3.2

**Tests:**
- Use-Case-Tests
- Integration-Tests (Service-Integration)

---

### Deliverables Phase 3

- ✅ Application Services implementiert
- ✅ Use Cases implementiert
- ✅ Alle Tests bestehen
- ✅ 100% Code Coverage

---

## Phase 4: UI - Graph Editor Window (Woche 4-6)

**Ziel:** Graph-Editor-Fenster mit Cytoscape-Integration

### Tasks

#### 4.1 Window Definition

**Dateien:**
- `src/application/windows/definitions/graph-editor-window.definition.ts`

**Funktionalität:**
- Window-Definition für Graph-Editor
- ViewModel-Definition (State + Actions)
- Window-Konfiguration (Title, Size, etc.)

**Abhängigkeiten:** 3.3 (Use Cases)

**State:**
```typescript
interface GraphEditorState {
  pageId: string | null;
  graphData: GraphData | null;
  isLoading: boolean;
  error: string | null;
  editorMode: "ui" | "text";
  cytoscapeInstance: CytoscapeCore | null;
}
```

**Actions:**
- `loadGraph(pageId: string)`
- `saveGraph()`
- `switchEditorMode(mode: "ui" | "text")`
- `addNode(node: GraphNode)`
- `removeNode(nodeId: string)`
- `addEdge(edge: GraphEdge)`
- `removeEdge(edgeId: string)`
- etc.

**Tests:**
- Window-Definition-Tests
- ViewModel-Tests

---

#### 4.2 Svelte Graph Editor Component (UI-Mode)

**Dateien:**
- `src/framework/ui/svelte/GraphEditorWindow.svelte`

**Funktionalität:**
- Cytoscape.js-Integration
- Graph-Visualisierung (Nodes, Edges)
- Interaktive Bearbeitung (Drag, Add, Remove)
- Toolbar für Graph-Operationen

**Abhängigkeiten:** 4.1 (Window Definition), Cytoscape.js

**Komponenten:**
- Graph-Canvas (Cytoscape)
- Node-Editor
- Edge-Editor
- Toolbar

**Tests:**
- Component-Tests (Svelte Testing Library)
- E2E-Tests (Playwright)

---

#### 4.3 Text Editor Integration

**Dateien:**
- `src/framework/ui/svelte/GraphTextEditor.svelte`

**Funktionalität:**
- JSON-Text-Editor (Textarea oder Code-Editor)
- Syntax-Highlighting (optional)
- JSON-Validierung (Live)
- Sync mit UI-Editor

**Abhängigkeiten:** 4.1 (Window Definition)

**Tests:**
- Component-Tests
- JSON-Validierung-Tests

---

#### 4.4 Window Controller Integration

**Dateien:**
- `src/application/windows/services/window-controller.ts` (erweitern)

**Funktionalität:**
- Graph-Editor-Window öffnen/schließen
- Window-State-Management
- Persistenz (Window-Position, etc.)

**Abhängigkeiten:** 4.1, Bestehende Window-Infrastruktur

**Tests:**
- Window-Controller-Tests

---

### Deliverables Phase 4

- ✅ Graph-Editor-Window implementiert
- ✅ UI-Editor (Cytoscape) funktional
- ✅ Text-Editor funktional
- ✅ Editor-Mode-Wechsel funktional
- ✅ E2E-Tests bestehen

---

## Phase 5: Integration & Global View (Woche 6-7)

**Ziel:** Globale Zusammensicht und Journal-Integration

### Tasks

#### 5.1 Global View Window

**Dateien:**
- `src/application/windows/definitions/graph-global-view-window.definition.ts`
- `src/framework/ui/svelte/GraphGlobalViewWindow.svelte`

**Funktionalität:**
- Alle Teilnetzwerke aggregieren
- Globale Graph-Visualisierung
- Read-only (keine Bearbeitung)

**Abhängigkeiten:** 3.2 (GraphAggregationService), 4.2 (Cytoscape-Komponente)

**Tests:**
- Window-Tests
- Aggregation-Tests
- E2E-Tests

---

#### 5.2 Journal-Integration

**Dateien:**
- `src/application/use-cases/create-graph-page.use-case.ts`
- Context-Menu-Integration (bereits vorhanden)

**Funktionalität:**
- "Graph-Page erstellen" im Journal-Context-Menu
- Automatische Page-Erstellung mit Template
- Graph-Page-Tab im Journal

**Abhängigkeiten:** 2.2 (Repository), Bestehende Context-Menu-Infrastruktur

**Tests:**
- Use-Case-Tests
- Integration-Tests

---

#### 5.3 Sidebar-Button / Menu-Integration

**Dateien:**
- `src/application/handlers/sidebar-button-handler.ts` (neu oder erweitern)

**Funktionalität:**
- Sidebar-Button für "Beziehungsnetzwerke"
- Menu mit Optionen:
  - "Graph-Editor öffnen"
  - "Globale Zusammensicht"
  - etc.

**Abhängigkeiten:** 4.4 (Window Controller), 5.1 (Global View)

**Tests:**
- Handler-Tests
- Integration-Tests

---

### Deliverables Phase 5

- ✅ Globale Zusammensicht implementiert
- ✅ Journal-Integration abgeschlossen
- ✅ Sidebar-Integration abgeschlossen
- ✅ Alle Tests bestehen

---

## Phase 6: Testing & Quality Assurance (Woche 7-8)

**Ziel:** Vollständige Test-Abdeckung und Qualitätssicherung

### Tasks

#### 6.1 Unit-Tests vervollständigen

**Abdeckung:**
- 100% Code Coverage für alle neuen Komponenten
- Edge-Cases abdecken
- Error-Handling-Tests

---

#### 6.2 Integration-Tests

**Dateien:**
- `src/__tests__/integration/graph-data-workflow.test.ts`
- `src/__tests__/integration/graph-aggregation-workflow.test.ts`

**Tests:**
- End-to-End-Workflows
- Service-Integration
- Repository-Integration

---

#### 6.3 E2E-Tests

**Dateien:**
- `tests/e2e/graph-editor.spec.ts`
- `tests/e2e/graph-global-view.spec.ts`

**Tests:**
- Graph-Editor öffnen/schließen
- Graph bearbeiten (UI-Mode)
- Graph bearbeiten (Text-Mode)
- Editor-Mode wechseln
- Graph speichern/laden
- Globale Zusammensicht

---

#### 6.4 Quality Gates

**Checks:**
- `npm run check:all` muss bestehen
- 100% Type Coverage
- 100% Code Coverage
- Keine Linter-Fehler
- Keine TypeScript-Fehler

---

### Deliverables Phase 6

- ✅ 100% Test-Abdeckung
- ✅ Alle Quality Gates bestehen
- ✅ E2E-Tests bestehen
- ✅ Dokumentation aktualisiert

---

## Phase 7: Dokumentation & Release-Vorbereitung (Woche 8)

**Ziel:** Dokumentation vervollständigen und MVP-Release vorbereiten

### Tasks

#### 7.1 ADR erstellen

**Dateien:**
- `docs/decisions/0013-storage-strategy-journal-entry-page.md`

**Inhalt:**
- Entscheidung für JournalEntryPage
- Begründung
- Alternativen
- Konsequenzen

---

#### 7.2 API-Dokumentation

**Dateien:**
- `docs/reference/api-reference.md` (erweitern)

**Inhalt:**
- Graph-API dokumentieren
- Use-Case-API dokumentieren
- Service-API dokumentieren

---

#### 7.3 User-Guide

**Dateien:**
- `docs/guides/graph-editor-guide.md`

**Inhalt:**
- Graph-Editor-Bedienung
- Graph-Page erstellen
- Beziehungen hinzufügen
- Globale Zusammensicht
- FAQ

---

#### 7.4 CHANGELOG & Release Notes

**Dateien:**
- `CHANGELOG.md` (erweitern)
- `docs/releases/v1.0.0-mvp.md`

**Inhalt:**
- Alle neuen Features dokumentieren
- Breaking Changes (falls vorhanden)
- Upgrade-Hinweise

---

### Deliverables Phase 7

- ✅ Dokumentation vollständig
- ✅ ADR erstellt
- ✅ Release Notes vorbereitet
- ✅ MVP bereit für Release

---

## Abhängigkeiten & Risiken

### Kritische Abhängigkeiten

1. **Foundry JournalEntryPage API**
   - Risiko: Document-Type-Handling komplex
   - Mitigation: Frühes Prototyping in Phase 2

2. **Cytoscape.js Integration**
   - Risiko: Svelte-Integration komplex
   - Mitigation: Proof-of-Concept in Phase 4

3. **Graph-Aggregation-Performance**
   - Risiko: Große Netzwerke langsam
   - Mitigation: Caching-Strategie, MVP-Limits akzeptabel

### Offene Designfragen

1. **Graph-Layout-Algorithmen**
   - Entscheidung: Basis-Layout im MVP (Cytoscape-Default)
   - Erweiterung: v2.0 (ELK.js, Custom Layouts)

2. **Berechtigungen**
   - Entscheidung: Foundry-Standard-Berechtigungen (Observer, Owner, etc.)
   - Implementierung: Über bestehende Permission-Ports

3. **Graph-Versionierung**
   - Entscheidung: Einfache Timestamps im MVP
   - Erweiterung: v2.0 (Version-History)

---

## Zeitplan (8 Wochen)

| Phase | Woche | Fokus | Deliverables |
|-------|-------|-------|--------------|
| Phase 1 | 1-2 | Domain Models & Ports | Entities, Ports, Schemas |
| Phase 2 | 2-3 | Infrastructure Adapter | Foundry-Adapter, DI |
| Phase 3 | 3-4 | Application Services | Services, Use Cases |
| Phase 4 | 4-6 | UI - Graph Editor | Window, Cytoscape, Text-Editor |
| Phase 5 | 6-7 | Integration & Global View | Global View, Journal-Integration |
| Phase 6 | 7-8 | Testing & QA | Tests, Quality Gates |
| Phase 7 | 8 | Dokumentation & Release | Docs, ADR, Release Notes |

**Gesamtaufwand:** ~8 Wochen (1 Entwickler, Vollzeit)

---

## Nächste Schritte nach MVP

### v1.1 (Post-MVP)

- Graph-Layout-Algorithmen (ELK.js)
- Erweiterte Filter- und Suchfunktionen
- Graph-Export/Import (JSON, PNG, SVG)

### v1.2

- Performance-Optimierungen (Virtualisierung, Lazy Loading)
- Graph-Versionierung (History)
- Bulk-Operationen

### v2.0

- Hybride Speicherungsstrategie (Flags + Pages für Performance)
- Erweiterte Visualisierungsoptionen
- Plugin-System für Custom-Layouts

---

## Referenzen

- [Architektur-Übersicht](../architecture/overview.md)
- [Port-Adapter-Pattern](../architecture/patterns.md#port-adapter-pattern)
- [Window-System](../architecture/layers.md#framework-layer)
- [Journal Repository (Referenz)](../reference/services.md#journal-repository)
- [Cytoscape.js Dokumentation](https://js.cytoscape.org/)
- [Foundry VTT JournalEntryPage API](https://foundryvtt.com/api/classes/client-documents.JournalEntryPage.html)

---

**Letzte Aktualisierung:** 2026-01-XX
