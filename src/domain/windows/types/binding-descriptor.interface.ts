/**
 * BindingDescriptor - Verbindung zwischen Control-State und Data-Source
 *
 * WICHTIG für Svelte-first Windows:
 * - Bindings sind primär für StateStore ↔ PersistSource ↔ RemoteSync
 * - `target.ui` ist optional (nur für Schema-UI-Builder relevant)
 * - Bei Svelte-Komponenten: StatePort wird direkt verwendet, Bindings für externe Sync
 */
export interface BindingDescriptor {
  readonly id?: string; // Optional: wird automatisch generiert wenn nicht vorhanden
  readonly type?: "sync" | "schema-ui"; // Default: "sync"
  readonly source: BindingSource;
  readonly target: BindingTarget; // stateKey (primär), ui (optional für schema-ui)
  readonly transform?: BindingTransform;
  readonly twoWay?: boolean;
  readonly syncPolicy?: BindingSyncPolicy; // "manual" | "debounced" | "immediate"
  readonly debounceMs?: number; // Für "debounced"
}

/**
 * BindingSource - Quelle eines Bindings
 */
export interface BindingSource {
  readonly type: "state" | "setting" | "flag" | "journal" | "custom";
  readonly key: string;
  readonly namespace?: string;
  readonly documentId?: string;
}

/**
 * BindingTarget - Ziel eines Bindings
 */
export interface BindingTarget {
  readonly stateKey: string; // State-Key im StateStore (primär)
  readonly ui?: {
    readonly controlId: string;
    readonly property: string; // z.B. "value", "checked", "text" (optional, für Schema-UI)
  };
}

/**
 * BindingTransform - Transformations-Funktion für Bindings
 */
export type BindingTransform = (value: unknown) => unknown;

/**
 * BindingSyncPolicy - Synchronisations-Policy für Bindings
 */
export type BindingSyncPolicy = "manual" | "debounced" | "immediate";

/**
 * NormalizedBinding - Normalisiertes Binding (nach BindingEngine-Normalisierung)
 */
export interface NormalizedBinding extends BindingDescriptor {
  readonly sourceControlId?: string; // Für twoWay-Bindings
  readonly isLocal: boolean; // true = aus ControlDefinition, false = global
}
