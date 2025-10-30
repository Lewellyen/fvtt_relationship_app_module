import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";

/**
 * v13 implementation of FoundryHooks interface.
 * Encapsulates Foundry v13-specific hook system access.
 */
export class FoundryHooksPortV13 implements FoundryHooks {
  on(hookName: string, callback: FoundryHookCallback): void {
    if (typeof Hooks === "undefined") {
      console.error("Foundry Hooks API is not available");
      return;
    }
    (Hooks as any).on(hookName as any, callback as any);
  }

  off(hookName: string, callback: FoundryHookCallback): void {
    if (typeof Hooks === "undefined") {
      console.warn("Foundry Hooks API is not available");
      return;
    }
    (Hooks as any).off(hookName as any, callback as any);
  }
}
