---
ID: PHASE-4-UI-FEATURES
Prinzip: Feature Completion
Schweregrad: Medium
Module/Layer: infrastructure/ui/svelte
Status: Proposed
---

# Phase 4 UI Features - Completion Plan

**Ziel:** Vervollständigung der fehlenden UI-Features nach Phase 4 Implementierung

**Datum:** 2026-01-XX
**Kontext:** Phase 4 UI ist implementiert, aber einige Features sind noch nicht vollständig (TODOs vorhanden)

---

## 1. Übersicht der fehlenden Features

### 1.1 GraphSheetView - Add Edge Feature
**Status:** ❌ Nicht implementiert (nur Info-Meldung)
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`
**Zeile:** 181-184

**Aktueller Code:**
```typescript
function handleAddEdge() {
  // TODO: Implement add edge dialog
  notificationCenterTyped?.info("Add edge feature coming soon");
}
```

### 1.2 GraphSheetView - Delete Feature
**Status:** ❌ Nicht implementiert (nur Info-Meldung)
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`
**Zeile:** 186-189

**Aktueller Code:**
```typescript
function handleDelete() {
  // TODO: Implement delete selected element
  notificationCenterTyped?.info("Delete feature coming soon");
}
```

### 1.3 GraphInspector - Update Feature
**Status:** ❌ Nicht implementiert (nur Info-Meldung)
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`
**Zeile:** 229-232

**Aktueller Code:**
```typescript
onUpdate={(id, data) => {
  // TODO: Update element in graphData
  notificationCenterTyped?.info("Update feature coming soon");
}}
```

### 1.4 CytoscapeGraph - Node Labels
**Status:** ⚠️ Teilweise implementiert (zeigt nur UUIDs)
**Datei:** `src/infrastructure/ui/svelte/CytoscapeGraph.svelte`
**Zeile:** 104

**Aktueller Code:**
```typescript
label: nodeKey, // TODO: Load actual node data
```

---

## 2. Feature 1: Add Edge Dialog

### 2.1 Anforderungen
- Dialog zum Hinzufügen einer Edge zwischen zwei Nodes
- Auswahl von Source- und Target-Node
- Eingabe von Edge-Properties:
  - `knowledge`: "public" | "hidden" | "secret" (default: "public")
  - `label`: string (optional)
- Validierung: Source und Target müssen unterschiedlich sein
- Edge-ID generieren (z.B. `${source}-${target}` oder UUID)

### 2.2 Implementierungsschritte

#### Schritt 1: AddEdgeDialog Komponente erstellen
**Datei:** `src/infrastructure/ui/svelte/AddEdgeDialog.svelte`

**Props:**
```typescript
interface Props {
  nodeKeys: string[];
  nodeLabels?: Record<string, string>; // nodeKey -> label mapping
  onConfirm: (edge: { source: string; target: string; knowledge: EdgeKnowledge; label?: string }) => void;
  onCancel: () => void;
}
```

**Features:**
- Dropdown/Select für Source-Node
- Dropdown/Select für Target-Node
- Radio-Buttons oder Select für Knowledge-Level
- Text-Input für Label (optional)
- Validierung: Source ≠ Target
- Confirm/Cancel Buttons

#### Schritt 2: Dialog-State in GraphSheetView
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Änderungen:**
- State für Dialog: `let showAddEdgeDialog = $state(false);`
- `handleAddEdge()` öffnet Dialog
- Dialog-Komponente rendern (conditional)
- `handleEdgeConfirm()` erstellt Edge und speichert

#### Schritt 3: Edge-Erstellung und Speicherung
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Implementierung:**
```typescript
function handleEdgeConfirm(edgeData: { source: string; target: string; knowledge: EdgeKnowledge; label?: string }) {
  if (!graphData) return;

  // Edge-ID generieren
  const edgeId = `${edgeData.source}-${edgeData.target}`;

  // Prüfen ob Edge bereits existiert
  const existingEdge = graphData.edges?.find(e => e.id === edgeId || (e.source === edgeData.source && e.target === edgeData.target));
  if (existingEdge) {
    notificationCenterTyped?.error("Edge already exists between these nodes");
    return;
  }

  // Neue Edge erstellen
  const newEdge: RelationshipEdge = {
    id: edgeId,
    source: edgeData.source,
    target: edgeData.target,
    knowledge: edgeData.knowledge,
    label: edgeData.label,
  };

  // Zu graphData hinzufügen
  const updatedData: GraphData = {
    ...graphData,
    edges: [...(graphData.edges ?? []), newEdge],
  };

  // Speichern
  handleStructureChange(updatedData);
  showAddEdgeDialog = false;
}
```

#### Schritt 4: CytoscapeGraph aktualisieren
**Datei:** `src/infrastructure/ui/svelte/CytoscapeGraph.svelte`

**Änderungen:**
- Edge wird automatisch durch `onStructureChange` hinzugefügt
- Cytoscape rendert neue Edge automatisch (wenn `graphData` aktualisiert wird)

---

## 3. Feature 2: Delete Element

### 3.1 Anforderungen
- Löschen von ausgewählten Nodes oder Edges
- Bestätigungs-Dialog (optional, für kritische Operationen)
- Validierung: Node kann nur gelöscht werden, wenn keine Edges vorhanden
- Oder: Edge wird gelöscht, Node bleibt erhalten

### 3.2 Implementierungsschritte

#### Schritt 1: Delete-Handler in GraphSheetView
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Implementierung:**
```typescript
function handleDelete() {
  if (!selectedElement || !graphData) return;

  if (selectedElement.type === "node") {
    // Prüfen ob Node Edges hat
    const nodeEdges = graphData.edges?.filter(e => e.source === selectedElement.id || e.target === selectedElement.id);
    if (nodeEdges && nodeEdges.length > 0) {
      // Option 1: Fehler anzeigen
      notificationCenterTyped?.error(`Cannot delete node: ${nodeEdges.length} edge(s) connected. Delete edges first.`);
      return;

      // Option 2: Edges mitlöschen (wenn gewünscht)
      // const updatedData = {
      //   ...graphData,
      //   nodeKeys: graphData.nodeKeys.filter(k => k !== selectedElement.id),
      //   edges: graphData.edges.filter(e => e.source !== selectedElement.id && e.target !== selectedElement.id),
      // };
      // handleStructureChange(updatedData);
    } else {
      // Node löschen
      const updatedData: GraphData = {
        ...graphData,
        nodeKeys: graphData.nodeKeys.filter(k => k !== selectedElement.id),
      };
      handleStructureChange(updatedData);
      selectedElement = undefined; // Selection zurücksetzen
    }
  } else if (selectedElement.type === "edge") {
    // Edge löschen
    const updatedData: GraphData = {
      ...graphData,
      edges: graphData.edges?.filter(e => e.id !== selectedElement.id) ?? [],
    };
    handleStructureChange(updatedData);
    selectedElement = undefined; // Selection zurücksetzen
  }
}
```

#### Schritt 2: CytoscapeGraph Selection-Handling
**Datei:** `src/infrastructure/ui/svelte/CytoscapeGraph.svelte`

**Änderungen:**
- Selection-Events an GraphSheetView weitergeben
- `onSelectionChange` Callback hinzufügen

**Implementierung:**
```typescript
// In CytoscapeGraph.svelte
interface Props {
  // ... existing props
  onSelectionChange?: (element: { type: "node" | "edge"; id: string; data?: Record<string, unknown> } | undefined) => void;
}

// In setupEventHandlers()
cyInstance.on("select", (event) => {
  const element = event.target;
  if (element.isNode()) {
    onSelectionChange?.({
      type: "node",
      id: element.id(),
      data: element.data(),
    });
  } else if (element.isEdge()) {
    onSelectionChange?.({
      type: "edge",
      id: element.id(),
      data: element.data(),
    });
  }
});

cyInstance.on("unselect", () => {
  onSelectionChange?.(undefined);
});
```

**In GraphSheetView.svelte:**
```typescript
function handleSelectionChange(element: { type: "node" | "edge"; id: string; data?: Record<string, unknown> } | undefined) {
  selectedElement = element;
}
```

---

## 4. Feature 3: Update Element (GraphInspector)

### 4.1 Anforderungen
- Aktualisierung von Edge-Properties (Knowledge, Label)
- Aktualisierung von Node-Properties (falls später erweitert)
- Sofortiges Speichern nach Änderung

### 4.2 Implementierungsschritte

#### Schritt 1: Update-Handler in GraphSheetView
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Implementierung:**
```typescript
function handleElementUpdate(id: string, data: Record<string, unknown>) {
  if (!graphData || !selectedElement) return;

  if (selectedElement.type === "edge") {
    // Edge aktualisieren
    const updatedEdges = graphData.edges.map(edge => {
      if (edge.id === id) {
        return {
          ...edge,
          ...data, // knowledge, label werden überschrieben
        };
      }
      return edge;
    });

    const updatedData: GraphData = {
      ...graphData,
      edges: updatedEdges,
    };

    handleStructureChange(updatedData);

    // Selection aktualisieren
    selectedElement = {
      ...selectedElement,
      data: { ...selectedElement.data, ...data },
    };
  } else if (selectedElement.type === "node") {
    // Node-Properties können später erweitert werden
    // Aktuell: Nodes haben keine editierbaren Properties im Graph
    notificationCenterTyped?.info("Node properties editing not yet implemented");
  }
}
```

#### Schritt 2: GraphInspector Integration
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Änderungen:**
- `onUpdate` Prop an GraphInspector übergeben
- `handleElementUpdate` als Callback verwenden

**Code:**
```typescript
<GraphInspector
  {selectedElement}
  {readonly}
  onUpdate={handleElementUpdate}
/>
```

---

## 5. Feature 4: Node Labels laden

### 5.1 Anforderungen
- Node-Labels zeigen echte Node-Namen statt UUIDs
- Node-Daten müssen geladen werden (NodeDataService)
- Caching für Performance
- Fallback auf UUID wenn Node nicht gefunden

### 5.2 Implementierungsschritte

#### Schritt 1: NodeDataService in GraphSheetView verfügbar machen
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Änderungen:**
- `nodeDataService` als Prop hinzufügen (wird vom Bridge-Mixin bereitgestellt)
- State für Node-Labels: `let nodeLabels = $state<Record<string, string>>({});`

#### Schritt 2: Node-Daten laden
**Datei:** `src/infrastructure/ui/svelte/GraphSheetView.svelte`

**Implementierung:**
```typescript
// NodeDataService Typ
const nodeDataServiceTyped = $derived(
  nodeDataService as
    | {
        loadNodeData: (pageId: string) => Promise<{ ok: boolean; value?: unknown; error?: { message?: string } }>;
      }
    | undefined
);

// Node-Labels laden
async function loadNodeLabels() {
  if (!graphData?.nodeKeys || !nodeDataServiceTyped) return;

  const labels: Record<string, string> = {};

  // Parallel alle Node-Daten laden
  const loadPromises = graphData.nodeKeys.map(async (nodeKey) => {
    const result = await nodeDataServiceTyped.loadNodeData(nodeKey);
    if (result.ok && result.value) {
      const nodeData = result.value as { name?: string };
      labels[nodeKey] = nodeData.name ?? nodeKey; // Fallback auf UUID
    } else {
      labels[nodeKey] = nodeKey; // Fallback auf UUID
    }
  });

  await Promise.all(loadPromises);
  nodeLabels = labels;
}

// Labels laden wenn graphData sich ändert
$effect(() => {
  if (graphData) {
    loadNodeLabels();
  }
});
```

#### Schritt 3: CytoscapeGraph aktualisieren
**Datei:** `src/infrastructure/ui/svelte/CytoscapeGraph.svelte`

**Änderungen:**
- `nodeLabels` als Prop hinzufügen
- Labels in `convertGraphDataToElements()` verwenden

**Implementierung:**
```typescript
interface Props {
  // ... existing props
  nodeLabels?: Record<string, string>; // nodeKey -> label mapping
}

function convertGraphDataToElements(graphData: Props["graphData"], nodeLabels?: Props["nodeLabels"]) {
  // ...
  if (graphData.nodeKeys) {
    for (const nodeKey of graphData.nodeKeys) {
      elements.push({
        data: {
          id: nodeKey,
          label: nodeLabels?.[nodeKey] ?? nodeKey, // Verwende Label oder Fallback auf UUID
        },
      });
    }
  }
  // ...
}
```

**In GraphSheetView.svelte:**
```typescript
<CytoscapeGraph
  {graphData}
  {readonly}
  nodeLabels={nodeLabels}
  onLayoutChange={handleLayoutChange}
  onStructureChange={handleStructureChange}
  onSelectionChange={handleSelectionChange}
/>
```

---

## 6. Implementierungsreihenfolge

### Priorität 1 (Kern-Features):
1. ✅ **Feature 4: Node Labels laden** - Wichtig für UX, zeigt echte Namen
2. ✅ **Feature 3: Update Element** - GraphInspector ist bereits vorhanden, nur Callback fehlt
3. ✅ **Feature 2: Delete Element** - Wichtig für Graph-Management

### Priorität 2 (Erweiterte Features):
4. ✅ **Feature 1: Add Edge Dialog** - Komplexer, benötigt Dialog-Komponente

---

## 7. Betroffene Dateien

### Zu erstellende Dateien:
- `src/infrastructure/ui/svelte/AddEdgeDialog.svelte` (neu)

### Zu ändernde Dateien:
- `src/infrastructure/ui/svelte/GraphSheetView.svelte`
- `src/infrastructure/ui/svelte/CytoscapeGraph.svelte`
- `src/infrastructure/ui/svelte/GraphInspector.svelte` (optional, falls Anpassungen nötig)

### Service-Integration:
- `NodeDataService` wird bereits vom Bridge-Mixin bereitgestellt
- `GraphDataService` wird bereits verwendet
- Keine neuen Services nötig

---

## 8. Testing-Strategie

### Unit-Tests:
- Edge-Erstellung (ID-Generierung, Validierung)
- Edge-Löschung
- Node-Löschung (mit/ohne Edges)
- Node-Label-Loading (mit/ohne NodeDataService)

### Integration-Tests:
- Add Edge Dialog → Graph aktualisiert
- Delete Element → Graph aktualisiert
- Update Element → Graph aktualisiert
- Node Labels → Cytoscape zeigt Namen

### E2E-Tests (später):
- Benutzer fügt Edge hinzu
- Benutzer löscht Element
- Benutzer aktualisiert Edge-Properties

---

## 9. Offene Fragen / Entscheidungen

### 9.1 Edge-ID Generierung
**Frage:** Wie sollen Edge-IDs generiert werden?
- **Option 1:** `${source}-${target}` (einfach, aber nicht eindeutig wenn mehrere Edges zwischen gleichen Nodes)
- **Option 2:** UUID generieren (eindeutig, aber nicht lesbar)
- **Option 3:** `${source}-${target}-${index}` (eindeutig, lesbar)

**Empfehlung:** Option 2 (UUID) für Eindeutigkeit, oder Option 3 für Lesbarkeit

### 9.2 Node-Löschung mit Edges
**Frage:** Was passiert wenn Node mit Edges gelöscht wird?
- **Option 1:** Fehler anzeigen, Node nicht löschen
- **Option 2:** Edges mitlöschen
- **Option 3:** Dialog: "Node hat X Edges. Alle löschen?"

**Empfehlung:** Option 1 (Fehler) für MVP, Option 3 für später

### 9.3 Node-Label Caching
**Frage:** Wie lange sollen Node-Labels gecacht werden?
- **Option 1:** Pro Graph-Session (bis Sheet geschlossen)
- **Option 2:** Global (bis Modul neu geladen)
- **Option 3:** Kein Cache (immer neu laden)

**Empfehlung:** Option 1 (Session-Cache) für Performance

---

## 10. Abhängigkeiten

### Externe Abhängigkeiten:
- Keine neuen Abhängigkeiten nötig
- Cytoscape bereits vorhanden
- Svelte bereits vorhanden

### Interne Abhängigkeiten:
- `NodeDataService` muss verfügbar sein (bereits vorhanden)
- `GraphDataService` muss verfügbar sein (bereits vorhanden)
- Bridge-Mixin muss `nodeDataService` als Prop bereitstellen (prüfen!)

---

## 11. Checkliste

### Feature 1: Add Edge
- [ ] AddEdgeDialog Komponente erstellen
- [ ] Dialog-State in GraphSheetView
- [ ] Edge-Erstellung und Validierung
- [ ] Edge-ID Generierung
- [ ] Integration mit CytoscapeGraph

### Feature 2: Delete Element
- [ ] Delete-Handler implementieren
- [ ] Selection-Handling in CytoscapeGraph
- [ ] Validierung (Node mit Edges)
- [ ] Selection zurücksetzen nach Delete

### Feature 3: Update Element
- [ ] Update-Handler implementieren
- [ ] GraphInspector Integration
- [ ] Edge-Properties aktualisieren
- [ ] Selection aktualisieren

### Feature 4: Node Labels
- [ ] NodeDataService als Prop hinzufügen
- [ ] Node-Labels laden (parallel)
- [ ] Caching-Strategie
- [ ] CytoscapeGraph Labels verwenden
- [ ] Fallback auf UUID

### Allgemein:
- [ ] Tests schreiben
- [ ] Dokumentation aktualisieren
- [ ] CHANGELOG aktualisieren
- [ ] Code-Review

---

## 12. Geschätzter Aufwand

- **Feature 1 (Add Edge):** ~4-6 Stunden
- **Feature 2 (Delete):** ~2-3 Stunden
- **Feature 3 (Update):** ~1-2 Stunden
- **Feature 4 (Node Labels):** ~3-4 Stunden

**Gesamt:** ~10-15 Stunden

---

## 13. Nächste Schritte

1. ✅ Plan reviewen und bestätigen
2. ✅ Feature 4 (Node Labels) zuerst implementieren (höchste Priorität)
3. ✅ Feature 3 (Update) implementieren (einfachste)
4. ✅ Feature 2 (Delete) implementieren
5. ✅ Feature 1 (Add Edge) implementieren (komplexeste)
6. ✅ Tests schreiben
7. ✅ Dokumentation aktualisieren
