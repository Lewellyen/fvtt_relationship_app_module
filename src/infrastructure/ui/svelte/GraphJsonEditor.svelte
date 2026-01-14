<script lang="ts">
  /**
   * GraphJsonEditor - JSON-Editor-Tab für Graph-Sheet
   *
   * Features:
   * - Text-Editor für Graph Data (JSON)
   * - Validate-Button: Schema-Validierung
   * - Apply-Button: JSON → Graph Data → Rerender
   * - Error-Display: Ungültiges JSON/Schema → Notifications
   */

  interface Props {
    graphData?: unknown;
    readonly?: boolean;
    onApply?: (graphData: unknown) => void;
    onValidate?: (graphData: unknown) => { valid: boolean; errors?: string[] };
  }

  let { graphData, readonly = false, onApply, onValidate }: Props = $props();

  let jsonText = $state("");
  let validationErrors = $state<string[]>([]);
  let isValid = $state(true);

  // Update jsonText when graphData changes
  $effect(() => {
    jsonText = JSON.stringify(graphData ?? {}, null, 2);
  });

  function handleValidate() {
    try {
      const parsed = JSON.parse(jsonText);
      const result = onValidate?.(parsed);

      if (result) {
        isValid = result.valid;
        validationErrors = result.errors ?? [];
      } else {
        isValid = true;
        validationErrors = [];
      }
    } catch (error) {
      isValid = false;
      validationErrors = [error instanceof Error ? error.message : String(error)];
    }
  }

  function handleApply() {
    try {
      const parsed = JSON.parse(jsonText);
      const result = onValidate?.(parsed);

      if (result && !result.valid) {
        validationErrors = result.errors ?? [];
        isValid = false;
        return;
      }

      onApply?.(parsed);
      isValid = true;
      validationErrors = [];
    } catch (error) {
      isValid = false;
      validationErrors = [error instanceof Error ? error.message : String(error)];
    }
  }
</script>

<div class="graph-json-editor">
  <div class="json-editor-header">
    <h3>JSON Editor</h3>
    <div class="json-editor-actions">
      <button class="action-button" disabled={readonly} onclick={handleValidate}>Validate</button>
      <button class="action-button primary" disabled={readonly} onclick={handleApply}>Apply</button>
    </div>
  </div>

  {#if !isValid && validationErrors.length > 0}
    <div class="json-editor-errors">
      <h4>Validation Errors:</h4>
      <ul>
        {#each validationErrors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="json-editor-content">
    <textarea class="json-textarea" bind:value={jsonText} disabled={readonly} spellcheck={false}
    ></textarea>
  </div>
</div>

<style>
  .graph-json-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .json-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-primary));
    background: var(--color-bg-secondary, var(--color-cool-4));
  }

  .json-editor-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .json-editor-actions {
    display: flex;
    gap: 0.5rem;
  }

  .action-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--button-border-color);
    background-color: var(--button-background-color);
    color: var(--button-text-color);
    cursor: pointer;
    border-radius: 4px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .action-button:hover {
    background-color: var(--button-hover-background-color);
    border-color: var(--button-hover-border-color);
    color: var(--button-hover-text-color);
  }

  .action-button.primary {
    background-color: var(--button-hover-background-color);
    color: var(--button-hover-text-color);
    border-color: var(--button-hover-border-color);
  }

  .action-button.primary:hover {
    background-color: var(--color-warm-1);
    border-color: var(--color-warm-2);
    color: var(--color-cool-5);
  }

  .json-editor-errors {
    padding: 1rem;
    background: var(--color-level-error-bg);
    border-bottom: 1px solid var(--color-level-error-border);
    color: var(--color-level-error);
  }

  .json-editor-errors h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
  }

  .json-editor-errors ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .json-editor-content {
    flex: 1;
    padding: 1rem;
    overflow: hidden;
  }

  .json-textarea {
    width: 100%;
    height: 100%;
    font-family: var(--font-monospace);
    font-size: 0.9rem;
    padding: 0.5rem;
    border: 1px solid var(--input-border-color);
    border-radius: 4px;
    resize: none;
    background-color: var(--input-background-color);
    color: var(--input-text-color);
  }

  .json-textarea:focus {
    outline: none;
    border-color: var(--input-focus-outline-color);
    color: var(--input-text-color);
  }
</style>
