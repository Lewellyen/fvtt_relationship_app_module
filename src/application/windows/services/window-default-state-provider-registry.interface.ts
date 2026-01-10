/**
 * Interface for window default state provider registries.
 *
 * Implements Open/Closed Principle: New window default state providers can be added
 * by registering them in the registry without modifying WindowStateInitializer.
 *
 * **Design Rationale:**
 * - Open/Closed: WindowStateInitializer is closed for modification but open for extension via registry
 * - Single Responsibility: Registry only manages window default state providers
 * - Dependency Inversion: WindowStateInitializer depends on abstraction, not concrete implementations
 */

import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";

/**
 * Registry that manages window default state providers by definitionId.
 *
 * Enables Open/Closed Principle: New window types with custom default states can be added
 * by registering a provider without modifying WindowStateInitializer.
 *
 * @see WindowStateInitializer for usage
 */
export interface IWindowDefaultStateProviderRegistry {
  /**
   * Registers a default state provider for a window definition.
   *
   * @param definitionId - The window definition ID
   * @param provider - The state initializer provider
   * @throws Error if a provider for the definitionId already exists
   */
  register(definitionId: string, provider: IWindowStateInitializer): void;

  /**
   * Gets a default state provider by definitionId.
   *
   * @param definitionId - The window definition ID
   * @returns The state initializer provider or undefined if not found
   */
  get(definitionId: string): IWindowStateInitializer | undefined;

  /**
   * Checks if a provider exists for a definitionId.
   *
   * @param definitionId - The window definition ID
   * @returns True if a provider exists
   */
  has(definitionId: string): boolean;
}
