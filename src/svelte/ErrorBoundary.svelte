<script lang="ts">
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let error: Error | null = $state(null);

  onMount(() => {
    const handleError = (e: ErrorEvent) => {
      error = e.error;
      e.preventDefault(); // Prevent browser default error handling
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  });

  function resetError() {
    error = null;
  }
</script>

{#if error}
  <div class="error-boundary">
    <div class="error-boundary__content">
      <h2 class="error-boundary__title">⚠️ Etwas ist schiefgelaufen</h2>
      <div class="error-boundary__message">
        <strong>Fehler:</strong>
        {error.message}
      </div>
      {#if error.stack}
        <details class="error-boundary__stack">
          <summary>Details</summary>
          <pre>{error.stack}</pre>
        </details>
      {/if}
      <button class="error-boundary__retry" onclick={resetError}> Erneut versuchen </button>
    </div>
  </div>
{:else}
  {@render children?.()}
{/if}

<style>
  .error-boundary {
    padding: 1.5rem;
    border: 2px solid #dc2626;
    border-radius: 0.5rem;
    background: #fee2e2;
    color: #991b1b;
    margin: 1rem 0;
  }

  .error-boundary__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .error-boundary__title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .error-boundary__message {
    padding: 0.75rem;
    background: white;
    border-radius: 0.25rem;
    border-left: 4px solid #dc2626;
  }

  .error-boundary__stack {
    font-size: 0.875rem;
  }

  .error-boundary__stack summary {
    cursor: pointer;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 0.25rem;
  }

  .error-boundary__stack summary:hover {
    background: rgba(255, 255, 255, 0.8);
  }

  .error-boundary__stack pre {
    margin: 0.5rem 0 0 0;
    padding: 0.5rem;
    background: white;
    border-radius: 0.25rem;
    overflow-x: auto;
    font-size: 0.75rem;
  }

  .error-boundary__retry {
    align-self: flex-start;
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 0.25rem;
    cursor: pointer;
    font-weight: 500;
  }

  .error-boundary__retry:hover {
    background: #b91c1c;
  }
</style>
