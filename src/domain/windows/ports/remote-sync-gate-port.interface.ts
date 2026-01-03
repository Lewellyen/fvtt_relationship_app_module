import type { PersistMeta } from "../types/persist-config.interface";

/**
 * IRemoteSyncGate - Origin-Tracking für Persist (verhindert Ping-Pong)
 */
export interface IRemoteSyncGate {
  /**
   * Erstellt PersistMeta für einen Save-Vorgang.
   *
   * @param instanceId - Window-Instanz-ID
   * @returns PersistMeta mit Origin-Informationen
   */
  makePersistMeta(instanceId: string): PersistMeta;

  /**
   * Prüft, ob ein Update von einem bestimmten Window stammt (verhindert Ping-Pong).
   * WICHTIG: Window-scoped, nicht Client-scoped!
   *
   * @param options - Foundry Update-Options (mit Origin-Meta)
   * @param instanceId - Window-Instanz-ID, für die geprüft werden soll
   * @returns true wenn Update von diesem Window, false wenn remote oder anderes Window
   */
  isFromWindow(options: Record<string, unknown> | undefined, instanceId: string): boolean;

  /**
   * Holt die aktuelle Client-ID.
   *
   * @returns Client-ID
   */
  getClientId(): string;
}
