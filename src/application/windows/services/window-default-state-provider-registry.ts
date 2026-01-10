import type { IWindowDefaultStateProviderRegistry } from "./window-default-state-provider-registry.interface";
import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";

/**
 * Registry for window default state providers.
 *
 * Manages all available window default state providers by definitionId and prevents duplicates.
 * Follows Open/Closed Principle: New window types with custom default states can be registered
 * without modifying WindowStateInitializer.
 */
export class WindowDefaultStateProviderRegistry implements IWindowDefaultStateProviderRegistry {
  private readonly providers = new Map<string, IWindowStateInitializer>();

  /**
   * Registers a default state provider for a window definition.
   *
   * @param definitionId - The window definition ID
   * @param provider - The state initializer provider
   * @throws Error if a provider for the definitionId already exists
   */
  register(definitionId: string, provider: IWindowStateInitializer): void {
    if (this.providers.has(definitionId)) {
      throw new Error(
        `Window default state provider for definitionId "${definitionId}" already exists. Use a different definitionId or remove the existing provider first.`
      );
    }
    this.providers.set(definitionId, provider);
  }

  /**
   * Gets a default state provider by definitionId.
   *
   * @param definitionId - The window definition ID
   * @returns The state initializer provider or undefined if not found
   */
  get(definitionId: string): IWindowStateInitializer | undefined {
    return this.providers.get(definitionId);
  }

  /**
   * Checks if a provider exists for a definitionId.
   *
   * @param definitionId - The window definition ID
   * @returns True if a provider exists
   */
  has(definitionId: string): boolean {
    return this.providers.has(definitionId);
  }
}
