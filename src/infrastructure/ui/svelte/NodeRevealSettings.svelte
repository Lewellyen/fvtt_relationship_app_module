<script lang="ts">
  /**
   * NodeRevealSettings - Reveal-Settings-Komponente für Node-Sheet
   *
   * Features:
   * - Public Reveal Toggle
   * - Hidden Reveal Toggle
   */

  interface Props {
    reveal?: {
      public?: boolean;
      hidden?: boolean;
    };
    readonly?: boolean;
    onRevealChange: (reveal: { public?: boolean; hidden?: boolean }) => void;
  }

  let { reveal = {}, readonly = false, onRevealChange }: Props = $props();
</script>

<div class="node-reveal-settings">
  <h3>Sichtbarkeit</h3>

  <div class="reveal-field">
    <label>
      <input
        type="checkbox"
        checked={reveal.public ?? false}
        disabled={readonly}
        onchange={(e) => {
          onRevealChange({ ...reveal, public: (e.target as HTMLInputElement).checked });
        }}
      />
      <span>Öffentlich sichtbar</span>
    </label>
    <p class="hint">Diese Node ist für alle Spieler sichtbar</p>
  </div>

  <div class="reveal-field">
    <label>
      <input
        type="checkbox"
        checked={reveal.hidden ?? false}
        disabled={readonly}
        onchange={(e) => {
          onRevealChange({ ...reveal, hidden: (e.target as HTMLInputElement).checked });
        }}
      />
      <span>Versteckt</span>
    </label>
    <p class="hint">Diese Node ist nur für Spieler mit entsprechender Berechtigung sichtbar</p>
  </div>
</div>

<style>
  .node-reveal-settings {
    background: var(--color-bg-secondary, var(--color-cool-5-90));
    padding: 1.5rem;
    border-radius: 4px;
    border: 1px solid var(--color-border, var(--color-border-light-primary));
  }

  .node-reveal-settings h3 {
    margin: 0 0 1rem 0;
    font-size: 1.2rem;
    border-bottom: 1px solid var(--color-border, var(--color-border-light-tertiary));
    padding-bottom: 0.5rem;
    color: var(--color-text-primary, var(--color-text-light-primary));
  }

  .reveal-field {
    margin-bottom: 1rem;
  }

  .reveal-field label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: bold;
    color: var(--color-form-label);
  }

  .reveal-field input[type="checkbox"] {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    accent-color: var(--checkbox-checked-color);
  }

  .reveal-field .hint {
    margin: 0.25rem 0 0 1.7rem;
    font-size: 0.85rem;
    color: var(--color-text-secondary, var(--color-text-light-secondary));
    font-weight: normal;
  }
</style>
