# Phase 4 – UI: Graph Editor Window (Cytoscape) + Dual Editor

**Ziel:** Graph ist im Spiel benutzbar, editierbar, autosaved.

**Status:** Geplant
**Abhängigkeiten:** Phase 3
**Nachfolger:** Phase 5

---

## Übersicht

Diese Phase implementiert die UI-Komponenten für den Graph-Editor. Der Fokus liegt auf dem Graph-Sheet (`relationship_app_graph`), während das Node-Sheet (`relationship_app_node`) eine einfachere Form-basierte UI erhält.

**Wichtig:** Das Node-Sheet (Datasheet) wird hier nur grundlegend implementiert. Die vollständige Node-UI kann in späteren Phasen erweitert werden.

---

## Tasks

### 1. Graph Editor Window Definition + ViewModel State

**Location:** `src/application/windows/definitions/` (eventuell neue Datei)

**State-Management:**
- `graphKey` / `pageUuid`: Identifier für Graph Page
- `nodes`: Array von Node-Referenzen (nodeKeys)
- `elements`: Cytoscape Elements (nodes + edges)
- `selection`: Aktuelle Selektion (node/edge IDs)
- `dirty`: Flag für ungespeicherte Änderungen
- `isLoading`: Loading-State
- `error`: Error-State (optional)

**ViewModel:**
- State Store Integration (bestehende Window-Architektur)
- Actions für State-Updates
- Bindings zu Services (Phase 3)

---

### 2. Cytoscape Integration

**Ziel:** Graph-Visualisierung + Interaktion

#### 2.1 Render Nodes/Edges

**Implementation:**
- Cytoscape Instance erstellen/initialisieren
- Graph Data (Phase 3) → Cytoscape Elements
- Nodes: Positionen aus `layout.positions` (falls vorhanden)
- Edges: Verbindungen zwischen Nodes
- Styling: Knowledge-Level (public/hidden/secret) → Farben/Styles

**Location:** Svelte-Komponente oder Service

#### 2.2 Drag Nodes

**Implementation:**
- Cytoscape `drag` Event Handler
- Position updaten (State)
- Autosave trigger (debounced, siehe Task 3)

**Autosave:**
- `onDragEnd`: Position sofort speichern (empfohlen)
- Alternative: Continuous debounce (nicht empfohlen für MVP)

#### 2.3 Add/Remove Edge

**UI:**
- Toolbar-Button "Add Edge"
- Click auf Source-Node → Click auf Target-Node
- Edge-Dialog: Knowledge-Level + Label eingeben
- UpsertEdge UseCase aufrufen (Phase 3)

**Remove:**
- Edge selektieren → Delete-Button
- RemoveEdge UseCase aufrufen

#### 2.4 Edit Edge Knowledge + Label

**UI:**
- Edge selektieren → Inspector-Panel
- Knowledge-Level ändern (Dropdown: public/hidden/secret)
- Label ändern (Text-Input)
- UpsertEdge UseCase aufrufen (mit Änderungen)

---

### 3. Autosave (debounced)

**Ziel:** Datenverlust vermeiden, besonders bei Layout/Dragging

#### 3.1 Layout Save

**Strategy (empfohlen):** `onDragEnd` only
- Node-Drag beendet → Position sofort speichern
- Keine Debouncing nötig (User-Geste abgeschlossen)

**Alternative (optional):** Continuous debounce
- Während Drag: Debounce-Timer starten
- Nach Debounce-Delay: Speichern
- Nicht empfohlen für MVP (komplexer, weniger intuitiv)

**Implementation:**
- SaveGraphPage UseCase aufrufen (Phase 3)
- Layout-Data: `positions`, `zoom`, `pan` aus Cytoscape
- Graph Data updaten → speichern

#### 3.2 Structure Save (Edges, Node-Mitgliedschaft)

**Strategy:** Debounced
- Edge add/remove/update → Debounce-Timer
- Node add/remove → Debounce-Timer
- Nach Debounce-Delay (z.B. 500ms): SaveGraphPage UseCase

**Implementation:**
- Debounce-Utility (bestehend oder neu)
- SaveGraphPage UseCase (Phase 3)
- Error-Handling: Notification bei Save-Fehler

---

### 4. Dual Editor

**Ziel:** UI-Mode + JSON-Text-Mode (Advanced)

#### 4.1 UI Tab

**Standard-View:**
- Cytoscape-Graph (siehe Task 2)
- Toolbar (fit/center, add edge, delete)
- Inspector-Panel (Node/Edge-Details)

#### 4.2 JSON Tab (Advanced)

**Features:**
- Text-Editor für Graph Data (JSON)
- Validate-Button: Schema-Validierung (Phase 1)
- Apply-Button: JSON → Graph Data → Rerender
- Error-Display: Ungültiges JSON/Schema → Notifications

**Implementation:**
- JSON-Editor (CodeMirror oder ähnlich)
- Validate: Schema-Validator (Phase 1)
- Apply: Parse JSON → Domain Type → SaveGraphPage UseCase → Rerender

**Warning:**
- JSON-Editing kann Daten brechen → klare Error-UX
- Recovery-Guide (Phase 6)

---

### 5. Graph Sheet Implementation

**Location:** `src/infrastructure/adapters/foundry/sheets/JournalEntryPageRelationshipGraphSheet.ts`

**Basis:** Stub aus Phase 1 erweitern

**Vollständige Implementation:**

#### 5.1 Template-Parts

**EDIT_PARTS / VIEW_PARTS:**
- Handlebars-Templates für Edit/View-Mode
- Template-Pfade: `modules/fvtt_relationship_app_module/templates/journal-entry-relationship-graph-*.hbs`

**Templates:**
- Edit-Mode: Graph-Editor-Container (`#graph-editor-root`)
- View-Mode: Read-only Graph (oder ähnlich)

#### 5.2 Lifecycle-Methoden

**_onRender():**
- Graph Data laden (LoadGraphPage UseCase, Phase 3)
- Svelte-Komponente mounten (Graph-Editor)
- State initialisieren
- Cytoscape initialisieren

**_onClose():**
- Svelte-Komponente unmounten
- Cytoscape destroy
- Cleanup

**Referenz:** Analyse Abschnitt 4.6

#### 5.3 Service-Integration

**Dependencies:**
- GraphDataService (Phase 3)
- UseCases (Phase 3)
- Notification-System (bestehend)
- DI-Container (Token-Resolution)

**Pattern:**
- Service-Resolution über DI (nicht direkt im Constructor)
- Lazy-Loading wenn möglich

---

### 6. Node Sheet (Datasheet) - Basic Implementation

**Location:** `src/infrastructure/adapters/foundry/sheets/JournalEntryPageRelationshipNodeSheet.ts`

**Basis:** Stub aus Phase 1 erweitern

**MVP-Scope:** Einfache Form-basierte UI

#### 6.1 Template-Parts

**EDIT_PARTS / VIEW_PARTS:**
- Handlebars-Templates für Edit/View-Mode
- Template-Pfade: `modules/fvtt_relationship_app_module/templates/journal-entry-relationship-node-*.hbs`

**Templates:**
- Edit-Mode: Form-Container (`#node-editor-root`)
- View-Mode: Read-only Display

#### 6.2 Basic Form UI

**Fields (gemäß RelationshipNodeData Schema, Phase 1):**
- Name (Text-Input)
- Kind (Dropdown: person/place/object)
- Faction ID (Text-Input, optional)
- Relation (Dropdown: friend/enemy/neutral)
- Icon (Text-Input, optional)
- Descriptions:
  - Public (Textarea, optional)
  - Hidden (Textarea, optional)
  - GM (Textarea, optional)
- Reveal (Checkboxes):
  - Public
  - Hidden
- Effects (Textarea, optional):
  - Friend
  - Enemy
  - Neutral
- Linked Entity UUID (Text-Input, optional)

**Implementation:**
- Svelte-Komponente oder native HTML-Form
- Bindings zu NodeDataService (Phase 3)
- Autosave (debounced)

#### 6.3 Lifecycle-Methoden

**_onRender():**
- Node Data laden (LoadNodePage UseCase, Phase 3)
- Form initialisieren
- Svelte-Komponente mounten (falls verwendet)

**_onClose():**
- Svelte-Komponente unmounten (falls verwendet)
- Cleanup

---

### 7. Basic Toolbar (Graph Editor)

**Features:**
- Fit/Center: Graph zentrieren (Cytoscape `fit()`)
- Add Edge: Edge-Erstellung starten
- Delete: Selektion löschen (Node/Edge)
- Optional: Zoom-In/Out, Reset Layout

**Location:** Svelte-Komponente oder separate Toolbar-Komponente

---

## Deliverables

1. ✅ Graph Editor Window:
   - ViewModel State
   - Cytoscape Integration (Render, Drag, Edge-Operations)
   - Autosave (Layout + Structure)
   - Dual Editor (UI + JSON Tab)
   - Basic Toolbar

2. ✅ Graph Sheet:
   - Vollständige Implementation (Template-Parts, Lifecycle)
   - Service-Integration

3. ✅ Node Sheet (Basic):
   - Template-Parts
   - Basic Form UI
   - Autosave
   - Service-Integration

---

## Risiken

### Layout-Save: onDragEnd vs Continuous Debounce

**Decision Point:**
- Empfohlen: `onDragEnd` only (einfacher, intuitiver)
- Alternative: Continuous debounce (komplexer, weniger intuitiv)

**Mitigation:**
- Klare Entscheidung in Stop/Decision Point
- Tests für beide Strategien (optional)

### Cytoscape Performance bei großen Graphen

**Problem:** >100 Nodes → Performance-Probleme

**Mitigation (MVP):**
- Einfache Implementation (ausreichend für MVP)
- Post-MVP: Performance-Optimierungen (Virtualization, etc.)

### JSON-Editing kann Daten brechen

**Mitigation:**
- Schema-Validierung vor Apply
- Klare Error-UX (Notifications)
- Recovery-Guide (Phase 6)

---

## Stop / Decision Points

1. **Layout-Save Strategy:**
   - Entscheidung: `onDragEnd` only vs Continuous debounce
   - Empfohlen: `onDragEnd` only

2. **Graph Editor funktional:**
   - Cytoscape rendert korrekt
   - Drag & Drop funktioniert
   - Edge-Operations funktionieren
   - Autosave verhindert Datenverlust

3. **Node Sheet (Basic) funktional:**
   - Form lädt/speichert korrekt
   - Autosave funktioniert

---

## Abhängigkeiten zu anderen Phasen

- **Phase 1:** Sheet-Stubs werden vollständig implementiert
- **Phase 3:** UseCases/Services werden verwendet
- **Phase 5:** Player View nutzt Graph-Editor (Read-only, gefiltert)
- **Phase 6:** Recovery-Guide für JSON-Fehler

---

## Referenzen

- [Roadmap v2 - Phase 4](../../mvp-roadmap-variante-2.md#phase-4--ui-graph-editor-window-cytoscape--dual-editor)
- [Analyse: JournalEntryPageSheet-Registrierung](../../analysis/journal-entry-page-sheet-registration-analyse.md)
- Bestehende Window-Patterns in `src/application/windows/`
- Cytoscape-Dokumentation
