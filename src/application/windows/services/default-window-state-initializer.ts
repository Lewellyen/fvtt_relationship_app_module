import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";

/**
 * DefaultWindowStateInitializer - Standard-Implementation für State-Initialisierung
 *
 * Verantwortlichkeit: Liefert Default-State für generische Window-Definitionen.
 */
export class DefaultWindowStateInitializer implements IWindowStateInitializer {
  buildInitialState(_definitionId: string): Record<string, unknown> {
    return {
      journals: [],
      isLoading: false,
      error: null,
    };
  }
}
