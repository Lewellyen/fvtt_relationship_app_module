import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { PersistMeta } from "@/domain/windows/types/persist-config.interface";
import { extractPersistMeta } from "../utils/window-state-casts";

/**
 * RemoteSyncGate - Origin-Tracking für Persist (window-scoped, verhindert Ping-Pong)
 */
export class RemoteSyncGate implements IRemoteSyncGate {
  private readonly clientId: string;
  private readonly OPT_KEY = "windowFrameworkOrigin";

  constructor() {
    // Client-ID aus Foundry game.userId oder generieren
    this.clientId =
      typeof game !== "undefined" && game.userId ? game.userId : `client-${Date.now()}`;
  }

  makePersistMeta(instanceId: string): PersistMeta {
    return {
      originClientId: this.clientId,
      originWindowInstanceId: instanceId,
      render: false, // Kein Foundry-window rerender
    };
  }

  isFromWindow(options: Record<string, unknown> | undefined, instanceId: string): boolean {
    const meta = extractPersistMeta(options, this.OPT_KEY);
    // WICHTIG: Window-scoped, nicht Client-scoped!
    // Nur Updates vom gleichen Window werden ignoriert
    return meta?.originWindowInstanceId === instanceId;
  }

  getClientId(): string {
    return this.clientId;
  }
}
