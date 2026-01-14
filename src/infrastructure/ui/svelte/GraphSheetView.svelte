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
    notificationCenter?: unknown; // NotificationCenter from ViewModel
    readonly?: boolean; // View-Modus (keine Bearbeitung möglich)
  }

  let {
    document,
    state: initialState = {},
    graphDataService,
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

  let activeTab = $state<"ui" | "json">("ui");
  type GraphData = {
    graphKey?: string;
    nodeKeys?: string[];
    edges?: Array<{
      id: string;
      source: string;
      target: string;
      knowledge?: number;
      label?: string;
    }>;
    layout?: {
      positions?: Record<string, { x: number; y: number }>;
      zoom?: number;
      pan?: { x: number; y: number };
    };
  };

  let graphData = $state<GraphData | undefined>(undefined);
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

  async function loadGraphData() {
    if (!graphDataServiceTyped || !pageId) return;

    const result = await graphDataServiceTyped.loadGraphData(pageId);
    if (result.ok && result.value) {
      graphData = result.value as GraphData;
    } else {
      notificationCenterTyped?.error("Failed to load graph data", result.error);
    }
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

  function handleApply(newGraphData: unknown) {
    graphData = newGraphData as GraphData;
    // Trigger re-render of CytoscapeGraph
    loadGraphData();
  }

  function handleFit() {
    cytoscapeInstance?.fit();
  }

  function handleCenter() {
    cytoscapeInstance?.center();
  }

  function handleAddEdge() {
    // TODO: Implement add edge dialog
    notificationCenterTyped?.info("Add edge feature coming soon");
  }

  function handleDelete() {
    // TODO: Implement delete selected element
    notificationCenterTyped?.info("Delete feature coming soon");
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
              onLayoutChange={handleLayoutChange}
              onStructureChange={handleStructureChange}
            />
          {/if}
        </div>
        {#if selectedElement}
          <GraphInspector
            {selectedElement}
            {readonly}
            onUpdate={(id, data) => {
              // TODO: Update element in graphData
              notificationCenterTyped?.info("Update feature coming soon");
            }}
          />
        {/if}
      </div>
    </div>
  {:else}
    <div class="graph-sheet-json">
      <GraphJsonEditor {graphData} {readonly} onApply={handleApply} onValidate={handleValidate} />
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
