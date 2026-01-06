<!--
  Journal Overview Window Component

  Displays all journals with their visibility status in a table.
  Uses ViewModel for state management and actions.
-->
<script lang="ts">
  import type { ViewModel } from "@/domain/windows/types/view-model.interface";
  import type { JournalWithVisibility } from "@/application/services/JournalOverviewService";

  interface Props {
    viewModel: ViewModel;
  }

  let { viewModel }: Props = $props();

  // Get state from ViewModel (reactive via RuneState)
  // Use $derived to make it reactive
  const state = $derived(
    viewModel.state.get() as {
      journals: JournalWithVisibility[];
      isLoading: boolean;
      error: string | null;
    }
  );

  // Helper function to get status text
  // Access viewModel.i18n directly in the template to avoid closure issues
  function getStatusText(isHidden: boolean, i18n?: typeof viewModel.i18n): string {
    if (i18n) {
      return isHidden
        ? i18n.translate("journalOverview.status.hidden", "Versteckt")
        : i18n.translate("journalOverview.status.visible", "Sichtbar");
    }
    return isHidden ? "Versteckt" : "Sichtbar";
  }

  // Helper function to get status icon class
  function getStatusIcon(isHidden: boolean): string {
    return isHidden ? "fas fa-eye-slash" : "fas fa-eye";
  }

  // Helper function to get status class
  function getStatusClass(isHidden: boolean): string {
    return isHidden ? "status-hidden" : "status-visible";
  }
</script>

<div class="journal-overview-window">
  {#if state.isLoading}
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i> Lade Journale...
    </div>
  {:else if state.error}
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      {state.error}
    </div>
  {:else if state.journals.length === 0}
    <div class="empty">
      <i class="fas fa-inbox"></i> Keine Journale gefunden
    </div>
  {:else}
    <table class="journal-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Sichtbarkeitsstatus</th>
        </tr>
      </thead>
      <tbody>
        {#each state.journals as journal (journal.id)}
          <tr>
            <td class="journal-name">{journal.name || journal.id}</td>
            <td class="journal-status">
              <span class="status-badge {getStatusClass(journal.isHidden)}">
                <i class={getStatusIcon(journal.isHidden)}></i>
                {getStatusText(journal.isHidden, viewModel.i18n)}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .journal-overview-window {
    padding: 1rem;
    min-height: 400px;
  }

  .loading,
  .error,
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem;
    text-align: center;
    color: var(--color-text-secondary, #666);
  }

  .error {
    color: var(--color-error, #d32f2f);
  }

  .journal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .journal-table thead {
    background-color: var(--color-bg-secondary, #f5f5f5);
    border-bottom: 2px solid var(--color-border, #ddd);
  }

  .journal-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-primary, #333);
  }

  .journal-table tbody tr {
    border-bottom: 1px solid var(--color-border, #eee);
  }

  .journal-table tbody tr:hover {
    background-color: var(--color-bg-hover, #f9f9f9);
  }

  .journal-table td {
    padding: 0.75rem;
    vertical-align: middle;
  }

  .journal-name {
    font-weight: 500;
    color: var(--color-text-primary, #333);
  }

  .journal-status {
    text-align: right;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .status-visible {
    background-color: var(--color-success-bg, #e8f5e9);
    color: var(--color-success-text, #2e7d32);
  }

  .status-hidden {
    background-color: var(--color-warning-bg, #fff3e0);
    color: var(--color-warning-text, #e65100);
  }
</style>
