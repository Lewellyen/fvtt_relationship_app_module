import type { IWindowRendererCoordinator } from "../ports/window-renderer-coordinator-port.interface";
import type { IRendererRegistry } from "@/domain/windows/ports/renderer-registry-port.interface";
import type { Result } from "@/domain/types/result";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import type { ComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";
import type { DomElement } from "@/domain/windows/types/dom.types";
import { err } from "@/domain/utils/result";
import { rendererRegistryToken } from "../tokens/window.tokens";

/**
 * WindowRendererCoordinator - Koordiniert Rendering-Operationen
 *
 * Verantwortlichkeit: Isoliert Rendering/Mounting/Unmounting-Logik.
 * Delegiert an IRendererRegistry für Renderer-Lookup.
 */
export class WindowRendererCoordinator implements IWindowRendererCoordinator {
  static dependencies = [rendererRegistryToken] as const;

  constructor(private readonly rendererRegistry: IRendererRegistry) {}

  mount(
    descriptor: ComponentDescriptor,
    mountPoint: DomElement,
    viewModel: ViewModel
  ): Result<ComponentInstance, WindowError> {
    const rendererResult = this.rendererRegistry.get(descriptor.type);
    if (!rendererResult.ok) {
      return err({
        code: "RendererNotFound",
        message: `Renderer for type "${descriptor.type}" not found: ${rendererResult.error.message}`,
      });
    }

    const mountResult = rendererResult.value.mount(descriptor, mountPoint, viewModel);
    if (!mountResult.ok) {
      return err({
        code: "MountFailed",
        message: `Failed to mount component: ${mountResult.error.message}`,
      });
    }

    return mountResult;
  }

  unmount(descriptor: ComponentDescriptor, instance: ComponentInstance): Result<void, WindowError> {
    const rendererResult = this.rendererRegistry.get(descriptor.type);
    if (!rendererResult.ok) {
      return err({
        code: "RendererNotFound",
        message: `Renderer for type "${descriptor.type}" not found: ${rendererResult.error.message}`,
      });
    }

    const unmountResult = rendererResult.value.unmount(instance);
    if (!unmountResult.ok) {
      return err({
        code: "UnmountFailed",
        message: `Failed to unmount component: ${unmountResult.error.message}`,
      });
    }

    return unmountResult;
  }

  update(
    descriptor: ComponentDescriptor,
    instance: ComponentInstance,
    viewModel: ViewModel
  ): Result<void, WindowError> {
    const rendererResult = this.rendererRegistry.get(descriptor.type);
    if (!rendererResult.ok) {
      return err({
        code: "RendererNotFound",
        message: `Renderer for type "${descriptor.type}" not found: ${rendererResult.error.message}`,
      });
    }

    const updateResult = rendererResult.value.update(instance, viewModel);
    if (!updateResult.ok) {
      return err({
        code: "UpdateFailed",
        message: `Failed to update component: ${updateResult.error.message}`,
      });
    }

    return updateResult;
  }
}
