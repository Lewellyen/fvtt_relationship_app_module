import type { Result } from "@/domain/types/result";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { ComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";

/**
 * IWindowRendererCoordinator - Port für Rendering-Koordination
 *
 * Verantwortlichkeit: Isoliert Rendering/Mounting/Unmounting-Logik.
 */
export interface IWindowRendererCoordinator {
  /**
   * Mountet eine Component in ein Target-Element.
   *
   * @param descriptor - ComponentDescriptor
   * @param mountPoint - HTMLElement (Mount-Point)
   * @param viewModel - ViewModel für Props
   * @returns Result mit ComponentInstance oder Fehler
   */
  mount(
    descriptor: ComponentDescriptor,
    mountPoint: HTMLElement,
    viewModel: ViewModel
  ): Result<ComponentInstance, WindowError>;

  /**
   * Unmountet eine Component.
   *
   * @param descriptor - ComponentDescriptor (für Renderer-Lookup)
   * @param instance - ComponentInstance
   * @returns Result
   */
  unmount(descriptor: ComponentDescriptor, instance: ComponentInstance): Result<void, WindowError>;

  /**
   * Aktualisiert ViewModel einer gemounteten Component.
   *
   * @param descriptor - ComponentDescriptor (für Renderer-Lookup)
   * @param instance - ComponentInstance
   * @param viewModel - Neues ViewModel
   * @returns Result
   */
  update(
    descriptor: ComponentDescriptor,
    instance: ComponentInstance,
    viewModel: ViewModel
  ): Result<void, WindowError>;
}
