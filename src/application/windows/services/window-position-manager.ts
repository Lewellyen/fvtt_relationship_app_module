import type { IWindowPositionManager } from "@/domain/windows/ports/window-position-manager-port.interface";
import type { WindowPosition } from "@/domain/windows/types/window-definition.interface";
import type { WindowError } from "@/domain/windows/types/errors/window-error.interface";
import { ok, err } from "@/domain/utils/result";

/**
 * WindowPositionManager - Verwaltet Window-Positionen (Phase 2)
 *
 * Speichert Positionen im localStorage (client-scoped) pro instanceId
 */
export class WindowPositionManager implements IWindowPositionManager {
  private readonly STORAGE_KEY_PREFIX = "windowPosition:";

  loadPosition(
    instanceId: string
  ): import("@/domain/types/result").Result<WindowPosition | undefined, WindowError> {
    try {
      const key = this.getStorageKey(instanceId);
      const stored = localStorage.getItem(key);
      if (!stored) {
        return ok(undefined);
      }

      const position = JSON.parse(stored) as WindowPosition;
      return ok(position);
    } catch (error) {
      return err({
        code: "PositionLoadFailed",
        message: `Failed to load position for ${instanceId}: ${String(error)}`,
      });
    }
  }

  savePosition(
    instanceId: string,
    position: WindowPosition
  ): import("@/domain/types/result").Result<void, WindowError> {
    try {
      const key = this.getStorageKey(instanceId);
      localStorage.setItem(key, JSON.stringify(position));
      return ok(undefined);
    } catch (error) {
      return err({
        code: "PositionSaveFailed",
        message: `Failed to save position for ${instanceId}: ${String(error)}`,
      });
    }
  }

  getEffectivePosition(
    instanceId: string,
    initialPosition?: WindowPosition
  ): import("@/domain/types/result").Result<WindowPosition | undefined, WindowError> {
    const savedResult = this.loadPosition(instanceId);
    if (!savedResult.ok) {
      return err(savedResult.error);
    }

    const saved = savedResult.value;

    if (!saved && !initialPosition) {
      return ok(undefined);
    }

    if (!saved) {
      return ok(initialPosition);
    }

    if (!initialPosition) {
      return ok(saved);
    }

    // Combine: saved position overrides initial position
    return ok({
      ...initialPosition,
      ...saved,
    });
  }

  private getStorageKey(instanceId: string): string {
    return `${this.STORAGE_KEY_PREFIX}${instanceId}`;
  }
}
