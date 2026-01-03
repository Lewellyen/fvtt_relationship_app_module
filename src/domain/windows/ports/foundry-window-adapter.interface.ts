import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowDefinition } from "../types/window-definition.interface";
import type { WindowInstance } from "../types/window-handle.interface";
import type { IWindowController } from "./window-controller-port.interface";
import type { ApplicationClass } from "../types/application-v2.interface";

/**
 * IFoundryWindowAdapter - Adapter für Foundry-spezifische Window-Integration
 */
export interface IFoundryWindowAdapter {
  /**
   * Erstellt eine dünne Foundry ApplicationV2-Wrapper-Klasse.
   * Die Klasse delegiert alle Lifecycle-Calls an WindowController.
   *
   * @param definition - WindowDefinition
   * @param controller - WindowController (wird via Closure/WeakMap gespeichert)
   * @param instanceId - Eindeutige Instanz-ID (für Multi-Instance-Support)
   * @returns Result mit Application-Klasse oder Fehler
   */
  buildApplicationWrapper(
    definition: WindowDefinition,
    controller: IWindowController,
    instanceId: string
  ): Result<ApplicationClass, WindowError>;

  /**
   * Rendert ein Fenster in Foundry.
   *
   * @param instance - WindowInstance
   * @param force - Force re-render
   * @returns Result
   */
  renderWindow(instance: WindowInstance, force?: boolean): Promise<Result<void, WindowError>>;

  /**
   * Schließt ein Fenster in Foundry.
   *
   * @param instance - WindowInstance
   * @returns Result
   */
  closeWindow(instance: WindowInstance): Promise<Result<void, WindowError>>;
}
