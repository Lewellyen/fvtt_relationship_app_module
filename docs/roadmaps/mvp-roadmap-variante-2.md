# Roadmap v2 – Beziehungsnetzwerke (MVP → 1.0.0)

**Status:** Roadmap v2 (aus Lastenheft v1 + Diskussionsstand)
**Stand:** 2026-01-11
**Zielversion:** 0.55.3 → MVP (1.0.0)
**Foundry:** v13

---

## 0. Leitentscheidungen (fix)

### 0.1 Datenhaltung
- **Source of Truth:** JournalEntryPages mit **reinem JSON** im Page-Content (Text/Markdown).
- **Hybrid-Persistenz:** Flags zunächst nur als Marker („enthält Graphdaten / Node-Daten“), kein Index im MVP.
- **Keys:** **Foundry-UUID** (Page.uuid) als stabiler Key (MVP).
  (Import/Export/Compendium später → ggf. zusätzliche Stable-IDs später.)

### 0.2 Zwei JournalEntryPage Types (sehr wichtig)
- `relationship_app_node` → Knoten/Wissensobjekt (Lastenheft-Tabellenmodell)
- `relationship_app_graph` → Graph (Mitgliedschaft/Edges/Layout)

> `relationship_app_graph` ist bereits in `module.json` als JournalEntryPage DocumentType hinterlegt; `relationship_app_node` wird ergänzt. (Siehe Phase 1.)

### 0.3 Sichtbarkeit & Kollaboration (A jetzt, B später)
**A (MVP): Overlay**
- GM pflegt Master (Nodes/Graphs).
- Spieler erhalten Read View (gefiltert) + können **eigene Ergänzungen** als Overlay speichern (Notes, optional Discovery).
- Overlay speichert nur Deltas, keine Master-Felder.

**B (Post-MVP): Clone-Projektion**
- Optional: pro Spieler ein „Clone Journal“ als materialisierte Projektion (Master + Overlay).
- Keine Änderung am Kernmodell: Clone ist Output/Sync-Layer.

---

## 1. MVP-Definition (Scope)

### Enthalten (MVP)
1) JournalEntryPage-Typen: Node + Graph
2) Node-Datenmodell nach Lastenheft:
   - Art / Fraktion / Verhältnis
   - Beschreibungen: Public / Hidden / GM
   - Freigabe (public/hidden)
   - optional Icon
   - optional linkEntityUuid (Foundry UUID/Document UUID)
3) Graph-Datenmodell:
   - Node-Mitgliedschaft (nodeKeys)
   - Edges mit Knowledge-Level (public/hidden/secret)
   - Layout (Cytoscape Positions / Zoom / Pan – minimal)
4) UI:
   - Graph Window (Cytoscape) inkl. Editing (Nodes referenzieren, Edges anlegen/entfernen)
   - Dual Editor: UI-Mode + JSON-Text-Mode (Advanced)
5) **Autosave** (debounced; besonders für Layout/Dragging)
6) Player View:
   - harte Filterung nach Freigaben + Knowledge-Level
   - Read-only (Master), Overlay-edit nur in erlaubten Bereichen (z. B. Notes)

### Nicht im MVP
- Karten-Pins / Scene-Integration
- Fraktions-Editor (CRUD UI)
- Auswirkungs-Automation (Economy etc.)
- Global Aggregation (weltweite Zusammensicht)
- Import/Export (JSON, Packs)
- Performance-Optimierungen für Riesengraphen (>1000 nodes)

---

## 2. Datenmodelle (MVP)

### 2.1 RelationshipNodeData (Page type: relationship_app_node)
Minimal:
- `schemaVersion: 1`
- `nodeKey: string` (Foundry Page.uuid)
- `name: string`
- `kind: "person" | "place" | "object"`
- `factionId?: string`
- `relation: "friend" | "enemy" | "neutral"`
- `icon?: string`
- `descriptions: { public?: string; hidden?: string; gm?: string }`
- `reveal: { public: boolean; hidden: boolean }` (gm implizit)
- `effects?: { friend?: string; enemy?: string; neutral?: string }`
- `linkedEntityUuid?: string`

### 2.2 RelationshipGraphData (Page type: relationship_app_graph)
Minimal:
- `schemaVersion: 1`
- `graphKey: string` (Foundry Page.uuid)
- `nodeKeys: string[]`
- `edges: Array<{ id: string; source: string; target: string; knowledge: "public"|"hidden"|"secret"; label?: string }>`
- `layout?: { positions?: Record<string,{x:number;y:number}>; zoom?: number; pan?: {x:number;y:number} }`

### 2.3 Overlay (MVP)
Player-spezifisch, Delta-only:
- `PlayerNodeOverlay`:
  - `nodeKey: string`
  - `notes?: string`
  - optional `discovered?: boolean`
- Storage: eigenes Overlay-Document (Details in Phase 5).

---

## 3. Roadmap-Phasen

## Phase 1 – Foundation: Document Types, Schemas, Parser (Domain)
**Ziel:** Zwei Page Types sind registriert und validierbar. JSON Load/Save steht.

**Tasks**
1) `module.json` erweitern: `JournalEntryPage.documentTypes` um `relationship_app_node`.
2) i18n Labels für beide Types.
3) Domain Types + Valibot Schemas:
   - RelationshipNodeData
   - RelationshipGraphData
4) JSON Parser/Serializer Utilities (Result-Pattern):
   - invalid JSON → Error/Notification, kein Crash
5) Marker Flags (best effort):
   - am JournalEntry / Page: `hasRelationshipNode/Graph` bzw. `isRelationshipNode/Graph`

**Deliverables**
- Type-Registrierung + Schemas + Tests (valid/invalid)

**Risiken**
- JSON-Text-Editing kann Daten brechen → klare Error-UX

**Stop / Decision**
- Schema-Felder final check (MVP minimal; spätere Erweiterungen über schemaVersion)

---

## Phase 2 – Infrastructure: Foundry Adapters + DI
**Ziel:** Pages lassen sich sauber finden, laden, speichern (ohne UI).

**Tasks**
1) Foundry Runtime Casts / Type Guards für JournalEntryPage Types
2) Repository Adapter:
   - get/update Page content (JSON)
   - marker flags setzen/lesen
3) Collection Adapter:
   - findPagesByType(node/graph)
   - findByJournalEntry(journalId)
4) DI Registration (Tokens)

**Deliverables**
- Adapter + Unit/Integration Tests

**Risiken**
- Query-Performance → MVP ok, Index später optional

**Stop / Decision**
- Minimal API für UseCases festlegen

---

## Phase 3 – Application: UseCases + Services (autosave-ready)
**Ziel:** stabile Business-Flows (Create/Load/Save) für Node/Graph.

**Tasks**
1) UseCases:
   - CreateNodePage
   - CreateGraphPage
   - AddNodeToGraph / RemoveNodeFromGraph
   - UpsertEdge / RemoveEdge
2) Services:
   - NodeDataService (load/save/validate)
   - GraphDataService (load/save/validate)
3) “Conflict policy” (MVP):
   - Last-write-wins + Warning Banner, wenn version mismatch erkannt wird (optional)

**Deliverables**
- Stable APIs für UI Layer

**Stop / Decision**
- Konfliktstrategie finalisieren (MVP: einfach)

---

## Phase 4 – UI: Graph Editor Window (Cytoscape) + Dual Editor
**Ziel:** Graph ist im Spiel benutzbar, editierbar, autosaved.

**Tasks**
1) Window Definition + ViewModel State:
   - graphKey/pageUuid, nodes/elements, selection, dirty
2) Cytoscape Integration:
   - render nodes/edges
   - drag nodes
   - add/remove edge
   - edit edge knowledge + label
3) Autosave (debounced):
   - Layout speichern: on dragend + debounce
   - Struktur speichern: debounce
4) Dual Editor:
   - UI Tab
   - JSON Tab (Advanced): validate + apply → rerender

**Deliverables**
- Editing + Autosave zuverlässig
- Basic toolbar (fit/center, add edge, delete)

**Stop / Decision**
- Layout-Save: on dragend-only vs continuous debounce (empfohlen: dragend)

---

## Phase 5 – Player View + Overlay (MVP Collaboration)
**Ziel:** SL kann freigeben; Spieler sehen nur Freigegebenes und können Notes ergänzen.

**Tasks**
1) Filtering:
   - Nodes: reveal.public/reveal.hidden
   - Edges: knowledge threshold
2) Player View Mode:
   - read-only master data
3) Overlay Store (Delta):
   - per user: Notes pro nodeKey
   - UI: Notes Panel im Node Inspector
4) Merge/Projection:
   - effective view = master + overlay (notes)

**Deliverables**
- Keine Leaks: E2E Tests (GM vs Player)

**Stop / Decision**
- Overlay Storage Form:
  - a) pro user ein Overlay-JournalEntryPage
  - b) pro graphKey ein Overlay-Document

---

## Phase 6 – MVP Hardening
**Ziel:** Stabil, testbar, releasefähig.

**Tasks**
- E2E: create node/graph, set reveal, player sees filtered, overlay notes persist
- Regression: invalid JSON handling
- Docs: Quick Start + Recovery Guide (JSON)

---

## 4. Post-MVP (v1.1+)

### 4.1 Global View / Aggregation
- Aggregation Service, dedupe by nodeKey

### 4.2 Clone-Projektion (B)
- Materializer: generate/update player journals from effective projection
- Sync policy: master-owned fields overwrite, player-owned fields preserved

### 4.3 Karten-Pins / Scene Integration
- Pin nodeKey to scene coordinates

### 4.4 Fraktions-Editor
- Faction CRUD + color/style mapping

---

## 5. Definition of Done (MVP)
- GM kann Node-Pages erstellen und pflegen (public/hidden/gm)
- GM kann Graph-Pages erstellen, Nodes referenzieren, Edges pflegen (knowledge)
- Cytoscape Editor funktioniert + Autosave verhindert Datenverlust
- Spieler sehen nur freigegebenes Wissen + können Notes als Overlay speichern
- Tests: core flows + leak prevention
