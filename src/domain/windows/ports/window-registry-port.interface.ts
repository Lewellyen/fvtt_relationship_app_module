import type { Result } from "@/domain/types/result";
import type { WindowError } from "../types/errors/window-error.interface";
import type { WindowDefinition } from "../types/window-definition.interface";
import type { WindowInstance } from "../types/window-handle.interface";

/**
 * IWindowRegistry - Verwaltet WindowDefinitions und WindowInstances
 */
export interface IWindowRegistry {
  /**
   * Registriert eine WindowDefinition (statisch).
   *
   * @param definition - WindowDefinition
   * @returns Result
   */
  registerDefinition(definition: WindowDefinition): Result<void, WindowError>;

  /**
   * Holt eine WindowDefinition per ID.
   *
   * @param definitionId - Definition-ID
   * @returns Result mit Definition oder Fehler
   */
  getDefinition(definitionId: string): Result<WindowDefinition, WindowError>;

  /**
   * Registriert eine WindowInstance (dynamisch).
   *
   * @param instance - WindowInstance
   * @returns Result
   */
  registerInstance(instance: WindowInstance): Result<void, WindowError>;

  /**
   * Holt eine WindowInstance per ID.
   *
   * @param instanceId - Instanz-ID
   * @returns Result mit Instance oder Fehler
   */
  getInstance(instanceId: string): Result<WindowInstance, WindowError>;

  /**
   * Entfernt eine WindowInstance aus der Registry.
   *
   * @param instanceId - Instanz-ID
   * @returns Result
   */
  unregisterInstance(instanceId: string): Result<void, WindowError>;

  /**
   * Listet alle aktiven Instanzen.
   *
   * @returns Array von WindowInstance
   */
  listInstances(): ReadonlyArray<WindowInstance>;

  /**
   * Listet alle Instanzen einer Definition.
   *
   * @param definitionId - Definition-ID
   * @returns Array von WindowInstance
   */
  listInstancesByDefinition(definitionId: string): ReadonlyArray<WindowInstance>;
}
