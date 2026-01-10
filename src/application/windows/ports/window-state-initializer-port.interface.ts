/**
 * IWindowStateInitializer - Port für Window-State-Initialisierung
 *
 * Verantwortlichkeit: Liefert initialen State pro Window-Definition.
 * Ermöglicht plug-in-Strategie für spezifische Window-Definitionen.
 */
export interface IWindowStateInitializer {
  /**
   * Erstellt den initialen State für eine Window-Definition.
   *
   * @param definitionId - ID der Window-Definition
   * @returns Initialer State als Record
   */
  buildInitialState(definitionId: string): Record<string, unknown>;
}
