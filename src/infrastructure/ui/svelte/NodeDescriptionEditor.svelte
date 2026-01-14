<script lang="ts">
  /**
   * NodeDescriptionEditor - Description-Editor für Node-Sheet
   *
   * Features:
   * - Public Description
   * - Hidden Description
   * - GM Description
   */

  interface Props {
    descriptions?: {
      public?: string;
      hidden?: string;
      gm?: string;
    };
    readonly?: boolean;
    onDescriptionsChange: (descriptions: { public?: string; hidden?: string; gm?: string }) => void;
  }

  let { descriptions = {}, readonly = false, onDescriptionsChange }: Props = $props();
</script>

<div class="node-description-editor">
  <h3>Beschreibungen</h3>

  <div class="description-field">
    <label for="description-public">Öffentlich</label>
    <textarea
      id="description-public"
      rows="4"
      value={descriptions.public ?? ""}
      disabled={readonly}
      onchange={(e) => {
        onDescriptionsChange({ ...descriptions, public: (e.target as HTMLTextAreaElement).value });
      }}
      placeholder="Öffentlich sichtbare Beschreibung"
    ></textarea>
  </div>

  <div class="description-field">
    <label for="description-hidden">Versteckt</label>
    <textarea
      id="description-hidden"
      rows="4"
      value={descriptions.hidden ?? ""}
      disabled={readonly}
      onchange={(e) => {
        onDescriptionsChange({ ...descriptions, hidden: (e.target as HTMLTextAreaElement).value });
      }}
      placeholder="Versteckte Beschreibung (nur für Spieler mit Berechtigung)"
    ></textarea>
  </div>

  <div class="description-field">
    <label for="description-gm">GM</label>
    <textarea
      id="description-gm"
      rows="4"
      value={descriptions.gm ?? ""}
      disabled={readonly}
      onchange={(e) => {
        onDescriptionsChange({ ...descriptions, gm: (e.target as HTMLTextAreaElement).value });
      }}
      placeholder="GM-Beschreibung (nur für Game Master)"
    ></textarea>
  </div>
</div>

<style>
  .node-description-editor {
    background: var(--color-bg-secondary, var(--color-cool-5-90));
    padding: 1.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border, var(--color-border-light-primary));
  }

  .node-description-editor h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-tertiary));
    padding-bottom: 0.5rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .description-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .description-field label {
    font-weight: bold;
    font-size: 0.9rem;
    color: var(--color-form-label);
  }

  .description-field textarea {
    padding: 0.5rem;
    border: 1px solid var(--input-border-color);
    border-radius: 4px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: vertical;
    background-color: var(--input-background-color);
    color: var(--input-text-color);
  }

  .description-field textarea:focus {
    outline: none;
    border-color: var(--input-focus-outline-color);
    color: var(--input-text-color);
  }
</style>
