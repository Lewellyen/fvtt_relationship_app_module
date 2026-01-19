import type { IRenderEnginePort } from "@/domain/windows/ports/render-engine-port.interface";
import type { ComponentDescriptor } from "@/domain/windows/types/component-descriptor.interface";
import type { SvelteComponentInstance } from "@/domain/windows/types/component-instance.interface";
import type { ViewModel } from "@/domain/windows/types/view-model.interface";
import type { RenderError } from "@/domain/windows/types/errors/render-error.interface";
import type { DomElement } from "@/domain/windows/types/dom.types";
import { ok, err } from "@/domain/utils/result";
import { mount, unmount } from "svelte";
import { castSvelteComponent } from "@/application/windows/utils/window-state-casts";

/**
 * SvelteRenderer - IRenderEnginePort<SvelteComponentInstance> Implementierung
 */
export class SvelteRenderer implements IRenderEnginePort<SvelteComponentInstance> {
  private isSvelteMountComponent(value: unknown): value is Parameters<typeof mount>[0] {
    return typeof value === "function";
  }

  mount(
    descriptor: ComponentDescriptor,
    target: DomElement,
    viewModel: ViewModel
  ): import("@/domain/types/result").Result<SvelteComponentInstance, RenderError> {
    if (descriptor.type !== "svelte") {
      return err({
        code: "InvalidType",
        message: `SvelteRenderer can only mount svelte components`,
      });
    }

    try {
      // Component type from descriptor (should be a Svelte Component function)
      const component = castSvelteComponent<Record<string, unknown>>(descriptor.component);
      if (!component || !this.isSvelteMountComponent(component)) {
        return err({
          code: "InvalidType",
          message: "Component descriptor does not contain a valid Svelte component function",
        });
      }

      if (!(target instanceof HTMLElement)) {
        return err({
          code: "InvalidTarget",
          message: "Mount target is not a valid HTMLElement",
        });
      }

      // Spread ViewModel properties as props (document, state, services, etc.)
      // This allows components to directly access props like { document, nodeDataService, ... }
      const props = {
        ...descriptor.props,
        ...viewModel, // Spread ViewModel properties as direct props
        viewModel, // Also include viewModel for components that need it
      };

      const mounted = mount(component, {
        target,
        props,
      });

      return ok({
        id: `svelte-${Date.now()}-${Math.random()}`,
        type: "svelte",
        element: target,
        props,
        instance: mounted, // Svelte-spezifisch: mount() Rückgabe
      });
    } catch (error) {
      return err({
        code: "MountFailed",
        message: `Failed to mount svelte component: ${String(error)}`,
        cause: error,
      });
    }
  }

  unmount(
    instance: SvelteComponentInstance
  ): import("@/domain/types/result").Result<void, RenderError> {
    try {
      if (instance.instance) {
        unmount(instance.instance);
      }
      return ok(undefined);
    } catch (error) {
      return err({
        code: "UnmountFailed",
        message: `Failed to unmount component: ${String(error)}`,
        cause: error,
      });
    }
  }

  update(
    _instance: SvelteComponentInstance,
    _viewModel: ViewModel
  ): import("@/domain/types/result").Result<void, RenderError> {
    // ⚠️ DOGMA: Renderer.update() ist KEIN State-Update-Mechanismus! ⚠️
    //
    // State → Runes (automatische Reaktivität)
    // Struktur → Renderer.update() (nur bei Definition/Struktur-Änderungen)
    //
    // Bei Svelte mit StatePort ist normalerweise kein Update nötig
    // StatePort kann reaktiv sein (z.B. RuneState), Svelte reagiert dann automatisch auf Änderungen
    // Diese Methode wird nur bei "definition changed" benötigt (z.B. Component-Wechsel)
    //
    // In Svelte 5 gibt es kein $set() mehr. Props sollten über $state() reaktiv sein.
    // Wenn ein Update wirklich nötig ist, muss die Komponente neu gemountet werden.
    // In den meisten Fällen sollte diese Methode nichts tun, da Svelte 5 Runes automatisch reagieren.
    try {
      // $set() existiert in Svelte 5 nicht mehr
      // Props sollten über $state() reaktiv sein, daher ist normalerweise kein Update nötig
      // Falls wirklich ein Update nötig ist, müsste die Komponente neu gemountet werden,
      // was hier nicht implementiert ist, da es normalerweise nicht nötig ist.
      return ok(undefined);
    } catch (error) {
      return err({
        code: "UpdateFailed",
        message: `Failed to update component: ${String(error)}`,
        cause: error,
      });
    }
  }
}
