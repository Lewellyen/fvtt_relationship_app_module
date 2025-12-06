/**
 * Foundry-specific interface for module operations.
 *
 * Platform-specific extension of PlatformModuleReadyPort for Foundry VTT.
 * Provides direct access to Foundry's module API.
 */

export interface FoundryModule {
  /**
   * Sets the module's ready flag to true.
   * Foundry-specific implementation using game.modules.get(moduleId).ready.
   *
   * @param moduleId - The module ID to set ready
   * @returns true if successful, false if module not found
   */
  setModuleReady(moduleId: string): boolean;
}
