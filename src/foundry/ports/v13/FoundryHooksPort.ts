import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import { tryCatch } from "@/utils/result";

/**
 * v13 implementation of FoundryHooks interface.
 * Encapsulates Foundry v13-specific hook system access.
 */
export class FoundryHooksPortV13 implements FoundryHooks {
  on(hookName: string, callback: FoundryHookCallback): Result<void, string> {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type assertion needed: Our abstraction accepts any hook name (string),
        // but fvtt-types Hooks.on() expects specific hook names (union type).
        // This is intentional to keep our abstraction layer flexible.
        (Hooks.on as (hook: string, fn: (...args: any[]) => any) => number)(hookName, callback);
      },
      (error) =>
        `Failed to register hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  off(hookName: string, callback: FoundryHookCallback): Result<void, string> {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type assertion needed: Our abstraction accepts any hook name (string),
        // but fvtt-types Hooks.off() expects specific hook names (union type).
        // This is intentional to keep our abstraction layer flexible.
        (Hooks.off as (hook: string, fn: number | ((...args: any[]) => any)) => void)(
          hookName,
          callback
        );
      },
      (error) =>
        `Failed to unregister hook ${hookName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
