import type { IStatePortFactory } from "@/application/windows/ports/state-port-factory-port.interface";
import type { IWindowState } from "@/domain/windows/types/view-model.interface";
import { RuneState } from "./rune-state";

/**
 * RuneStateFactory - IStatePortFactory Implementierung für RuneState
 *
 * Erstellt RuneState-Instanzen für Window-Instances.
 */
export class RuneStateFactory implements IStatePortFactory {
  create<T extends Record<string, unknown>>(instanceId: string, initial: T): IWindowState<T> {
    return new RuneState(initial);
  }
}
