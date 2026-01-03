import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";

/**
 * IStateStore - Verwaltet State für Window-Instances (in-memory)
 */
export interface IStateStore {
  /**
   * Setzt einen State-Wert für eine Window-Instance.
   *
   * @param instanceId - Window-Instance-ID
   * @param key - State-Key
   * @param value - State-Wert
   * @returns Result
   */
  set(instanceId: string, key: string, value: unknown): Result<void, WindowError>;

  /**
   * Holt einen State-Wert für eine Window-Instance.
   *
   * @param instanceId - Window-Instance-ID
   * @param key - State-Key
   * @returns Result mit Wert oder Fehler
   */
  get(instanceId: string, key: string): Result<unknown, WindowError>;

  /**
   * Holt alle State-Werte für eine Window-Instance.
   *
   * @param instanceId - Window-Instance-ID
   * @returns Result mit State-Object oder Fehler
   */
  getAll(instanceId: string): Result<Record<string, unknown>, WindowError>;

  /**
   * Entfernt alle State-Werte für eine Window-Instance.
   *
   * @param instanceId - Window-Instance-ID
   * @returns Result
   */
  clear(instanceId: string): Result<void, WindowError>;
}
