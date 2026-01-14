<script lang="ts">
  /**
   * CytoscapeGraph - Wrapper-Komponente für Cytoscape-Graph-Visualisierung
   *
   * Features:
   * - Canvas-Renderer (Standard, LOD aktiv)
   * - Graph-Elemente rendern (Nodes/Edges)
   * - Interaktivität: Drag Nodes, Add/Remove Edges, Edit Edge, Zoom/Pan
   * - Layout Save (onDragEnd)
   * - Structure Save (debounced)
   */

  import { onMount, onDestroy } from "svelte";
  import type cytoscape from "cytoscape";

  interface Props {
    graphData?: {
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
    readonly?: boolean;
    onLayoutChange?: (layout: {
      positions: Record<string, { x: number; y: number }>;
      zoom: number;
      pan: { x: number; y: number };
    }) => void;
    onStructureChange?: (graphData: unknown) => void;
  }

  let { graphData, readonly = false, onLayoutChange, onStructureChange }: Props = $props();

  let containerElement: HTMLDivElement | null = null;
  let cyInstance = $state<cytoscape.Core | null>(null);
  let structureChangeTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    if (!containerElement) return;

    // Dynamisch cytoscape importieren
    import("cytoscape")
      .then((cytoscapeModule) => {
        const cytoscape = cytoscapeModule.default;

        // Cytoscape initialisieren (Canvas-Renderer ist Standard)
        cyInstance = cytoscape({
          container: containerElement,
          elements: convertGraphDataToElements(graphData),
          style: getGraphStyle(),
          layout: {
            name: "preset",
            positions: graphData?.layout?.positions,
            zoom: graphData?.layout?.zoom ?? 1,
            pan: graphData?.layout?.pan ?? { x: 0, y: 0 },
          },
          // Readonly-Modus: Interaktivität deaktivieren
          boxSelectionEnabled: !readonly,
          autoungrabify: readonly,
          autolock: readonly,
          userPanningEnabled: !readonly,
          userZoomingEnabled: !readonly,
        });

        // Event-Handler registrieren
        setupEventHandlers();
      })
      .catch((error) => {
        console.error("Failed to load cytoscape:", error);
      });
  });

  onDestroy(() => {
    if (structureChangeTimeout) {
      clearTimeout(structureChangeTimeout);
    }
    if (cyInstance) {
      cyInstance.destroy();
      cyInstance = null;
    }
  });

  function convertGraphDataToElements(graphData: Props["graphData"]) {
    if (!graphData) return [];

    const elements: Array<{ data: Record<string, unknown> }> = [];

    // Nodes
    if (graphData.nodeKeys) {
      for (const nodeKey of graphData.nodeKeys) {
        elements.push({
          data: {
            id: nodeKey,
            label: nodeKey, // TODO: Load actual node data
          },
        });
      }
    }

    // Edges
    if (graphData.edges) {
      for (const edge of graphData.edges) {
        elements.push({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            knowledge: edge.knowledge,
            label: edge.label,
          },
        });
      }
    }

    return elements;
  }

  function getGraphStyle() {
    return [
      {
        selector: "node",
        style: {
          "background-color": "#666",
          label: "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          width: 30,
          height: 30,
        },
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": "#ccc",
          "target-arrow-color": "#ccc",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier",
          label: "data(label)",
        },
      },
    ] as unknown as cytoscape.StylesheetCSS[];
  }

  function setupEventHandlers() {
    if (!cyInstance) return;

    // Layout Save: onDragEnd (sofort speichern)
    cyInstance.on("dragfree", () => {
      if (!cyInstance) return;

      const positions: Record<string, { x: number; y: number }> = {};
      cyInstance.nodes().forEach((node) => {
        const pos = node.position();
        positions[node.id()] = { x: pos.x, y: pos.y };
      });

      const zoom = cyInstance.zoom();
      const pan = cyInstance.pan();

      onLayoutChange?.({
        positions,
        zoom,
        pan: { x: pan.x, y: pan.y },
      });
    });

    // Structure Save: Debounced (500ms nach Edge/Node-Änderungen)
    cyInstance.on("add remove", () => {
      if (structureChangeTimeout) {
        clearTimeout(structureChangeTimeout);
      }

      structureChangeTimeout = setTimeout(() => {
        if (!cyInstance) return;

        const graphData = convertElementsToGraphData();
        onStructureChange?.(graphData);
      }, 500);
    });
  }

  function convertElementsToGraphData() {
    if (!cyInstance) return null;

    const nodeKeys: string[] = [];
    const edges: Array<{
      id: string;
      source: string;
      target: string;
      knowledge?: number;
      label?: string;
    }> = [];

    cyInstance.nodes().forEach((node) => {
      nodeKeys.push(node.id());
    });

    cyInstance.edges().forEach((edge) => {
      const knowledge = edge.data("knowledge") as number | undefined;
      const label = edge.data("label") as string | undefined;
      const edgeData: {
        id: string;
        source: string;
        target: string;
        knowledge?: number;
        label?: string;
      } = {
        id: edge.id(),
        source: edge.source().id(),
        target: edge.target().id(),
      };
      if (knowledge !== undefined) {
        edgeData.knowledge = knowledge;
      }
      if (label !== undefined) {
        edgeData.label = label;
      }
      edges.push(edgeData);
    });

    return {
      nodeKeys,
      edges,
    };
  }
</script>

<div class="cytoscape-graph" bind:this={containerElement}>
  {#if !cyInstance}
    <div class="loading">Lade Graph...</div>
  {/if}
</div>

<style>
  .cytoscape-graph {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #666;
  }
</style>
