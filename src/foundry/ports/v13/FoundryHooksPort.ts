import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { tryCatch } from "@/utils/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * v13 implementation of FoundryHooks interface.
 * Encapsulates Foundry v13-specific hook system access.
 *
 * Based on Foundry VTT v13 Hooks API:
 * https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html
 */
export class FoundryHooksPortV13 implements FoundryHooks {
  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type assertion needed: Our abstraction accepts any hook name (string),
        // but fvtt-types Hooks.on() expects specific hook names (union type).
        // This is intentional to keep our abstraction layer flexible.
        // Foundry Hooks.on returns hook ID
        const hookId = (Hooks.on as (hook: string, fn: (...args: any[]) => any) => number)(
          hookName,
          callback
        );
        return hookId;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to register hook ${hookName}`,
          { hookName },
          error
        )
    );
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type assertion needed: Our abstraction accepts any hook name (string),
        // but fvtt-types Hooks.once() expects specific hook names (union type).
        // This is intentional to keep our abstraction layer flexible.
        // Foundry Hooks.once returns hook ID
        const hookId = (Hooks.once as (hook: string, fn: (...args: any[]) => any) => number)(
          hookName,
          callback
        );
        return hookId;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to register one-time hook ${hookName}`,
          { hookName },
          error
        )
    );
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type assertion needed: Our abstraction accepts any hook name (string),
        // but fvtt-types Hooks.off() expects specific hook names (union type).
        // This is intentional to keep our abstraction layer flexible.
        // Foundry Hooks.off accepts hook ID or function
        (Hooks.off as (hook: string, fn: number | ((...args: any[]) => any)) => void)(
          hookName,
          callbackOrId
        );
        return undefined;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to unregister hook ${hookName}`,
          { hookName },
          error
        )
    );
  }
}
