import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { tryCatch } from "@/utils/functional/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Type-safe interface for Foundry Hooks with dynamic hook names.
 * Avoids 'any' while working around fvtt-types strict hook name typing.
 */
interface DynamicHooksApi {
  on(hookName: string, callback: (...args: unknown[]) => unknown): number;
  once(hookName: string, callback: (...args: unknown[]) => unknown): number;
  off(hookName: string, callbackOrId: number | ((...args: unknown[]) => unknown)): void;
}

/**
 * v13 implementation of FoundryHooks interface.
 * Encapsulates Foundry v13-specific hook system access.
 *
 * Based on Foundry VTT v13 Hooks API:
 * https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html
 */
export class FoundryHooksPortV13 implements FoundryHooks {
  #disposed = false;

  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register hook on disposed port", {
          hookName,
        }),
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type-safe cast for dynamic hook names
        // Foundry's Hooks API supports dynamic hook names, but fvtt-types
        // has strict keyof HookConfig typing that doesn't allow runtime strings
        const hookId = (Hooks as DynamicHooksApi).on(hookName, callback);
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
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot register one-time hook on disposed port", {
          hookName,
        }),
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type-safe cast for dynamic hook names
        // Foundry's Hooks API supports dynamic hook names, but fvtt-types
        // has strict keyof HookConfig typing that doesn't allow runtime strings
        const hookId = (Hooks as DynamicHooksApi).once(hookName, callback);
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
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot unregister hook on disposed port", {
          hookName,
        }),
      };
    }
    return tryCatch(
      () => {
        if (typeof Hooks === "undefined") {
          throw new Error("Foundry Hooks API is not available");
        }
        // Type-safe cast for dynamic hook names
        // Foundry's Hooks API supports dynamic hook names, but fvtt-types
        // has strict keyof HookConfig typing that doesn't allow runtime strings
        (Hooks as DynamicHooksApi).off(hookName, callbackOrId);
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

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // Note: Hook cleanup is handled by FoundryHooksService.dispose()
    // Port remains stateless - it only wraps Foundry API
  }
}
