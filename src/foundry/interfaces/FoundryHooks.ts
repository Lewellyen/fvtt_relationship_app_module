import type { Result } from "@/types/result";
import type { FoundryHookCallback } from "../types";

/**
 * Interface for Foundry's hook system.
 * Abstracts hook registration and management.
 */
export interface FoundryHooks {
  /**
   * Registers a callback for a hook event.
   * @param hookName - The name of the hook to register for (e.g., "init", "ready", "renderJournalDirectory")
   * @param callback - The callback function to execute when the hook fires
   * @returns Result indicating success or error
   */
  on(hookName: string, callback: FoundryHookCallback): Result<void, string>;

  /**
   * Unregisters a callback from a hook event.
   * @param hookName - The name of the hook
   * @param callback - The callback function to unregister
   * @returns Result indicating success or error
   */
  off(hookName: string, callback: FoundryHookCallback): Result<void, string>;
}
