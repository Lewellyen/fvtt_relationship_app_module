import type { Result } from "@/domain/types/result";
import type { FoundryHooks } from "../../interfaces/FoundryHooks";
import type { FoundryHookCallback } from "../../types";
import type { FoundryError } from "../../errors/FoundryErrors";
import type { IFoundryHooksAPI } from "../../api/foundry-api.interface";
import { tryCatch } from "@/domain/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";

/**
 * v13 implementation of FoundryHooks interface.
 * Encapsulates Foundry v13-specific hook system access.
 *
 * Based on Foundry VTT v13 Hooks API:
 * https://foundryvtt.com/api/classes/foundry.helpers.Hooks.html
 *
 * Uses dependency injection for Foundry APIs to improve testability.
 */
export class FoundryV13HooksPort implements FoundryHooks {
  #disposed = false;

  constructor(private readonly foundryAPI: IFoundryHooksAPI) {}

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
        if (!this.foundryAPI) {
          throw new Error("Foundry Hooks API is not available");
        }
        const hookId = this.foundryAPI.on(hookName, callback);
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
        if (!this.foundryAPI) {
          throw new Error("Foundry Hooks API is not available");
        }
        const hookId = this.foundryAPI.once(hookName, callback);
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
        if (!this.foundryAPI) {
          throw new Error("Foundry Hooks API is not available");
        }
        this.foundryAPI.off(hookName, callbackOrId);
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
    // Note: Hook cleanup is handled by FoundryHooksPort.dispose()
    // Port remains stateless - it only wraps Foundry API
  }
}

/**
 * Factory function to create FoundryV13HooksPort instance for production use.
 * Injects real Foundry Hooks API.
 *
 * @returns FoundryV13HooksPort instance
 */
export function createFoundryV13HooksPort(): FoundryV13HooksPort {
  if (typeof Hooks === "undefined") {
    throw new Error("Foundry Hooks API is not available");
  }

  // Type-safe cast for dynamic hook names
  // Foundry's Hooks API supports dynamic hook names, but fvtt-types
  // has strict keyof HookConfig typing that doesn't allow runtime strings
  return new FoundryV13HooksPort({
    on: (hookName: string, callback: FoundryHookCallback) => {
      return (Hooks as { on: (name: string, cb: FoundryHookCallback) => number }).on(
        hookName,
        callback
      );
    },
    once: (hookName: string, callback: FoundryHookCallback) => {
      return (Hooks as { once: (name: string, cb: FoundryHookCallback) => number }).once(
        hookName,
        callback
      );
    },
    off: (hookName: string, callbackOrId: FoundryHookCallback | number) => {
      (Hooks as { off: (name: string, cbOrId: FoundryHookCallback | number) => void }).off(
        hookName,
        callbackOrId
      );
    },
  });
}
