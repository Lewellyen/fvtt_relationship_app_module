import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowDefinition } from "../types/window-definition.interface";
import type { NormalizedBinding } from "../types/binding-descriptor.interface";

/**
 * IBindingEngine - Verwaltet und normalisiert Bindings
 */
export interface IBindingEngine {
  /**
   * Initialisiert Bindings für eine Window-Instance.
   *
   * @param definition - WindowDefinition
   * @param instanceId - Window-Instance-ID
   * @returns Result
   */
  initialize(definition: WindowDefinition, instanceId: string): Result<void, WindowError>;

  /**
   * Synchronisiert Bindings (wenn Policy es erlaubt).
   *
   * @param instanceId - Window-Instance-ID
   * @param policy - Sync-Policy: "none" | "debounced" | "immediate"
   * @returns Result
   */
  sync(
    instanceId: string,
    policy?: "none" | "debounced" | "immediate"
  ): Promise<Result<void, WindowError>>; // Async für Persist-Operationen

  /**
   * Gibt normalisierte Bindings zurück.
   *
   * @param definition - WindowDefinition
   * @returns Array von NormalizedBinding
   */
  getNormalizedBindings(definition: WindowDefinition): ReadonlyArray<NormalizedBinding>;
}
