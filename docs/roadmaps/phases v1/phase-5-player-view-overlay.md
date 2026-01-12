# Phase 5 – Player View + Overlay (MVP Collaboration)

**Ziel:** GM kann freigeben; Spieler sehen nur Freigegebenes und können Notes ergänzen.

**Status:** Geplant
**Abhängigkeiten:** Phase 4
**Nachfolger:** Phase 6

---

## Übersicht

Diese Phase implementiert die Player-View-Funktionalität mit Filtering und Overlay-System. Spieler sehen nur freigegebenes Wissen (Nodes: `reveal.public/reveal.hidden`, Edges: Knowledge-Level) und können eigene Notes als Overlay speichern.

---

## Tasks

### 1. Filtering

**Ziel:** Nodes und Edges nach Freigabe filtern

#### 1.1 Node Filtering

**Kriterien (gemäß RelationshipNodeData Schema, Phase 1):**
- `reveal.public: true` → Spieler können sehen
- `reveal.hidden: true` → Spieler können sehen (wenn Knowledge-Level erreicht)
- `reveal.gm`: Immer nur für GM (implizit)

**Implementation:**
- Filter-Funktion in Service/UseCase
- Input: Node Data, User Permission Level
- Output: Filtered Node Data (oder null, wenn nicht sichtbar)

**Location:** `src/application/services/` oder `src/application/use-cases/`

#### 1.2 Edge Filtering

**Kriterien (gemäß RelationshipGraphData Schema, Phase 1):**
- `knowledge: "public"` → Alle Spieler können sehen
- `knowledge: "hidden"` → Spieler mit entsprechendem Level können sehen
- `knowledge: "secret"` → Nur GM kann sehen

**Implementation:**
- Filter-Funktion in Service/UseCase
- Input: Edge Data, User Permission Level
- Output: Filtered Edge Data (oder null, wenn nicht sichtbar)

**Location:** `src/application/services/` oder `src/application/use-cases/`

#### 1.3 Graph Filtering

**Zusammensetzung:**
- Nodes filtern (Task 1.1)
- Edges filtern (Task 1.2)
- Nodes ohne sichtbare Edges optional ausblenden (oder grau darstellen)

**Implementation:**
- Graph Data (Phase 3) → Filtered Graph Data
- Service/UseCase: `filterGraphForPlayer(graphData, userId)`

---

### 2. Player View Mode

**Ziel:** Read-only Master Data für Spieler

#### 2.1 Graph Sheet - Player View

**Features:**
- Graph Editor (Phase 4) → Read-only Mode
- Cytoscape: Interactions deaktiviert (kein Drag, kein Add/Remove Edge)
- Toolbar: Nur View-Buttons (Fit/Center), keine Edit-Buttons
- Inspector: Read-only Display (keine Edits)

**Implementation:**
- ViewMode-Flag in ViewModel State
- Cytoscape: `autounselectify`, `boxSelectionEnabled: false`, etc.
- UI: Edit-Buttons ausblenden/disable

#### 2.2 Node Sheet - Player View

**Features:**
- Form (Phase 4) → Read-only Display
- Fields: Nur anzeigen, keine Eingabe
- Optional: Public/Hidden Descriptions je nach Freigabe

**Implementation:**
- ViewMode-Flag in ViewModel State
- Form-Fields: `readonly` oder `disabled`
- Conditional Rendering: Nur sichtbare Descriptions anzeigen

---

### 3. Overlay Store (Delta)

**Ziel:** Player-spezifische Ergänzungen (Notes) speichern

#### 3.1 Overlay Data Model

**Gemäß Roadmap v2, Abschnitt 2.3:**

```typescript
interface PlayerNodeOverlay {
  nodeKey: string;
  notes?: string;
  discovered?: boolean; // Optional für später
}
```

**Storage Format:**
- Pro User: Overlay-Document (Details siehe Task 3.3)

#### 3.2 Overlay Repository/Service

**Location:** `src/infrastructure/adapters/foundry/` oder `src/application/services/`

**Operations:**
```typescript
interface OverlayService {
  getOverlay(userId: string, nodeKey: string): Promise<Result<PlayerNodeOverlay | null, Error>>
  setOverlay(userId: string, overlay: PlayerNodeOverlay): Promise<Result<void, Error>>
  getAllOverlays(userId: string): Promise<Result<PlayerNodeOverlay[], Error>>
}
```

**Storage:**
- Option A: Pro User ein Overlay-JournalEntryPage
- Option B: Pro graphKey ein Overlay-Document (später)
- **MVP:** Option A (einfacher)

#### 3.3 Overlay Storage Form (Decision Point)

**Option A: Pro User ein Overlay-JournalEntryPage (empfohlen für MVP)**

**Structure:**
- Journal Entry: `"[User Name] - Relationship Overlays"`
- Page Content: JSON Array von `PlayerNodeOverlay`
- Flag: `hasRelationshipOverlays: true`

**Pros:**
- Einfach zu implementieren
- Ein Document pro User
- Leicht zu finden/query

**Cons:**
- Alle Overlays in einem Document (kann groß werden)

**Option B: Pro graphKey ein Overlay-Document (später)**

**Structure:**
- Journal Entry pro Graph
- Page Content: JSON mit User-Overlays

**Pros:**
- Granulare Storage
- Skaliert besser

**Cons:**
- Komplexer (mehr Documents)
- Query schwieriger

**Decision:** Option A für MVP, Option B später möglich

---

### 4. Merge/Projection

**Ziel:** Effective View = Master + Overlay (Notes)

#### 4.1 Merge Logic

**Service/UseCase:** `getEffectiveNodeData(nodeKey, userId)`

**Steps:**
1. Master Node Data laden (LoadNodePage UseCase, Phase 3)
2. Filtering anwenden (Task 1.1) → Filtered Master
3. Overlay laden (OverlayService, Task 3.2)
4. Merge: Master + Overlay (Notes ergänzen)
5. Effective Data zurückgeben

**Output:**
```typescript
interface EffectiveNodeData {
  // Master Data (filtered)
  ...RelationshipNodeData,
  // Overlay
  playerNotes?: string;
}
```

#### 4.2 UI Integration

**Graph Sheet:**
- Node Inspector zeigt Effective Data
- Notes-Panel: Overlay-Notes anzeigen/editieren
- Save-Button: Overlay speichern (nur Notes, keine Master-Änderungen)

**Node Sheet:**
- Effective Data anzeigen (Master + Overlay)
- Notes-Panel: Overlay-Notes anzeigen/editieren
- Save-Button: Overlay speichern

---

### 5. UI: Notes Panel

**Location:** Svelte-Komponente

**Features:**
- Textarea für Notes
- Save-Button: Overlay speichern
- Load: Notes aus Overlay laden
- Optional: Auto-save (debounced)

**Integration:**
- Node Inspector (Graph Sheet)
- Node Sheet (eigene Section)

---

## Deliverables

1. ✅ Filtering:
   - Node Filtering (reveal.public/reveal.hidden)
   - Edge Filtering (knowledge level)
   - Graph Filtering (komplett)

2. ✅ Player View Mode:
   - Graph Sheet (Read-only)
   - Node Sheet (Read-only)

3. ✅ Overlay Store:
   - Overlay Data Model
   - Overlay Repository/Service
   - Storage Form (Option A: Pro User ein Document)

4. ✅ Merge/Projection:
   - Merge Logic (Master + Overlay)
   - UI Integration (Notes Panel)

5. ✅ Keine Leaks: E2E Tests (GM vs Player)

---

## Risiken

### Overlay Storage Form

**Decision Point:**
- Option A (Pro User ein Document) vs Option B (Pro graphKey)
- **Empfohlen für MVP:** Option A (einfacher)

**Mitigation:**
- Klare Entscheidung in Stop/Decision Point
- Option B später möglich (Migration möglich)

### Data Leaks (GM-Only Data sichtbar für Spieler)

**Problem:** Fehlerhafte Filterung → GM-Only Data sichtbar

**Mitigation:**
- Robuste Filtering-Logik (Tests!)
- E2E Tests: GM vs Player (Task 5)
- Code-Review für Filtering-Logic

---

## Stop / Decision Points

1. **Overlay Storage Form:**
   - Entscheidung: Option A (Pro User) vs Option B (Pro graphKey)
   - **Empfohlen:** Option A für MVP

2. **E2E Tests erfolgreich:**
   - GM kann alle Data sehen/editieren
   - Player sieht nur Freigegebenes
   - Player kann Notes speichern
   - Keine Data Leaks

---

## Abhängigkeiten zu anderen Phasen

- **Phase 1:** Schema (reveal, knowledge) wird verwendet
- **Phase 3:** Load-UseCases werden verwendet (mit Filtering)
- **Phase 4:** Graph/Node Sheets werden erweitert (Player View, Notes Panel)
- **Phase 6:** E2E Tests werden erweitert

---

## Referenzen

- [Roadmap v2 - Phase 5](../../mvp-roadmap-variante-2.md#phase-5--player-view--overlay-mvp-collaboration)
- [Roadmap v2 - Datenmodelle (Overlay)](../../mvp-roadmap-variante-2.md#23-overlay-mvp)
- [Roadmap v2 - Sichtbarkeit & Kollaboration](../../mvp-roadmap-variante-2.md#03-sichtbarkeit--kollaboration-a-jetzt-b-später)
