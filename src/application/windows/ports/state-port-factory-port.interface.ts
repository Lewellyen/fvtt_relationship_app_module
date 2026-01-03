import type { IWindowState } from "@/domain/windows/types/view-model.interface";

/**
 * IStatePortFactory - Factory für StatePort-Erstellung (Application-Port, engine-agnostisch)
 *
 * Die konkrete Implementierung (RuneState, ObservableState, etc.) wird
 * in Infrastructure/Composition Root bestimmt (z.B. basierend auf Renderer-Type).
 */
export interface IStatePortFactory {
  /**
   * Erstellt einen StatePort für eine Window-Instanz.
   *
   * Die konkrete Implementierung (RuneState, ObservableState, etc.) wird
   * in Infrastructure/Composition Root bestimmt (z.B. basierend auf Renderer-Type).
   *
   * @param instanceId - Window-Instanz-ID
   * @param initial - Initialer State
   * @returns StatePort-Instanz
   */
  create<T extends Record<string, unknown>>(instanceId: string, initial: T): IWindowState<T>;
}
