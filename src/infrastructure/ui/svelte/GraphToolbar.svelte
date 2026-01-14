<script lang="ts">
  /**
   * GraphToolbar - Toolbar-Komponente für Graph-Sheet
   *
   * Features:
   * - Fit/Center Buttons
   * - Add Edge Button
   * - Delete Button
   */

  interface Props {
    readonly?: boolean;
    onFit?: () => void;
    onCenter?: () => void;
    onAddEdge?: () => void;
    onDelete?: () => void;
  }

  let { readonly = false, onFit, onCenter, onAddEdge, onDelete }: Props = $props();
</script>

<div class="graph-toolbar">
  <button class="toolbar-button" onclick={onFit} title="Graph anpassen">
    <span>🔍</span> Fit
  </button>
  <button class="toolbar-button" onclick={onCenter} title="Graph zentrieren">
    <span>🎯</span> Center
  </button>
  <div class="toolbar-separator"></div>
  <button class="toolbar-button" disabled={readonly} onclick={onAddEdge} title="Kante hinzufügen">
    <span>➕</span> Add Edge
  </button>
  <button
    class="toolbar-button"
    disabled={readonly}
    onclick={onDelete}
    title="Ausgewähltes Element löschen"
  >
    <span>🗑️</span> Delete
  </button>
</div>

<style>
  .graph-toolbar {
    display: flex;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--color-bg-secondary, var(--color-cool-4));
    border-bottom: 1px solid var(--color-border, var(--color-border-light-primary));
  }

  .toolbar-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-border-color);
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .toolbar-button:hover {
    background-color: var(--button-hover-background-color);
    border-color: var(--button-hover-border-color);
    color: var(--button-hover-text-color);
  }

  .toolbar-separator {
    width: 1px;
    background: var(--color-border-light-primary);
    margin: 0 0.5rem;
  }
</style>
