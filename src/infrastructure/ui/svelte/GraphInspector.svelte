<script lang="ts">
  /**
   * GraphInspector - Inspector-Panel für Node/Edge-Details
   *
   * Features:
   * - Zeigt Details des ausgewählten Nodes/Edges
   * - Bearbeitung von Edge-Properties (Knowledge-Level, Label)
   */

  interface Props {
    selectedElement?: {
      type: "node" | "edge";
      id: string;
      data?: Record<string, unknown>;
    };
    readonly?: boolean;
    onUpdate?: (id: string, data: Record<string, unknown>) => void;
  }

  let { selectedElement, readonly = false, onUpdate }: Props = $props();
</script>

<div class="graph-inspector">
  {#if selectedElement}
    <div class="inspector-header">
      <h3>{selectedElement.type === "node" ? "Node" : "Edge"} Details</h3>
    </div>
    <div class="inspector-content">
      <div class="inspector-field">
        <span class="field-label">ID:</span>
        <span>{selectedElement.id}</span>
      </div>
      {#if selectedElement.type === "edge"}
        <div class="inspector-field">
          <label for="knowledge-level">Knowledge Level:</label>
          <input
            id="knowledge-level"
            type="number"
            min="0"
            max="100"
            value={selectedElement.data?.knowledge ?? 0}
            disabled={readonly}
            onchange={(e) => {
              const value = Number.parseInt((e.target as HTMLInputElement).value, 10);
              onUpdate?.(selectedElement.id, { ...selectedElement.data, knowledge: value });
            }}
          />
        </div>
        <div class="inspector-field">
          <label for="edge-label">Label:</label>
          <input
            id="edge-label"
            type="text"
            value={(selectedElement.data?.label as string) ?? ""}
            disabled={readonly}
            onchange={(e) => {
              const value = (e.target as HTMLInputElement).value;
              onUpdate?.(selectedElement.id, { ...selectedElement.data, label: value });
            }}
          />
        </div>
      {/if}
    </div>
  {:else}
    <div class="inspector-empty">
      <p>Kein Element ausgewählt</p>
      <p class="hint">Klicken Sie auf einen Node oder Edge, um Details anzuzeigen</p>
    </div>
  {/if}
</div>

<style>
  .graph-inspector {
    width: 250px;
    background: var(--color-bg-secondary, var(--color-cool-5-90));
    border-left: 1px solid var(--color-border, var(--color-border-light-primary));
    padding: 1rem;
    overflow-y: auto;
  }

  .inspector-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-primary));
  }

  .inspector-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .inspector-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .inspector-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .inspector-field label,
  .inspector-field .field-label {
    font-weight: bold;
    font-size: 0.9rem;
    color: var(--color-form-label);
  }

  .inspector-field input {
    padding: 0.5rem;
    border: 1px solid var(--input-border-color);
    border-radius: 4px;
    background-color: var(--input-background-color);
    color: var(--input-text-color);
  }

  .inspector-field input:focus {
    outline: none;
    border-color: var(--input-focus-outline-color);
    color: var(--input-text-color);
  }

  .inspector-empty {
    text-align: center;
    color: var(--color-text-secondary, var(--color-text-light-secondary));
    padding: 2rem 1rem;
  }

  .inspector-empty .hint {
    font-size: 0.85rem;
    margin-top: 0.5rem;
    color: var(--color-text-secondary, var(--color-text-light-secondary));
  }
</style>
