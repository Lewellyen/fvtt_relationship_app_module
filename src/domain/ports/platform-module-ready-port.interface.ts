import type { Result } from "@/domain/types/result";

/**
 * Port for managing module ready state.
 *
 * Platform-agnostic abstraction for setting module.ready flag.
 * Similar to game.ready, but for the module itself.
 *
 * Platform mappings:
 * - Foundry VTT: game.modules.get(moduleId).ready = true
 * - Roll20: Module state flag
 * - Fantasy Grounds: Module initialization flag
 */
export interface PlatformModuleReadyPort {
  /**
   * Sets module.ready to true.
   * Should be called when module bootstrap is complete.
   *
   * @returns Result indicating success or failure
   */
  setReady(): Result<void, PlatformModuleReadyError>;
}

/**
 * Error type for module ready operations.
 */
export interface PlatformModuleReadyError {
  code: "MODULE_NOT_FOUND" | "PLATFORM_NOT_AVAILABLE" | "OPERATION_FAILED";
  message: string;
  details?: unknown;
}
