# Phase 4 – UI: Graph & Node Sheets (WindowSystemBridgeMixin + Cytoscape)

**Ziel:** Graph- und Node-Sheets sind benutzbar, editierbar, autosaved. WindowSystemBridgeMixin-Architektur implementiert.

**Status:** Geplant
**Abhängigkeiten:** Phase 3
**Nachfolger:** Phase 5

**Basierend auf:** Finalisierte strategische Analyse
- ✅ UI-Architektur: WindowSystemBridgeMixin für beide Sheets
- ✅ Performance: Canvas-Renderer + LOD (Performance-Ziele definiert)

---

## Übersicht

Diese Phase implementiert beide JournalEntryPageSheets:
- **Graph-Sheet** (`relationship_app_graph`): Cytoscape-Integration für Graph-Visualisierung
- **Node-Sheet** (`relationship_app_node`): Form-basierte UI für Node-Daten

**Kernentscheidungen (finalisiert):**
- **Sheet-Architektur:** WindowSystemBridgeMixin erweitert JournalEntryPageHandlebarsSheet
- **DI-Service-Zugriff:** Über Public API (`game.modules.get(MODULE_ID).api`)
- **Cytoscape-Integration:** Canvas-Renderer + LOD (Standard)
- **Performance-Ziele:** Initial Load (< 200ms/500ms/1000ms), FPS (≥60/≥30/≥20)

---

## Tasks

### 1. WindowSystemBridgeMixin implementieren

**Ziel:** Bridge-Mixin für Sheet-Erweiterung mit Window-System + DI-Services

**Strategische Entscheidung:** WindowSystemBridgeMixin erweitert Sheets mit Window-System + DI

**Location:** `src/framework/ui/window-system/WindowSystemBridgeMixin.ts`

**Implementation:**
```typescript
function WindowSystemBridgeMixin<T extends typeof JournalEntryPageHandlebarsSheet>(
  BaseSheet: T,
  windowDefinition: WindowDefinition,
  moduleId: string = MODULE_METADATA.ID
) {
  return class extends BaseSheet {
    // DI-Service-Zugriff über Public API (wie externe Komponenten)
    private get api(): ModuleApi {
      const mod = game.modules.get(moduleId);
      if (!mod?.api) throw new Error(`Module API not available: ${moduleId}`);
      return mod.api;
    }

    // Helper: Service über Public API auflösen (exception-based)
    private resolveService<TService>(token: ApiSafeToken<TService>): TService {
      return this.api.resolve(token); // Public API resolve() - type-safe über ApiSafeToken
    }

    // Alternative: Result-Pattern für explizite Fehlerbehandlung
    private resolveServiceWithError<TService>(
      token: ApiSafeToken<TService>
    ): Result<TService, ContainerError> {
      return this.api.resolveWithError(token); // Public API resolveWithError() - Result-Pattern
    }

    // Window-System-Features (Window-Controller, Svelte-Rendering)
    // Scope-Management für DI-Services
    // Lifecycle-Integration
  };
}
```

**Features:**
- DI-Service-Zugriff über Public API (wie externe Komponenten)
- Window-System-Integration (Window-Controller, Svelte-Rendering)
- Scope-Management für DI-Services
- Lifecycle-Integration (Foundry Sheet-Lifecycle)

**Referenz:** [UI-Architektur Analyse](../../analysis/ui-architecture-sheets.md)

---

### 2. Graph-Sheet implementieren (Cytoscape-Integration)

**Ziel:** Graph-Sheet mit Cytoscape-Visualisierung

#### 2.1 Graph-Sheet-Klasse erweitern

**Location:** `src/infrastructure/adapters/foundry/sheets/RelationshipGraphSheet.ts`

**Implementation:**
- WindowSystemBridgeMixin anwenden
- Sheet erweitert `JournalEntryPageHandlebarsSheet`
- Bridge-Mixin fügt Window-System + DI hinzu

#### 2.2 Cytoscape-Integration

**Performance-Strategie:** Canvas-Renderer + LOD (Standard)

**Configuration:**
```typescript
const cy = cytoscape({
  container: element,
  // renderer wird weggelassen → Canvas (Standard)
  // LOD funktioniert automatisch mit Canvas-Renderer
  elements: graphElements,
  style: graphStyle,
});
```

**Performance-Ziele:**
- Initial Load: < 1000ms (≤1000 Nodes)
- Interaktivitäts-FPS: ≥20 FPS (≤1000 Nodes, mit LOD)

**Features:**
- Nodes/Edges rendern
- Drag Nodes (Layout speichern)
- Add/Remove Edges
- Edit Edge (Knowledge-Level, Label)
- Zoom/Pan (Layout speichern)

#### 2.3 Autosave (debounced)

**Strategy:**
- **Layout Save:** `onDragEnd` (sofort speichern)
- **Structure Save:** Debounced (500ms nach Edge/Node-Änderungen)

**Implementation:**
- SaveGraphPage UseCase (Phase 3)
- Layout-Data: `positions`, `zoom`, `pan` aus Cytoscape
- Error-Handling: Notification bei Save-Fehler

#### 2.4 Dual Editor (UI Tab + JSON Tab)

**UI Tab:**
- Cytoscape-Graph
- Toolbar (fit/center, add edge, delete)
- Inspector-Panel (Node/Edge-Details)

**JSON Tab (Advanced):**
- Text-Editor für Graph Data (JSON)
- Validate-Button: Schema-Validierung
- Apply-Button: JSON → Graph Data → Rerender
- Error-Display: Ungültiges JSON/Schema → Notifications

---

### 3. Node-Sheet implementieren (Form-UI)

**Ziel:** Node-Sheet mit Form-basierter UI

#### 3.1 Node-Sheet-Klasse erweitern

**Location:** `src/infrastructure/adapters/foundry/sheets/RelationshipNodeSheet.ts`

**Implementation:**
- WindowSystemBridgeMixin anwenden
- Sheet erweitert `JournalEntryPageHandlebarsSheet`
- Bridge-Mixin fügt Window-System + DI hinzu

#### 3.2 Form-UI

**Features:**
- Node-Daten anzeigen/bearbeiten (Name, Kind, Fraktion, Relation, etc.)
- Descriptions (Public/Hidden/GM)
- Reveal-Settings (Public/Hidden)
- Effects (optional)
- Linked Entity UUID
- Extension Properties (optional, für User-defined Fields)

**Implementation:**
- Svelte-Komponenten (über Window-System)
- Form-Validation (Schema-Validierung)
- Save-Button + Autosave (optional)

---

### 4. Window-System-Integration

**Ziel:** Window-System für beide Sheets nutzen

**Features:**
- Window-Controller-Integration
- Svelte-Rendering (für Form-UI und Graph-UI-Komponenten)
- Scope-Management für DI-Services
- Lifecycle-Integration

**Location:** Window-System ist bereits vorhanden, wird durch Bridge-Mixin integriert

---

## Deliverables

- ✅ WindowSystemBridgeMixin implementiert
- ✅ Graph-Sheet implementiert (Cytoscape-Integration, Canvas-Renderer + LOD)
- ✅ Node-Sheet implementiert (Form-UI)
- ✅ Autosave (Layout + Structure)
- ✅ Dual Editor (UI Tab + JSON Tab)
- ✅ Performance-Ziele eingehalten (Initial Load, FPS)
- ✅ Unit/Integration Tests

---

## Risiken

- **WindowSystemBridgeMixin Komplexität:** → Architektur bereits festgelegt, Implementation folgt Pattern
- **Cytoscape-Integration Komplexität:** → Bewährtes Framework, gute Dokumentation
- **Performance bei großen Graphen:** → Performance-Ziele definiert, LOD aktiv
- **Autosave-Konflikte:** → Last-write-wins (MVP), erweiterbar später

---

## Stop / Decision Points

- ✅ WindowSystemBridgeMixin-Architektur implementiert
- ✅ Beide Sheets funktional (Graph + Node)
- ✅ Performance-Ziele erreicht (getestet)

---

## Referenzen

- [UI-Architektur & Sheets](../../analysis/ui-architecture-sheets.md)
- [Performance- & Skalierungs-Strategie](../../analysis/performance-scalability-strategy.md)
