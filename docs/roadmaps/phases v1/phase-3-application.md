# Phase 3 – Application: UseCases + Services (autosave-ready)

**Ziel:** Stabile Business-Flows (Create/Load/Save) für Node/Graph.

**Status:** Geplant
**Abhängigkeiten:** Phase 2
**Nachfolger:** Phase 4

---

## Übersicht

Diese Phase implementiert die Application-Layer-Logik mit UseCases und Services. Die Business-Flows sind autosave-ready und bilden die Grundlage für die UI-Implementierung in Phase 4.

---

## Tasks

### 1. UseCases

**Location:** `src/application/use-cases/`

#### 1.1 CreateNodePage

**Ziel:** Neue Node-Page erstellen

**Input:**
- Journal Entry ID (optional: neue Page in existierendem Journal)
- Initial Node Data (Name, Kind, etc.)

**Output:** Result<JournalEntryPage, UseCaseError>

**Steps:**
1. Journal Entry laden/validieren
2. Node Data validieren (Schema, Phase 1)
3. Page erstellen (Type: `relationship_app_node`)
4. Content setzen (JSON)
5. Marker Flag setzen
6. Page zurückgeben

**Error Cases:**
- Journal nicht gefunden
- Ungültige Node Data
- Page-Erstellung fehlgeschlagen

#### 1.2 CreateGraphPage

**Ziel:** Neue Graph-Page erstellen

**Input:**
- Journal Entry ID
- Initial Graph Data (GraphKey, leere nodeKeys/edges)

**Output:** Result<JournalEntryPage, UseCaseError>

**Steps:**
1. Journal Entry laden/validieren
2. Graph Data validieren (Schema, Phase 1)
3. Page erstellen (Type: `relationship_app_graph`)
4. Content setzen (JSON)
5. Marker Flag setzen
6. Page zurückgeben

**Error Cases:**
- Journal nicht gefunden
- Ungültige Graph Data
- Page-Erstellung fehlgeschlagen

#### 1.3 AddNodeToGraph / RemoveNodeFromGraph

**Ziel:** Node-Mitgliedschaft in Graph verwalten

**Input:**
- Graph Page ID
- Node Page ID (UUID)
- Operation: "add" | "remove"

**Output:** Result<void, UseCaseError>

**Steps (Add):**
1. Graph Page laden
2. Graph Data parsen/validieren
3. Node Page validieren (existiert, ist Node-Type)
4. NodeKey zu `nodeKeys` Array hinzufügen (wenn nicht vorhanden)
5. Graph Data speichern (Repository Adapter, Phase 2)

**Steps (Remove):**
1. Graph Page laden
2. Graph Data parsen/validieren
3. NodeKey aus `nodeKeys` Array entfernen
4. Alle Edges mit diesem NodeKey entfernen (Cleanup)
5. Graph Data speichern

**Error Cases:**
- Graph/Node Page nicht gefunden
- Node bereits/im Graph nicht vorhanden
- Ungültige Graph Data

#### 1.4 UpsertEdge / RemoveEdge

**Ziel:** Edges in Graph verwalten

**Input (UpsertEdge):**
- Graph Page ID
- Edge Data: { id, source (nodeKey), target (nodeKey), knowledge, label? }

**Output:** Result<void, UseCaseError>

**Steps (UpsertEdge):**
1. Graph Page laden
2. Graph Data parsen/validieren
3. Source/Target NodeKeys validieren (existieren im Graph)
4. Edge finden (by ID) oder erstellen
5. Edge aktualisieren/erstellen
6. Graph Data speichern

**Steps (RemoveEdge):**
1. Graph Page laden
2. Graph Data parsen/validieren
3. Edge finden (by ID)
4. Edge aus `edges` Array entfernen
5. Graph Data speichern

**Error Cases:**
- Graph Page nicht gefunden
- Source/Target NodeKeys nicht im Graph
- Edge-ID nicht gefunden (Remove)

#### 1.5 LoadNodePage / LoadGraphPage

**Ziel:** Node/Graph Page laden (für UI)

**Input:** Page ID

**Output:** Result<DomainType, UseCaseError>

**Steps:**
1. Page laden (Foundry API)
2. Type validieren (Node/Graph)
3. Content parsen (JSON → Domain Type)
4. Schema-Validierung (Phase 1)
5. Domain Type zurückgeben

**Error Cases:**
- Page nicht gefunden
- Falscher Type
- Ungültiges JSON/Schema

#### 1.6 SaveNodePage / SaveGraphPage

**Ziel:** Node/Graph Data speichern (autosave-ready)

**Input:**
- Page ID
- Domain Data (Node/Graph)

**Output:** Result<void, UseCaseError>

**Steps:**
1. Page laden
2. Type validieren
3. Domain Data validieren (Schema)
4. JSON serialisieren (Domain Type → JSON)
5. Content speichern (Repository Adapter)
6. Optional: Marker Flag aktualisieren

**Error Cases:**
- Page nicht gefunden
- Falscher Type
- Ungültige Data (Schema-Validierung)
- Save-Operation fehlgeschlagen

**Autosave-Ready:**
- Debouncing auf UI-Layer (Phase 4)
- Diese UseCase kann mehrfach schnell aufgerufen werden
- Idempotent (mehrfaches Speichern gleicher Data = safe)

---

### 2. Services

**Location:** `src/application/services/`

#### 2.1 NodeDataService

**Ziel:** Zentrale Service-Klasse für Node-Operations

**Methods:**
```typescript
class NodeDataService {
  load(pageId: string): Promise<Result<RelationshipNodeData, ServiceError>>
  save(pageId: string, data: RelationshipNodeData): Promise<Result<void, ServiceError>>
  validate(data: unknown): Result<RelationshipNodeData, ValidationError>
}
```

**Responsibilities:**
- Koordination von UseCases
- Error-Handling/Wrapping
- Optional: Caching (wenn benötigt)

**Dependencies:**
- Repository Adapter (Phase 2)
- Schema-Validator (Phase 1)
- UseCases (oben)

#### 2.2 GraphDataService

**Ziel:** Zentrale Service-Klasse für Graph-Operations

**Methods:**
```typescript
class GraphDataService {
  load(pageId: string): Promise<Result<RelationshipGraphData, ServiceError>>
  save(pageId: string, data: RelationshipGraphData): Promise<Result<void, ServiceError>>
  validate(data: unknown): Result<RelationshipGraphData, ValidationError>
  addNode(graphPageId: string, nodePageId: string): Promise<Result<void, ServiceError>>
  removeNode(graphPageId: string, nodePageId: string): Promise<Result<void, ServiceError>>
  upsertEdge(graphPageId: string, edge: EdgeData): Promise<Result<void, ServiceError>>
  removeEdge(graphPageId: string, edgeId: string): Promise<Result<void, ServiceError>>
}
```

**Responsibilities:**
- Koordination von UseCases
- Error-Handling/Wrapping
- Graph-spezifische Logik (Node-Mitgliedschaft, Edges)

**Dependencies:**
- Repository Adapter (Phase 2)
- Collection Adapter (Phase 2)
- Schema-Validator (Phase 1)
- UseCases (oben)

---

### 3. "Conflict policy" (MVP)

**Ziel:** Einfache Strategie für gleichzeitige Änderungen

**MVP-Ansatz: Last-Write-Wins**

**Implementation:**
- Keine explizite Versionskontrolle im MVP
- Optional: Warning Banner, wenn Version-Mismatch erkannt wird
  - Schema-Version check (Phase 1: `schemaVersion: 1`)
  - Wenn Page-Version ≠ erwartete Version → Warning

**Location:** In Save-UseCases / Services

**Future (Post-MVP):**
- Optimistic Locking
- Conflict Resolution UI
- Merge-Strategien

---

## Deliverables

1. ✅ UseCases:
   - CreateNodePage
   - CreateGraphPage
   - AddNodeToGraph / RemoveNodeFromGraph
   - UpsertEdge / RemoveEdge
   - LoadNodePage / LoadGraphPage
   - SaveNodePage / SaveGraphPage

2. ✅ Services:
   - NodeDataService
   - GraphDataService

3. ✅ Conflict Policy (MVP: Last-Write-Wins)

4. ✅ Stable APIs für UI Layer (Phase 4)

---

## Risiken

### Concurrent Edits

**Problem:** Mehrere Benutzer bearbeiten gleichzeitig → Konflikte

**Mitigation (MVP):**
- Last-Write-Wins (einfach, funktioniert für MVP)
- Warning bei Version-Mismatch (optional)
- Post-MVP: Optimistic Locking

### Performance bei großen Graphen

**Problem:** Graph mit vielen Nodes/Edges → langsame Save-Operationen

**Mitigation:**
- Debouncing auf UI-Layer (Phase 4)
- Diese Phase: Einfache Implementation (ausreichend für MVP)
- Post-MVP: Optimierungen (Incremental Updates, etc.)

---

## Stop / Decision Points

1. **Konfliktstrategie finalisieren:**
   - MVP: Last-Write-Wins bestätigt
   - Warning-Banner optional (nicht MVP-blocking)

2. **Stable APIs für UI Layer:**
   - UseCases getestet
   - Services getestet
   - UI kann integriert werden (Phase 4)

---

## Abhängigkeiten zu anderen Phasen

- **Phase 1:** Domain Types + Schemas werden verwendet
- **Phase 2:** Repository + Collection Adapters werden verwendet
- **Phase 4:** UI nutzt UseCases/Services
- **Phase 5:** Player View nutzt Load-UseCases (mit Filtering)

---

## Referenzen

- [Roadmap v2 - Phase 3](../../mvp-roadmap-variante-2.md#phase-3--application-usecases--services-autosave-ready)
- [Roadmap v2 - Datenmodelle](../../mvp-roadmap-variante-2.md#2-datenmodelle-mvp)
- Bestehende UseCase-Patterns in `src/application/use-cases/`
