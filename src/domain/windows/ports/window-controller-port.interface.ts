import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowDefinition } from "../types/window-definition.interface";
import type { ViewModel } from "../types/view-model.interface";
import type { PersistMeta } from "../types/persist-config.interface";
import type { DomElement, DomEvent } from "../types/dom.types";

/**
 * IWindowController - Kernstück des Window-Frameworks
 *
 * Orchestriert Lifecycle, Bindings, Props, Actions.
 * Wird von FoundryApplicationWrapper bei render() und close() aufgerufen.
 */
export interface IWindowController {
  readonly instanceId: string;
  readonly definitionId: string;
  readonly definition: Readonly<WindowDefinition>;
  readonly state: Readonly<Record<string, unknown>>;

  /**
   * Wird von FoundryApplicationWrapper bei render() aufgerufen (nur beim ersten Render).
   *
   * @param element - Gerendertes Foundry-Element
   * @returns Result
   */
  onFoundryRender(element: DomElement): Promise<Result<void, WindowError>>;

  /**
   * Wird von FoundryApplicationWrapper bei render() aufgerufen (bei weiteren Renders).
   *
   * @param element - Gerendertes Foundry-Element
   * @returns Result
   */
  onFoundryUpdate(element: DomElement): Promise<Result<void, WindowError>>;

  /**
   * Wird von FoundryApplicationWrapper bei close() aufgerufen.
   *
   * @returns Result
   */
  onFoundryClose(): Promise<Result<void, WindowError>>;

  /**
   * Aktualisiert den State lokal (UI + optional Persist mit Origin-Meta).
   *
   * **Semantik:** "Local" bedeutet **User-Origin**, nicht "nicht-persistent".
   * Local = User Interaction / Action Result
   *
   * @param updates - Partial State
   * @param options - Update-Optionen
   * @param options.persist - Optional: Persistieren mit Origin-Meta
   * @param options.sync - Sync-Policy: "none" | "debounced" | "immediate" (Default: "none")
   * @returns Result
   */
  updateStateLocal(
    updates: Partial<Record<string, unknown>>,
    options?: {
      persist?: boolean;
      sync?: "none" | "debounced" | "immediate";
    }
  ): Promise<Result<void, WindowError>>;

  /**
   * Wendet Remote-Patch an (ohne erneutes Persistieren, verhindert Ping-Pong).
   *
   * @param updates - Partial State
   * @returns Result
   */
  applyRemotePatch(updates: Partial<Record<string, unknown>>): Promise<Result<void, WindowError>>;

  /**
   * Führt eine Action aus.
   *
   * @param actionId - Action-ID
   * @param controlId - Optional: Control-ID
   * @param event - Optional: DOM-Event
   * @returns Result
   */
  dispatchAction(
    actionId: string,
    controlId?: string,
    event?: DomEvent
  ): Promise<Result<void, WindowError>>;

  /**
   * Persistiert den aktuellen State.
   *
   * @param meta - Optional: Origin-Meta für Remote-Sync
   * @returns Result
   */
  persist(meta?: PersistMeta): Promise<Result<void, WindowError>>;

  /**
   * Lädt persistierten State.
   *
   * @returns Result
   */
  restore(): Promise<Result<void, WindowError>>;

  /**
   * Gibt ViewModel für UI-Component zurück.
   *
   * @returns ViewModel
   */
  getViewModel(): ViewModel;
}
