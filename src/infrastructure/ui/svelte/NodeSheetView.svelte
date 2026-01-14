<script lang="ts">
  /**
   * NodeSheetView - Hauptkomponente für Node-Sheet
   *
   * Features:
   * - Form-UI für Node-Daten bearbeiten
   * - Descriptions (Public/Hidden/GM)
   * - Reveal-Settings (Public/Hidden)
   * - Effects (optional)
   * - Linked Entity UUID
   * - Form-Validation
   * - Autosave (optional)
   */

  import NodeForm from "./NodeForm.svelte";
  import NodeDescriptionEditor from "./NodeDescriptionEditor.svelte";
  import NodeRevealSettings from "./NodeRevealSettings.svelte";

  interface Props {
    document: unknown; // JournalEntryPage
    state?: Record<string, unknown>;
    nodeDataService?: unknown; // NodeDataService from ViewModel
    notificationCenter?: unknown; // NotificationCenter from ViewModel
    onDataChange?: (data: NodeData) => void; // Callback für _updateObject
    onSaveSuccess?: (callback: () => void) => void; // Callback-Registrierung für erfolgreiches Speichern
    readonly?: boolean; // View-Modus (keine Bearbeitung möglich)
  }

  let {
    document,
    state: initialState = {},
    nodeDataService,
    notificationCenter,
    onDataChange,
    onSaveSuccess,
    readonly = false,
  }: Props = $props();

  // Type-safe access to services (using $derived to avoid Svelte warning)
  const nodeDataServiceTyped = $derived(
    nodeDataService as
      | {
          loadNodeData: (
            pageId: string
          ) => Promise<{ ok: boolean; value?: unknown; error?: { message?: string } }>;
          saveNodeData: (
            pageId: string,
            data: unknown
          ) => Promise<{ ok: boolean; error?: { message?: string } }>;
          validateNodeData: (data: unknown) => { ok: boolean; error?: { message?: string } };
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

  type NodeData = {
    schemaVersion?: number;
    nodeKey?: string;
    name?: string;
    kind?: "person" | "place" | "object";
    factionId?: string;
    relation?: "friend" | "enemy" | "neutral";
    icon?: string;
    descriptions?: {
      public?: string;
      hidden?: string;
      gm?: string;
    };
    reveal?: {
      public?: boolean;
      hidden?: boolean;
    };
    effects?: {
      friend?: string;
      enemy?: string;
      neutral?: string;
    };
    linkedEntityUuid?: string;
  };

  let nodeData = $state<NodeData | undefined>(undefined);
  // Foundry JournalEntryPage: id is available directly on document
  // Try both id and _id for compatibility
  let pageId = $derived(() => {
    const doc = document as { id?: string; _id?: string };
    const id = doc?.id ?? doc?._id ?? "";
    if (!id) {
      console.warn("[NodeSheetView] No pageId found. Document keys:", Object.keys(doc || {}));
    }
    return id;
  });
  let hasUnsavedChanges = $state(false);

  // Debug: Log initial state
  $effect(() => {
    console.log(
      "[NodeSheetView] Component mounted. Document:",
      document,
      "pageId:",
      pageId,
      "service:",
      !!nodeDataServiceTyped
    );
  });

  // Load node data on mount
  $effect(() => {
    const currentPageId = pageId();
    if (currentPageId && nodeDataServiceTyped) {
      loadNodeData();
    } else {
      // Debug: Log why loading is skipped
      if (!currentPageId) {
        console.warn(
          "[NodeSheetView] No pageId available. Document:",
          document,
          "Document type:",
          typeof document
        );
      }
      if (!nodeDataServiceTyped) {
        console.warn("[NodeSheetView] nodeDataService not available. Props:", {
          nodeDataService: !!nodeDataService,
          notificationCenter: !!notificationCenter,
        });
      }
    }
  });

  async function loadNodeData() {
    const currentPageId = pageId();
    if (!nodeDataServiceTyped || !currentPageId) return;

    const result = await nodeDataServiceTyped.loadNodeData(currentPageId);

    if (result.ok) {
      // Handle case where page exists but has no data yet (new page)
      if (result.value) {
        // Extract data from Foundry DataModel if needed
        // Foundry DataModels have a toObject() method to convert to plain object
        let extractedData: NodeData;
        const value = result.value;

        if (value && typeof value === "object") {
          // Check if it's a Foundry DataModel with toObject() method
          if (
            "toObject" in value &&
            typeof (value as { toObject?: () => unknown }).toObject === "function"
          ) {
            // Use toObject() to get plain data
            extractedData = (value as { toObject: () => NodeData }).toObject() as NodeData;
          } else {
            // Already a plain object - extract relevant properties
            const extracted = {
              schemaVersion: (value as { schemaVersion?: number }).schemaVersion,
              nodeKey: (value as { nodeKey?: string }).nodeKey,
              name: (value as { name?: string }).name,
              kind: (value as { kind?: "person" | "place" | "object" }).kind,
              factionId: (value as { factionId?: string }).factionId,
              relation: (value as { relation?: "friend" | "enemy" | "neutral" }).relation,
              icon: (value as { icon?: string }).icon,
              descriptions: (
                value as { descriptions?: { public?: string; hidden?: string; gm?: string } }
              ).descriptions,
              reveal: (value as { reveal?: { public?: boolean; hidden?: boolean } }).reveal,
              effects: (
                value as { effects?: { friend?: string; enemy?: string; neutral?: string } }
              ).effects,
              linkedEntityUuid: (value as { linkedEntityUuid?: string }).linkedEntityUuid,
            };
            // Filter out undefined values to match exactOptionalPropertyTypes
            extractedData = Object.fromEntries(
              Object.entries(extracted).filter(([_, v]) => v !== undefined)
            ) as NodeData;
          }
        } else {
          extractedData = value as NodeData;
        }
        nodeData = extractedData;
        hasUnsavedChanges = false;
      } else {
        // New page with no data - initialize with empty data
        nodeData = {
          schemaVersion: 1,
          name: "",
          kind: "person",
          relation: "neutral",
        };
        hasUnsavedChanges = false;
      }
    } else {
      // If page doesn't exist yet, initialize with empty data
      const errorCode = (result.error as { code?: string })?.code;
      if (errorCode === "PAGE_NOT_FOUND" || errorCode === "REPOSITORY_ERROR") {
        nodeData = {
          schemaVersion: 1,
          name: "",
          kind: "person",
          relation: "neutral",
        };
        hasUnsavedChanges = false;
      } else {
        notificationCenterTyped?.error("Failed to load node data", result.error);
      }
    }
  }

  function handleDataChange(updatedData: unknown) {
    nodeData = updatedData as NodeData;
    hasUnsavedChanges = true;
    // Notify parent (Mixin) about data changes for _updateObject
    if (onDataChange && nodeData) {
      console.log("[NodeSheetView] Notifying parent about data change:", nodeData);
      onDataChange(nodeData);
    } else {
      console.warn("[NodeSheetView] onDataChange not available or nodeData is null", {
        onDataChange: !!onDataChange,
        nodeData,
      });
    }
  }

  // Funktion, die vom Mixin aufgerufen wird, wenn Speichern erfolgreich war
  function handleSaveSuccess() {
    console.log("[NodeSheetView] Save successful, resetting hasUnsavedChanges");
    hasUnsavedChanges = false;
  }

  // Registriere handleSaveSuccess beim Mixin, damit er es nach erfolgreichem Speichern aufrufen kann
  // Verwende $effect.pre, um sicherzustellen, dass die Registrierung sofort beim Mounten passiert
  $effect.pre(() => {
    if (onSaveSuccess) {
      console.log("[NodeSheetView] Registering save success callback");
      // onSaveSuccess ist eine Funktion, die einen Callback akzeptiert
      // Wir registrieren handleSaveSuccess als Callback
      onSaveSuccess(handleSaveSuccess);
    } else {
      console.warn("[NodeSheetView] onSaveSuccess not available yet");
    }
  });
</script>

<div class="node-sheet-view">
  <div class="node-sheet-header">
    <h2>Beziehungsknoten</h2>
    {#if hasUnsavedChanges}
      <span class="unsaved-indicator">● Ungespeicherte Änderungen</span>
    {/if}
  </div>

  <div class="node-sheet-content">
    {#if nodeData}
      <NodeForm {nodeData} {readonly} onDataChange={handleDataChange} />
      <NodeDescriptionEditor
        descriptions={nodeData.descriptions ?? {}}
        {readonly}
        onDescriptionsChange={(descriptions) => {
          handleDataChange({ ...nodeData, descriptions });
        }}
      />
      <NodeRevealSettings
        reveal={nodeData.reveal ?? {}}
        {readonly}
        onRevealChange={(reveal) => {
          handleDataChange({ ...nodeData, reveal });
        }}
      />
    {:else}
      <div class="loading">Lade Node-Daten...</div>
    {/if}
  </div>
</div>

<style>
  /* Global styles für Parent-Container - müssen außerhalb der Komponente sein */
  /* Die Handlebars-Templates enthalten bereits die Flexbox-Struktur */
  :global(#svelte-mount-point) {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .node-sheet-view {
    padding: 1rem;
    height: 100%;
    min-height: 0;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .node-sheet-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-primary));
    flex-shrink: 0;
  }

  .node-sheet-header h2 {
    margin: 0;
    font-size: 1.5rem;
    flex: 1;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .unsaved-indicator {
    color: var(--color-error, var(--color-level-error));
    font-size: 0.9rem;
  }

  .node-sheet-content {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    /* Explizite Höhenbegrenzung für Scrollbalken */
    height: 0; /* Trick: Mit flex: 1 1 0 und height: 0 wird die Höhe durch flex bestimmt */
    /* Scrollbar-Styling für bessere Sichtbarkeit */
    scrollbar-width: thin;
    scrollbar-color: var(--color-scrollbar, var(--color-border-light-primary)) transparent;
  }

  /* Webkit-Scrollbar-Styling für Chrome/Safari */
  .node-sheet-content::-webkit-scrollbar {
    width: 8px;
  }

  .node-sheet-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .node-sheet-content::-webkit-scrollbar-thumb {
    background-color: var(--color-scrollbar, var(--color-border-light-primary));
    border-radius: 4px;
  }

  .node-sheet-content::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-border-highlight, var(--color-border-light-secondary));
  }

  .loading {
    text-align: center;
    color: var(--color-text-secondary, var(--color-text-light-secondary));
    padding: 2rem;
  }
</style>
