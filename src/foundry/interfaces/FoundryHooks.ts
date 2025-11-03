import type { Result } from "@/types/result";
import type { FoundryHookCallback } from "../types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Interface for Foundry's hook system.
 * Abstracts hook registration and management.
 */
export interface FoundryHooks {
  /**
   * Registers a callback for a hook event.
   * @param hookName - The name of the hook to register for (e.g., "init", "ready", "renderJournalDirectory")
   * @param callback - The callback function to execute when the hook fires
   * @returns Result indicating success or a FoundryError
   */
  on(hookName: string, callback: FoundryHookCallback): Result<void, FoundryError>;

  /**
   * Unregisters a callback from a hook event.
   * @param hookName - The name of the hook
   * @param callback - The callback function to unregister
   * @returns Result indicating success or a FoundryError
   */
  off(hookName: string, callback: FoundryHookCallback): Result<void, FoundryError>;
}
