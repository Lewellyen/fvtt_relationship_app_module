import type { Result } from "@/domain/types/result";

/**
 * Port for bootstrap lifecycle events.
 *
 * Platform-agnostic abstraction for registering module initialization events.
 * This port is specifically designed for the bootstrap phase where the full
 * event system may not yet be available.
 *
 * CRITICAL: This port exists because the standard PlatformEventPort requires
 * version detection (game.version), which may not be available before the
 * init event runs. Bootstrap events must be registered immediately at module load.
 *
 * Platform mappings:
 * - Foundry VTT: Hooks.on("init"), Hooks.on("ready")
 * - Roll20: on("ready")
 * - Fantasy Grounds: onInit()
 */
export interface PlatformBootstrapEventPort {
  /**
   * Register a callback for the platform's initialization event.
   * Called when the platform has loaded but before full initialization.
   *
   * @param callback - Function to execute during init phase
   * @returns Result indicating success or failure
   */
  onInit(callback: () => void): Result<void, PlatformBootstrapEventError>;

  /**
   * Register a callback for the platform's ready event.
   * Called when the platform is fully initialized and ready.
   *
   * @param callback - Function to execute during ready phase
   * @returns Result indicating success or failure
   */
  onReady(callback: () => void): Result<void, PlatformBootstrapEventError>;
}

/**
 * Error type for bootstrap event operations.
 */
export interface PlatformBootstrapEventError {
  code: "EVENT_REGISTRATION_FAILED" | "PLATFORM_NOT_AVAILABLE" | "EVENT_ALREADY_FIRED";
  message: string;
  details?: unknown;
}
