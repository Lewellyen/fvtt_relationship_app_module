import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowDefinition } from "../types/window-definition.interface";
import type { WindowHandle } from "../types/window-handle.interface";

/**
 * IWindowFactory - Erstellt Fenster aus WindowDefinition
 */
export interface IWindowFactory {
  /**
   * Erstellt ein Fenster aus einer WindowDefinition-ID.
   *
   * @param definitionId - Definition-ID (statisch)
   * @param instanceKey - Optional: Instanz-Key (für mehrere Instanzen)
   * @param overrides - Optionale Overrides für die Definition
   * @returns Result mit WindowHandle oder Fehler
   */
  createWindow(
    definitionId: string,
    instanceKey?: string,
    overrides?: Partial<WindowDefinition>
  ): Promise<Result<WindowHandle, WindowError>>;
}
