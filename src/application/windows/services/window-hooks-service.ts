import type { IWindowHooksBridge } from "@/application/windows/ports/window-hooks-bridge-port.interface";
import { windowHooksBridgeToken } from "../tokens/window.tokens";

/**
 * WindowHooksService - Service für Hook-Registrierung
 *
 * Delegiert an WindowHooksBridge (injected via DI) für Hook-Registrierung.
 * Sollte nach erfolgreichem Bootstrap aufgerufen werden.
 */
export class WindowHooksService {
  static dependencies = [windowHooksBridgeToken] as const;

  constructor(private readonly bridge: IWindowHooksBridge) {}

  /**
   * Registriert die WindowHooksBridge.
   * Muss nach erfolgreichem Bootstrap aufgerufen werden.
   */
  register(): void {
    this.bridge.register();
  }

  /**
   * Entfernt die Hook-Registrierungen.
   * Sollte bei Shutdown aufgerufen werden.
   */
  unregister(): void {
    this.bridge.unregister();
  }
}
