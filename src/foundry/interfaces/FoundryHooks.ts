import type { Result } from "@/types/result";
import type { FoundryHookCallback } from "../types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Interface for Foundry's hook system.
 * Abstracts hook registration and management.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * Based on Foundry VTT v13 Hooks API:
 * https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html
 */
export interface FoundryHooks extends Disposable {
  /**
   * Registers a callback for a hook event.
   * @param hookName - The name of the hook to register for (e.g., "init", "ready", "renderJournalDirectory")
   * @param callback - The callback function to execute when the hook fires
   * @returns Result with hook ID for deregistration, or FoundryError
   */
  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError>;

  /**
   * Registers a one-time callback for a hook event.
   * The callback will be automatically unregistered after first execution.
   * @param hookName - The name of the hook to register for
   * @param callback - The callback function to execute when the hook fires
   * @returns Result with hook ID, or FoundryError
   */
  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError>;

  /**
   * Unregisters a callback from a hook event.
   * @param hookName - The name of the hook
   * @param callbackOrId - The callback function or hook ID to unregister
   * @returns Result indicating success or FoundryError
   */
  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError>;
}
