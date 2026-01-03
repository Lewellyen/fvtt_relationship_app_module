import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowPosition } from "../types/window-definition.interface";

/**
 * IWindowPositionManager - Verwaltet Window-Positionen (speichern/laden)
 *
 * Phase 2: Position-Management für Windows
 */
export interface IWindowPositionManager {
  /**
   * Lädt gespeicherte Position für eine Window-Instance
   */
  loadPosition(instanceId: string): Result<WindowPosition | undefined, WindowError>;

  /**
   * Speichert Position für eine Window-Instance
   */
  savePosition(instanceId: string, position: WindowPosition): Result<void, WindowError>;

  /**
   * Kombiniert Initial-Position (aus Definition) mit gespeicherter Position
   * Gespeicherte Position hat Priorität über Initial-Position
   */
  getEffectivePosition(
    instanceId: string,
    initialPosition?: WindowPosition
  ): Result<WindowPosition | undefined, WindowError>;
}
