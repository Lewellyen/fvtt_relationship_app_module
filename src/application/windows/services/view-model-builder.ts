import type { IViewModelBuilder } from "@/domain/windows/ports/view-model-builder-port.interface";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { ViewModel, IWindowState } from "@/domain/windows/types/view-model.interface";

/**
 * ViewModelBuilder - Erstellt ViewModel aus StatePort + Actions
 */
export class ViewModelBuilder implements IViewModelBuilder {
  build(
    definition: WindowDefinition,
    state: IWindowState<Record<string, unknown>>,
    actions: Record<string, () => void>
  ): ViewModel {
    // Computed values (abgeleitete Werte)
    // MVP: Basis-Implementierung (leer, kann später erweitert werden)
    const computed: Record<string, unknown> = {};

    // TODO: Computed-Logik implementieren (z.B. basierend auf definition.computed)

    return {
      state, // StatePort (kann reaktiv sein, z.B. RuneState)
      computed,
      actions,
      // i18n und logger werden optional über DI injiziert (später)
    };
  }
}
