<script lang="ts">
  /**
   * NodeForm - Form-Komponente für Node-Daten
   *
   * Features:
   * - Node-Daten bearbeiten (Name, Kind, Fraktion, Relation, Icon, Linked Entity UUID)
   * - Form-Validation
   */

  interface Props {
    nodeData: {
      name?: string;
      kind?: "person" | "place" | "object";
      factionId?: string;
      relation?: "friend" | "enemy" | "neutral";
      icon?: string;
      linkedEntityUuid?: string;
    };
    readonly?: boolean;
    onDataChange: (data: unknown) => void;
  }

  let { nodeData, readonly = false, onDataChange }: Props = $props();
</script>

<div class="node-form">
  <h3>Grunddaten</h3>

  <div class="form-field">
    <label for="node-name">Name *</label>
    <input
      id="node-name"
      type="text"
      value={nodeData.name ?? ""}
      disabled={readonly}
      onchange={(e) => {
        onDataChange({ ...nodeData, name: (e.target as HTMLInputElement).value });
      }}
      required
    />
  </div>

  <div class="form-field">
    <label for="node-kind">Art *</label>
    <select
      id="node-kind"
      value={nodeData.kind ?? "person"}
      disabled={readonly}
      onchange={(e) => {
        onDataChange({
          ...nodeData,
          kind: (e.target as HTMLSelectElement).value as "person" | "place" | "object",
        });
      }}
      required
    >
      <option value="person">Person</option>
      <option value="place">Ort</option>
      <option value="object">Objekt</option>
    </select>
  </div>

  <div class="form-field">
    <label for="node-faction">Fraktion</label>
    <input
      id="node-faction"
      type="text"
      value={nodeData.factionId ?? ""}
      disabled={readonly}
      onchange={(e) => {
        onDataChange({ ...nodeData, factionId: (e.target as HTMLInputElement).value });
      }}
    />
  </div>

  <div class="form-field">
    <label for="node-relation">Beziehung *</label>
    <select
      id="node-relation"
      value={nodeData.relation ?? "neutral"}
      disabled={readonly}
      onchange={(e) => {
        onDataChange({
          ...nodeData,
          relation: (e.target as HTMLSelectElement).value as "friend" | "enemy" | "neutral",
        });
      }}
      required
    >
      <option value="friend">Freund</option>
      <option value="enemy">Feind</option>
      <option value="neutral">Neutral</option>
    </select>
  </div>

  <div class="form-field">
    <label for="node-icon">Icon</label>
    <input
      id="node-icon"
      type="text"
      value={nodeData.icon ?? ""}
      placeholder="z.B. fas fa-user"
      disabled={readonly}
      onchange={(e) => {
        onDataChange({ ...nodeData, icon: (e.target as HTMLInputElement).value });
      }}
    />
  </div>

  <div class="form-field">
    <label for="node-linked-entity">Verknüpfte Entity UUID</label>
    <input
      id="node-linked-entity"
      type="text"
      value={nodeData.linkedEntityUuid ?? ""}
      placeholder="UUID der verknüpften Entity"
      disabled={readonly}
      onchange={(e) => {
        onDataChange({ ...nodeData, linkedEntityUuid: (e.target as HTMLInputElement).value });
      }}
    />
  </div>
</div>

<style>
  .node-form {
    background: var(--color-bg-secondary, var(--color-cool-5-90));
    padding: 1.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border, var(--color-border-light-primary));
  }

  .node-form h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-tertiary));
    padding-bottom: 0.5rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .form-field label {
    font-weight: bold;
    font-size: 0.9rem;
    color: var(--color-form-label);
  }

  .form-field input,
  .form-field select {
    padding: 0.5rem;
    border: 1px solid var(--input-border-color);
    border-radius: 4px;
    font-size: 0.95rem;
    background-color: var(--input-background-color);
    color: var(--input-text-color);
  }

  .form-field input:focus,
  .form-field select:focus {
    outline: none;
    border-color: var(--input-focus-outline-color);
    color: var(--input-text-color);
  }
</style>
