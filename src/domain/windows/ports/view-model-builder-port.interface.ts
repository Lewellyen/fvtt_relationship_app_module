import type { WindowDefinition } from "../types/window-definition.interface";
import type { ViewModel, IWindowState } from "../types/view-model.interface";

/**
 * IViewModelBuilder - Erstellt ViewModel aus State + Bindings
 */
export interface IViewModelBuilder {
  /**
   * Erstellt ViewModel aus WindowDefinition, StatePort und Actions.
   *
   * @param definition - WindowDefinition
   * @param state - StatePort (kann reaktiv sein, z.B. RuneState)
   * @param actions - Actions (callable functions)
   * @returns ViewModel
   */
  build(
    definition: WindowDefinition,
    state: IWindowState<Record<string, unknown>>,
    actions: Record<string, () => void>
  ): ViewModel;
}
