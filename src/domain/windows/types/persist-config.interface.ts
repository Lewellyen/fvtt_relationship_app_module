/**
 * PersistConfig - Konfiguration für Persistenz
 *
 * PersistConfig speichert IMMER den kompletten Window-State.
 * Bindings können zusätzlich einzelne Felder mappen (z.B. für externe Datenquellen).
 */
export interface PersistConfig {
  readonly type: "setting" | "flag" | "journal" | "custom";
  readonly key: string;
  readonly namespace?: string;
  readonly documentId?: string;
  readonly scope?: "client" | "world";
  readonly autoSave?: boolean;
  readonly restoreOnOpen?: boolean;
}

/**
 * PersistMeta - Metadaten für Persist-Operationen (Origin-Tracking)
 */
export interface PersistMeta {
  readonly originClientId: string;
  readonly originWindowInstanceId: string;
  readonly render?: boolean; // Default: false (kein Foundry-window rerender)
}
