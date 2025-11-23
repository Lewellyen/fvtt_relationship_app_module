import type { Result } from "@/domain/types/result";
import type { FoundryHooks } from "../interfaces/FoundryHooks";
import type { FoundryHookCallback } from "../types";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import {
  portSelectorToken,
  foundryHooksPortRegistryToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";
import { loggerToken, retryServiceToken } from "@/infrastructure/shared/tokens";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Type-safe interface for Foundry Hooks with dynamic hook names.
 * Allows calling Hooks.off() with runtime-determined hook names without using 'any'.
 */
interface DynamicHooksApi {
  off(hookName: string, callback: (...args: unknown[]) => unknown): void;
  on(hookName: string, callback: (...args: unknown[]) => unknown): number;
  once(hookName: string, callback: (...args: unknown[]) => unknown): number;
}

/**
 * Port wrapper for FoundryHooks that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase but maintains its own dispose() logic for hook cleanup.
 */
export class FoundryHooksPort extends FoundryServiceBase<FoundryHooks> implements FoundryHooks {
  private readonly logger: Logger;
  private registeredHooks = new Map<string, Map<number, FoundryHookCallback>>();
  // Bidirectional mapping: callback function -> array of hook registrations (supports reused callbacks)
  private callbackToIdMap = new Map<FoundryHookCallback, Array<{ hookName: string; id: number }>>();

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    retryService: RetryService,
    logger: Logger
  ) {
    super(portSelector, portRegistry, retryService);
    this.logger = logger;
  }

  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.on(hookName, callback);
    }, "FoundryHooks.on");

    if (result.ok) {
      // Track registered hook for cleanup (both directions)
      let hookMap = this.registeredHooks.get(hookName);
      if (!hookMap) {
        hookMap = new Map();
        this.registeredHooks.set(hookName, hookMap);
      }
      hookMap.set(result.value, callback);

      // Support multiple registrations of the same callback
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);
    }

    return result;
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    // once() hooks are automatically deregistered by Foundry after firing
    // No tracking needed - they clean themselves up
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.once(hookName, callback);
    }, "FoundryHooks.once");
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    const result = this.withRetry(() => {
      const portResult = this.getPort("FoundryHooks");
      if (!portResult.ok) return portResult;
      return portResult.value.off(hookName, callbackOrId);
    }, "FoundryHooks.off");

    if (result.ok) {
      // Remove from tracked hooks (handle both ID and callback variants)
      if (typeof callbackOrId === "number") {
        // ID variant: remove by ID
        const hooks = this.registeredHooks.get(hookName);
        if (hooks) {
          const callback = hooks.get(callbackOrId);
          hooks.delete(callbackOrId);
          // Clean up bidirectional mapping - remove only this specific registration
          if (callback) {
            const hookInfos = this.callbackToIdMap.get(callback);
            if (hookInfos) {
              const filtered = hookInfos.filter(
                (info) => !(info.hookName === hookName && info.id === callbackOrId)
              );
              if (filtered.length === 0) {
                this.callbackToIdMap.delete(callback);
              } else {
                this.callbackToIdMap.set(callback, filtered);
              }
            }
          }
        }
      } else {
        // Callback variant: lookup all registrations for this hookName via callbackToIdMap
        const hookInfos = this.callbackToIdMap.get(callbackOrId);
        if (hookInfos) {
          // Find all registrations for this specific hookName
          const matchingInfos = hookInfos.filter((info) => info.hookName === hookName);

          // Remove from registeredHooks
          const hooks = this.registeredHooks.get(hookName);
          if (hooks) {
            for (const info of matchingInfos) {
              hooks.delete(info.id);
            }
          }

          // Update callbackToIdMap - keep registrations for other hooks
          const filtered = hookInfos.filter((info) => info.hookName !== hookName);
          if (filtered.length === 0) {
            this.callbackToIdMap.delete(callbackOrId);
          } else {
            this.callbackToIdMap.set(callbackOrId, filtered);
          }
        }
      }
    }

    return result;
  }

  /**
   * Cleans up all registered hooks.
   * Called automatically when the container is disposed.
   */
  override dispose(): void {
    // Iterate through all callbacks and their registrations
    for (const [callback, hookInfos] of this.callbackToIdMap) {
      for (const info of hookInfos) {
        try {
          if (typeof Hooks !== "undefined") {
            // Type-safe cast for dynamic hook names
            // Foundry's Hooks API supports dynamic hook names, but fvtt-types
            // has strict keyof HookConfig typing that doesn't allow runtime strings
            (Hooks as DynamicHooksApi).off(info.hookName, callback);
          }
        } catch (error) {
          this.logger.warn("Failed to unregister hook", {
            hookName: info.hookName,
            hookId: info.id,
            error,
          });
        }
      }
    }

    this.registeredHooks.clear();
    this.callbackToIdMap.clear();
    this.port = null;
  }
}

export class DIFoundryHooksPort extends FoundryHooksPort {
  static dependencies = [
    portSelectorToken,
    foundryHooksPortRegistryToken,
    retryServiceToken,
    loggerToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    retryService: RetryService,
    logger: Logger
  ) {
    super(portSelector, portRegistry, retryService, logger);
  }
}
