<script lang="ts">
  /**
   * GraphSheetView - Hauptkomponente für Graph-Sheet
   *
   * Features:
   * - Dual Editor (UI Tab + JSON Tab)
   * - Cytoscape-Integration
   * - Autosave-Funktionalität
   * - Toolbar und Inspector
   */

  import CytoscapeGraph from "./CytoscapeGraph.svelte";
  import GraphToolbar from "./GraphToolbar.svelte";
  import GraphInspector from "./GraphInspector.svelte";
  import GraphJsonEditor from "./GraphJsonEditor.svelte";

  interface Props {
    document: unknown; // JournalEntryPage
    state?: Record<string, unknown>;
    graphDataService?: unknown; // GraphDataService from ViewModel
    nodeDataService?: unknown; // NodeDataService from ViewModel
    notificationCenter?: unknown; // NotificationCenter from ViewModel
    readonly?: boolean; // View-Modus (keine Bearbeitung möglich)
  }

  let {
    document,
    state: initialState = {},
    graphDataService,
    nodeDataService,
    notificationCenter,
    readonly = false,
  }: Props = $props();

  // Type-safe access to services (using $derived to avoid Svelte warning)
  const graphDataServiceTyped = $derived(
    graphDataService as
      | {
          loadGraphData: (
            pageId: string
          ) => Promise<{ ok: boolean; value?: unknown; error?: { message?: string } }>;
          saveGraphData: (
            pageId: string,
            data: unknown
          ) => Promise<{ ok: boolean; error?: { message?: string } }>;
          validateGraphData: (data: unknown) => { ok: boolean; error?: { message?: string } };
        }
      | undefined
  );

  const notificationCenterTyped = $derived(
    notificationCenter as
      | {
          error: (message: string, error?: unknown) => void;
          info: (message: string) => void;
        }
      | undefined
  );

  const nodeDataServiceTyped = $derived(
    nodeDataService as
      | {
          loadNodeData: (
            pageId: string
          ) => Promise<{ ok: boolean; value?: unknown; error?: { message?: string } }>;
        }
      | undefined
  );

  let activeTab = $state<"ui" | "json">("ui");
  type GraphData = {
    graphKey?: string;
    nodeKeys?: string[];
    edges?: Array<{
      id: string;
      source: string;
      target: string;
      knowledge?: "public" | "hidden" | "secret";
      label?: string;
    }>;
    layout?: {
      positions?: Record<string, { x: number; y: number }>;
      zoom?: number;
      pan?: { x: number; y: number };
    };
  };

  let graphData = $state<GraphData | undefined>(undefined);
  let nodeLabels = $state<Record<string, string>>({});
  let selectedElement = $state<
    { type: "node" | "edge"; id: string; data?: Record<string, unknown> } | undefined
  >(undefined);
  let cytoscapeInstance: { fit: () => void; center: () => void } | null = null;
  let pageId = $derived((document as { id?: string })?.id ?? "");

  // Load graph data on mount
  $effect(() => {
    if (pageId && graphDataServiceTyped) {
      loadGraphData();
    }
  });

  // Load node labels when graphData changes
  $effect(() => {
    if (graphData) {
      loadNodeLabels();
    }
  });

  async function loadGraphData() {
    if (!graphDataServiceTyped || !pageId) return;

    const result = await graphDataServiceTyped.loadGraphData(pageId);
    if (result.ok && result.value) {
      graphData = result.value as GraphData;
    } else {
      notificationCenterTyped?.error("Failed to load graph data", result.error);
    }
  }

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

  function handleLayoutChange(layout: {
    positions: Record<string, { x: number; y: number }>;
    zoom: number;
    pan: { x: number; y: number };
  }) {
    if (!graphData) return;

    // Update layout in graphData
    const updatedData: GraphData = {
      ...graphData,
      layout,
    };

    // Save immediately (Layout Save)
    if (graphDataServiceTyped && pageId) {
      graphDataServiceTyped.saveGraphData(pageId, updatedData).then((result) => {
        if (!result.ok) {
          notificationCenterTyped?.error("Failed to save layout", result.error);
        }
      });
    }

    graphData = updatedData;
  }

  function handleStructureChange(newGraphData: unknown) {
    if (!graphDataServiceTyped || !pageId) return;

    const typedData = newGraphData as GraphData;

    // Save with debounce (already handled in CytoscapeGraph)
    graphDataServiceTyped.saveGraphData(pageId, typedData).then((result) => {
      if (!result.ok) {
        notificationCenterTyped?.error("Failed to save graph structure", result.error);
      } else {
        graphData = typedData;
        notificationCenterTyped?.info("Graph structure saved");
      }
    });
  }

  function handleValidate(graphDataToValidate: unknown): { valid: boolean; errors?: string[] } {
    if (!graphDataServiceTyped) return { valid: true };

    const result = graphDataServiceTyped.validateGraphData(graphDataToValidate);
    if (result.ok) {
      return { valid: true };
    }
    const errorMessage = result.error?.message ?? "Validation failed";
    return {
      valid: false,
      errors: [errorMessage],
    };
  }

  async function handleApply(newGraphData: unknown) {
    if (!graphDataServiceTyped || !pageId) return;

    const typedData = newGraphData as GraphData;

    // Save the data first
    const saveResult = await graphDataServiceTyped.saveGraphData(pageId, typedData);
    if (!saveResult.ok) {
      notificationCenterTyped?.error("Failed to save graph data", saveResult.error);
      return;
    }

    // Update local graphData with saved data
    graphData = typedData;
    notificationCenterTyped?.info("Graph data saved and applied");
  }

  function handleFit() {
    cytoscapeInstance?.fit();
  }

  function handleCenter() {
    cytoscapeInstance?.center();
  }

  function handleAddEdge() {
    if (!graphData?.nodeKeys || graphData.nodeKeys.length < 2) {
      notificationCenterTyped?.error("At least 2 nodes required to add an edge");
      return;
    }

    // HTML-Content für Dialog
    const nodeOptions = graphData.nodeKeys
      .map((key) => {
        const label = nodeLabels[key] ?? key;
        return `<option value="${key}">${label}</option>`;
      })
      .join("");

    const content = `
    <div class="form-group">
      <label>Source Node:</label>
      <select name="source" required>
        <option value="">-- Select Source --</option>
        ${nodeOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Target Node:</label>
      <select name="target" required>
        <option value="">-- Select Target --</option>
        ${nodeOptions}
      </select>
    </div>
    <div class="form-group">
      <label>Knowledge Level:</label>
      <label><input type="radio" name="knowledge" value="public" checked> Public</label>
      <label><input type="radio" name="knowledge" value="hidden"> Hidden</label>
      <label><input type="radio" name="knowledge" value="secret"> Secret</label>
    </div>
    <div class="form-group">
      <label>Label (optional):</label>
      <input type="text" name="label" placeholder="Edge label">
    </div>
  `;

    new foundry.applications.api.DialogV2({
      window: { title: "Add Edge" },
      content,
      buttons: [
        {
          action: "add",
          label: "Add Edge",
          default: true,
          callback: (event, button, dialog) => {
            const form = button.form;
            if (!form) {
              notificationCenterTyped?.error("Form not found");
              return false;
            }
            const sourceElement = form.elements.namedItem("source") as HTMLSelectElement;
            const targetElement = form.elements.namedItem("target") as HTMLSelectElement;
            const knowledgeElement = form.elements.namedItem("knowledge") as HTMLInputElement;
            const labelElement = form.elements.namedItem("label") as HTMLInputElement;

            const source = sourceElement?.value;
            const target = targetElement?.value;
            const knowledge = knowledgeElement?.value;
            const label = labelElement?.value || undefined;

            // Validierung
            if (!source || !target) {
              notificationCenterTyped?.error("Source and target are required");
              return false; // Dialog bleibt offen
            }
            if (source === target) {
              notificationCenterTyped?.error("Source and target must be different");
              return false;
            }

            // Edge erstellen
            const edgeData: {
              source: string;
              target: string;
              knowledge: string;
              label?: string;
            } = {
              source,
              target,
              knowledge,
            };
            if (label) {
              edgeData.label = label;
            }
            handleEdgeConfirm(edgeData);
            return true; // Dialog schließen
          },
        },
        {
          action: "cancel",
          label: "Cancel",
        },
      ],
    }).render({ force: true });
  }

  function handleEdgeConfirm(edgeData: {
    source: string;
    target: string;
    knowledge: string;
    label?: string;
  }) {
    if (!graphData) return;

    // Edge-ID generieren: source-target-uuid
    // Verwendet Foundry Utils Port (ISP-konform: nur UUID-Port)
    let uuid = "";
    try {
      if (typeof game !== "undefined" && game?.modules) {
        const mod = game.modules.get("fvtt_relationship_app_module");
        if (mod?.api?.resolve) {
          const utilsUuid = mod.api.resolve(mod.api.tokens.platformUuidUtilsPortToken);
          uuid = utilsUuid.randomID();
        } else {
          // Fallback: direkter Aufruf wenn API nicht verfügbar
          uuid = foundry.utils.randomID();
        }
      } else {
        // Fallback: direkter Aufruf wenn game nicht verfügbar
        uuid = foundry.utils.randomID();
      }
    } catch {
      // Fallback: direkter Aufruf bei Fehler
      uuid = foundry.utils.randomID();
    }
    const edgeId = `${edgeData.source}-${edgeData.target}-${uuid}`;

    // Prüfen ob Edge bereits existiert (gleiche Source/Target Kombination)
    const existingEdge = graphData.edges?.find(
      (e) => e.source === edgeData.source && e.target === edgeData.target
    );
    if (existingEdge) {
      notificationCenterTyped?.error("Edge already exists between these nodes");
      return;
    }

    // Neue Edge erstellen
    const newEdge = {
      id: edgeId,
      source: edgeData.source,
      target: edgeData.target,
      knowledge: edgeData.knowledge as "public" | "hidden" | "secret",
      ...(edgeData.label ? { label: edgeData.label } : {}),
    } as GraphData["edges"] extends Array<infer T> ? T : never;

    // Zu graphData hinzufügen
    const updatedData: GraphData = {
      ...graphData,
      edges: [...(graphData.edges ?? []), newEdge],
    };

    // Speichern
    handleStructureChange(updatedData);
  }

  function handleSelectionChange(
    element: { type: "node" | "edge"; id: string; data?: Record<string, unknown> } | undefined
  ) {
    selectedElement = element;
  }

  function handleDelete() {
    if (!selectedElement || !graphData) return;

    if (selectedElement.type === "node") {
      // Prüfen ob Node Edges hat
      const nodeEdges = graphData.edges?.filter(
        (e) => e.source === selectedElement!.id || e.target === selectedElement!.id
      );
      if (nodeEdges && nodeEdges.length > 0) {
        // Fehler anzeigen, Node nicht löschen
        notificationCenterTyped?.error(
          `Cannot delete node: ${nodeEdges.length} edge(s) connected. Delete edges first.`
        );
        return;
      } else {
        // Node löschen
        const updatedData: GraphData = {
          ...graphData,
          nodeKeys: graphData.nodeKeys?.filter((k) => k !== selectedElement!.id) ?? [],
        };
        handleStructureChange(updatedData);
        selectedElement = undefined; // Selection zurücksetzen
      }
    } else if (selectedElement.type === "edge") {
      // Edge löschen
      const updatedData: GraphData = {
        ...graphData,
        edges: graphData.edges?.filter((e) => e.id !== selectedElement!.id) ?? [],
      };
      handleStructureChange(updatedData);
      selectedElement = undefined; // Selection zurücksetzen
    }
  }

  function handleElementUpdate(id: string, data: Record<string, unknown>) {
    if (!graphData || !selectedElement) return;

    if (selectedElement.type === "edge") {
      // Edge aktualisieren
      const updatedEdges = graphData.edges?.map((edge) => {
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
        edges: updatedEdges ?? [],
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
</script>

<div class="graph-sheet-view">
  <div class="graph-sheet-tabs">
    <button class="tab-button" class:active={activeTab === "ui"} onclick={() => (activeTab = "ui")}>
      UI Editor
    </button>
    <button
      class="tab-button"
      class:active={activeTab === "json"}
      onclick={() => (activeTab = "json")}
    >
      JSON Editor
    </button>
  </div>

  {#if activeTab === "ui"}
    <div class="graph-sheet-ui">
      <GraphToolbar
        onFit={handleFit}
        onCenter={handleCenter}
        onAddEdge={handleAddEdge}
        onDelete={handleDelete}
      />
      <div class="graph-sheet-main">
        <div class="graph-sheet-canvas">
          {#if graphData}
            <CytoscapeGraph
              {graphData}
              {readonly}
              {nodeLabels}
              onLayoutChange={handleLayoutChange}
              onStructureChange={handleStructureChange}
              onSelectionChange={handleSelectionChange}
            />
          {/if}
        </div>
        {#if selectedElement}
          <GraphInspector {selectedElement} {readonly} onUpdate={handleElementUpdate} />
        {/if}
      </div>
    </div>
  {:else}
    <div class="graph-sheet-json">
      <GraphJsonEditor
        {graphData}
        {document}
        {readonly}
        onApply={handleApply}
        onValidate={handleValidate}
      />
    </div>
  {/if}
</div>

<style>
  .graph-sheet-view {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .graph-sheet-tabs {
    display: flex;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-primary));
    background: var(--color-bg-secondary, var(--color-cool-4));
  }

  .tab-button {
    padding: 0.75rem 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    font-size: 0.95rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .tab-button:hover {
    background: var(--color-bg-hover, var(--color-cool-3));
  }

  .tab-button.active {
    border-bottom-color: var(--color-primary, var(--color-border-highlight));
    background: var(--color-cool-5-90);
  }

  .graph-sheet-ui {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .graph-sheet-main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .graph-sheet-canvas {
    flex: 1;
    position: relative;
  }

  .graph-sheet-json {
    flex: 1;
    overflow: hidden;
  }
</style>
