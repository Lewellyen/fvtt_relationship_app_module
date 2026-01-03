import type { IWindowRegistry } from "@/domain/windows/ports/window-registry-port.interface";
import type { IRemoteSyncGate } from "@/domain/windows/ports/remote-sync-gate-port.interface";
import type { ISharedDocumentCache } from "@/application/windows/ports/shared-document-cache-port.interface";

// NOTE: WindowHooksBridge is in Infrastructure, but WindowHooksService needs to instantiate it.
// This is a bootstrap service that bridges Application and Infrastructure layers.
// TODO: Consider moving WindowHooksService to Infrastructure or creating a port/interface.
import { WindowHooksBridge } from "@/infrastructure/windows/adapters/foundry/hooks/window-hooks";
import {
  windowRegistryToken,
  remoteSyncGateToken,
  sharedDocumentCacheToken,
} from "../tokens/window.tokens";

/**
 * WindowHooksService - Service für Hook-Registrierung
 *
 * Registriert WindowHooksBridge bei Initialisierung.
 * Sollte nach erfolgreichem Bootstrap aufgerufen werden.
 */
export class WindowHooksService {
  static dependencies = [
    windowRegistryToken,
    remoteSyncGateToken,
    sharedDocumentCacheToken,
  ] as const;

  private bridge: WindowHooksBridge | null = null;

  constructor(
    private readonly registry: IWindowRegistry,
    private readonly remoteSyncGate: IRemoteSyncGate,
    private readonly sharedDocumentCache: ISharedDocumentCache
  ) {}

  /**
   * Registriert die WindowHooksBridge.
   * Muss nach erfolgreichem Bootstrap aufgerufen werden.
   */
  register(): void {
    if (this.bridge) {
      // Already registered
      return;
    }

    this.bridge = new WindowHooksBridge(
      this.registry,
      this.remoteSyncGate,
      this.sharedDocumentCache
    );
    this.bridge.register();
  }

  /**
   * Entfernt die Hook-Registrierungen.
   * Sollte bei Shutdown aufgerufen werden.
   */
  unregister(): void {
    // TODO: Implement unregistration if needed
    this.bridge = null;
  }
}
