# Phase 5 – Player View + Overlay (MVP Collaboration)

**Ziel:** GM kann freigeben; Spieler sehen nur Freigegebenes und können Notes ergänzen.

**Status:** Geplant
**Abhängigkeiten:** Phase 4
**Nachfolger:** Phase 6

**Basierend auf:** Finalisierte strategische Analyse
- ✅ Datenmodell: Reveal-Settings (public/hidden/gm)
- ✅ UI-Architektur: Sheets für Player View

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

**PlayerNodeOverlay:**
```typescript
interface PlayerNodeOverlay {
  nodeKey: string;
  notes?: string;
  discovered?: boolean; // optional
}
```

**Storage:** Eigenes Overlay-Document (Details siehe Task 3.2)

#### 3.2 Overlay Storage

**Optionen:**
- **A:** Pro User ein Overlay-JournalEntryPage
- **B:** Pro GraphKey ein Overlay-Document

**MVP-Entscheidung:** Pro User ein Overlay-Document (einfacher)

**Implementation:**
- Overlay-Document pro User
- Delta-Storage: Nur Notes (keine Master-Felder)

#### 3.3 Overlay UI

**Features:**
- Notes Panel im Node Inspector
- Text-Input für Notes
- Save-Button (autosave optional)
- Notes werden im Overlay-Document gespeichert

---

### 4. Merge/Projection

**Ziel:** Effective View = Master + Overlay

**Implementation:**
- Merge-Funktion: Master Data + Overlay Data
- Effective View: Master (read-only) + Overlay (Notes)
- Player sieht: Master-Daten (gefiltert) + eigene Notes

---

## Deliverables

- ✅ Filtering (Nodes, Edges, Graph)
- ✅ Player View Mode (Graph-Sheet + Node-Sheet)
- ✅ Overlay Store (Delta-Storage)
- ✅ Overlay UI (Notes Panel)
- ✅ Merge/Projection (Effective View)
- ✅ E2E Tests (GM vs Player, keine Leaks)

---

## Risiken

- **Data Leaks:** → Umfassende Tests (E2E)
- **Overlay-Storage Komplexität:** → MVP einfach (pro User)

---

## Stop / Decision Points

- ✅ Overlay Storage Form finalisiert (MVP: pro User)
- ✅ Filtering funktioniert korrekt (keine Leaks)
- ✅ E2E Tests bestanden

---

## Referenzen

- [Datenmodell & Schema-Strategie](../../analysis/data-model-schema-strategy.md)
- [UI-Architektur & Sheets](../../analysis/ui-architecture-sheets.md)
