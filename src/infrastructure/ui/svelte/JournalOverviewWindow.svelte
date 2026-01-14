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
  const viewModelState = $derived(
    viewModel.state.get() as {
      journals: JournalWithVisibility[];
      filteredJournals: JournalWithVisibility[];
      isLoading: boolean;
      error: string | null;
      sortColumn: string | null;
      sortDirection: "asc" | "desc";
      columnFilters: Record<string, string>;
      globalSearch: string;
    }
  );

  // Local mutable state for inputs (for two-way binding)
  // These will be synced with state via $effect
  let globalSearchValue = $state("");
  let nameFilterValue = $state("");
  let statusFilterValue = $state("");

  // Sync local inputs with state changes
  // Note: viewModelState is a $derived value, so accessing it in $effect is reactive
  // In Svelte 5, $derived values can be accessed directly in $effect
  $effect(() => {
    globalSearchValue = viewModelState.globalSearch || "";
    nameFilterValue = viewModelState.columnFilters?.name || "";
    statusFilterValue = viewModelState.columnFilters?.status || "";
  });

  // Helper to get sort icon for a specific column
  // Use $derived to ensure reactivity
  const getSortIcon = (column: string): string => {
    const sortColumn = viewModelState.sortColumn;
    const sortDirection = viewModelState.sortDirection;
    if (sortColumn !== column) {
      return "fas fa-sort";
    }
    return sortDirection === "asc" ? "fas fa-sort-up" : "fas fa-sort-down";
  };

  // Create derived values for each column's sort icon to ensure reactivity
  const nameSortIcon = $derived(getSortIcon("name"));
  const statusSortIcon = $derived(getSortIcon("status"));

  // Helper to handle sort click
  function handleSortClick(column: string): void {
    const action = (viewModel.actions as Record<string, unknown>).setSort as
      | ((column: string) => void)
      | undefined;
    if (action) {
      action(column);
    }
  }

  // Helper to handle global search change
  function handleGlobalSearchChange(): void {
    const action = (viewModel.actions as Record<string, unknown>).setGlobalSearch as
      | ((value: string) => void)
      | undefined;
    if (action) {
      action(globalSearchValue);
    }
  }

  // Helper to handle column filter change
  function handleColumnFilterChange(column: string, value: string): void {
    const action = (viewModel.actions as Record<string, unknown>).setColumnFilter as
      | ((column: string, value: string) => void)
      | undefined;
    if (action) {
      action(column, value);
    }
  }

  // Helper to handle toggle visibility
  function handleToggleVisibility(journalId: string): void {
    const action = (viewModel.actions as Record<string, unknown>).toggleJournalVisibility as
      | ((journalId: string) => void)
      | undefined;
    if (action) {
      action(journalId);
    }
  }

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
  {#if viewModelState.isLoading}
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i> Lade Journale...
    </div>
  {:else if viewModelState.error}
    <div class="error">
      <i class="fas fa-exclamation-triangle"></i>
      {viewModelState.error}
    </div>
  {:else if viewModelState.journals.length === 0}
    <div class="empty">
      <i class="fas fa-inbox"></i> Keine Journale gefunden
    </div>
  {:else}
    <!-- Filter Bereich -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-group global-search">
          <label for="global-search">
            <i class="fas fa-search"></i> Volltextsuche
          </label>
          <input
            id="global-search"
            type="text"
            placeholder="Alle Spalten durchsuchen..."
            bind:value={globalSearchValue}
            oninput={handleGlobalSearchChange}
          />
        </div>
      </div>
    </div>

    <!-- Tabelle -->
    <table class="journal-table">
      <thead>
        <tr>
          <th class="sortable">
            <div class="th-content">
              <button type="button" class="th-header" onclick={() => handleSortClick("name")}>
                <span>Name</span>
                <i class={nameSortIcon}></i>
              </button>
              <input
                id="name-filter"
                type="text"
                class="column-filter-input"
                placeholder="Filtern..."
                bind:value={nameFilterValue}
                oninput={() => handleColumnFilterChange("name", nameFilterValue)}
                onclick={(e) => e.stopPropagation()}
              />
            </div>
          </th>
          <th class="sortable">
            <div class="th-content">
              <button type="button" class="th-header" onclick={() => handleSortClick("status")}>
                <span>Sichtbarkeitsstatus</span>
                <i class={statusSortIcon}></i>
              </button>
              <input
                id="status-filter"
                type="text"
                class="column-filter-input"
                placeholder="Filtern..."
                bind:value={statusFilterValue}
                oninput={() => handleColumnFilterChange("status", statusFilterValue)}
                onclick={(e) => e.stopPropagation()}
              />
            </div>
          </th>
          <th class="action-column">
            <div class="th-content">
              <div class="th-header">Aktionen</div>
              <div class="column-filter-spacer"></div>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        {#each viewModelState.filteredJournals || [] as journal (journal.id)}
          <tr>
            <td class="journal-name">{journal.name || journal.id}</td>
            <td class="journal-status">
              <span class="status-badge {getStatusClass(journal.isHidden)}">
                <i class={getStatusIcon(journal.isHidden)}></i>
                {getStatusText(journal.isHidden, viewModel.i18n)}
              </span>
            </td>
            <td class="journal-actions">
              <button
                class="toggle-button"
                type="button"
                title={journal.isHidden ? "Journal anzeigen" : "Journal verstecken"}
                onclick={() => handleToggleVisibility(journal.id)}
              >
                <i class={getStatusIcon(journal.isHidden)}></i>
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <!-- Info und Bulk-Actions -->
    <div class="footer-section">
      <div class="info-text">
        {(viewModelState.filteredJournals || []).length} von {(viewModelState.journals || [])
          .length} Journals angezeigt
      </div>
      <div
        class="bulk-actions"
        style="display: flex; flex-direction: row; gap: 0.5rem; flex-wrap: nowrap; align-items: center;"
      >
        <button
          class="bulk-action-button"
          type="button"
          onclick={() => {
            const action = viewModel.actions.setAllVisible;
            if (action) action();
          }}
          disabled={(viewModelState.filteredJournals || []).length === 0}
        >
          <i class="fas fa-eye"></i> Alle sichtbar
        </button>
        <button
          class="bulk-action-button"
          type="button"
          onclick={() => {
            const action = viewModel.actions.setAllHidden;
            if (action) action();
          }}
          disabled={(viewModelState.filteredJournals || []).length === 0}
        >
          <i class="fas fa-eye-slash"></i> Alle unsichtbar
        </button>
        <button
          class="bulk-action-button"
          type="button"
          onclick={() => {
            const action = viewModel.actions.toggleAll;
            if (action) action();
          }}
          disabled={(viewModelState.filteredJournals || []).length === 0}
        >
          <i class="fas fa-exchange-alt"></i> Alle umschalten
        </button>
      </div>
    </div>
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
    color: var(--color-text-secondary);
  }

  .error {
    color: var(--color-error);
  }

  .journal-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .journal-table thead {
    background-color: var(--color-bg-secondary);
    border-bottom: 2px solid var(--color-border);
  }

  .journal-table th {
    padding: 0.75rem;
    text-align: left;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .journal-table tbody tr {
    border-bottom: 1px solid var(--color-border);
  }

  .journal-table tbody tr:hover {
    background-color: var(--color-bg-hover);
  }

  .journal-table td {
    padding: 0.75rem;
    vertical-align: middle;
  }

  .journal-name {
    font-weight: 500;
    color: var(--color-text-primary);
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
    background-color: var(--color-success-bg);
    color: var(--color-success-text);
  }

  .status-hidden {
    background-color: var(--color-warning-bg);
    color: var(--color-warning-text);
  }

  .filter-section {
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: var(--color-bg-secondary);
    border-radius: 0.25rem;
  }

  .filter-row {
    display: flex;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .filter-row:last-child {
    margin-bottom: 0;
  }

  .filter-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .filter-group.global-search {
    flex: 1;
  }

  .filter-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filter-group input {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 0.9rem;
  }

  .filter-group input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .journal-table th.sortable {
    user-select: none;
  }

  .th-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .th-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    width: 100%;
  }

  .th-header:hover {
    color: var(--color-primary);
  }

  .th-header:focus {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .th-content i {
    font-size: 0.85rem;
    color: var(--color-text-secondary);
  }

  .column-filter-input {
    width: 100%;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    font-size: 0.85rem;
    background-color: var(--color-bg-primary);
  }

  .column-filter-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .action-column {
    width: 80px;
    text-align: center;
  }

  .action-column .th-header {
    justify-content: center;
  }

  .column-filter-spacer {
    height: 1.875rem; /* Gleiche Höhe wie column-filter-input (padding + border + line-height) */
    visibility: hidden;
  }

  .journal-actions {
    text-align: center;
  }

  .toggle-button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--color-text-primary);
    transition: all 0.2s;
  }

  .toggle-button:hover {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
  }

  .toggle-button:active {
    transform: scale(0.95);
  }

  .footer-section {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .info-text {
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }

  .footer-section .bulk-actions {
    display: flex !important;
    flex-direction: row !important;
    gap: 0.5rem;
    flex-wrap: nowrap !important;
    align-items: center;
    width: auto;
    min-width: 0;
  }

  .bulk-action-button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    cursor: pointer;
    font-size: 0.9rem;
    display: inline-flex !important;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
    white-space: nowrap;
    flex-shrink: 0;
    width: auto;
    min-width: fit-content;
  }

  .bulk-action-button:hover:not(:disabled) {
    background-color: var(--color-bg-hover);
    border-color: var(--color-primary);
  }

  .bulk-action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .bulk-action-button:active:not(:disabled) {
    transform: scale(0.98);
  }
</style>
