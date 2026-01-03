import type { Result } from "@/domain/types/result";
import type { RenderError } from "../types/errors/render-error.interface";
import type { ComponentDescriptor } from "../types/component-descriptor.interface";
import type { ComponentInstance } from "../types/component-instance.interface";
import type { ViewModel } from "../types/view-model.interface";

/**
 * IRenderEnginePort - Abstraktion für Render-Engine (engine-agnostisch)
 *
 * @template TInstance - Engine-spezifische Component-Instance
 */
export interface IRenderEnginePort<TInstance extends ComponentInstance = ComponentInstance> {
  /**
   * Mountet eine Component in ein Target-Element.
   *
   * @param descriptor - ComponentDescriptor
   * @param target - HTMLElement
   * @param viewModel - ViewModel für Props
   * @returns Result mit ComponentInstance oder Fehler
   */
  mount(
    descriptor: ComponentDescriptor,
    target: HTMLElement,
    viewModel: ViewModel
  ): Result<TInstance, RenderError>;

  /**
   * Unmountet eine Component.
   *
   * @param instance - ComponentInstance
   * @returns Result
   */
  unmount(instance: TInstance): Result<void, RenderError>;

  /**
   * Aktualisiert ViewModel einer gemounteten Component.
   *
   * ⚠️ DOGMA: Renderer.update() ist KEIN State-Update-Mechanismus! ⚠️
   *
   * State → Runes (automatische Reaktivität)
   * Struktur → Renderer.update() (nur bei Definition/Struktur-Änderungen)
   *
   * Bei Svelte mit StatePort ist normalerweise kein Update nötig
   * StatePort kann reaktiv sein (z.B. RuneState), Svelte reagiert dann automatisch auf Änderungen
   * Diese Methode wird nur bei "definition changed" benötigt (z.B. Component-Wechsel)
   *
   * @param instance - ComponentInstance
   * @param viewModel - Neues ViewModel
   * @returns Result
   */
  update(instance: TInstance, viewModel: ViewModel): Result<void, RenderError>;
}
