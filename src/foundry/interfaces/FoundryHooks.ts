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
   */
  on(hookName: string, callback: FoundryHookCallback): void;

  /**
   * Unregisters a callback from a hook event.
   * @param hookName - The name of the hook
   * @param callback - The callback function to unregister
   */
  off(hookName: string, callback: FoundryHookCallback): void;
}
