import type { Result } from "@/types/result";
import type { FoundryHooks } from "@/foundry/interfaces/FoundryHooks";
import type { FoundryHookCallback } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import type { Logger } from "@/interfaces/logger";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryHooksPortRegistryToken } from "@/foundry/foundrytokens";
import { loggerToken } from "@/tokens/tokenindex";

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
 * Service wrapper for FoundryHooks that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Implements Disposable to clean up registered hooks when the container is disposed.
 */
export class FoundryHooksService implements FoundryHooks, Disposable {
  static dependencies = [portSelectorToken, foundryHooksPortRegistryToken, loggerToken] as const;

  private port: FoundryHooks | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryHooks>;
  private readonly logger: Logger;
  private registeredHooks = new Map<string, Map<number, FoundryHookCallback>>();
  // Bidirectional mapping: callback function -> array of hook registrations (supports reused callbacks)
  private callbackToIdMap = new Map<FoundryHookCallback, Array<{ hookName: string; id: number }>>();

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryHooks>,
    logger: Logger
  ) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
    this.logger = logger;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  private getPort(): Result<FoundryHooks, FoundryError> {
    if (this.port === null) {
      // Get factories (not instances) to avoid eager instantiation
      const factories = this.portRegistry.getFactories();

      // Use PortSelector with factory-based selection
      const portResult = this.portSelector.selectPortFromFactories(
        factories,
        undefined,
        "FoundryHooks"
      );
      if (!portResult.ok) {
        return portResult;
      }

      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  on(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;

    const result = portResult.value.on(hookName, callback);

    if (result.ok) {
      // Track registered hook for cleanup (both directions)
      if (!this.registeredHooks.has(hookName)) {
        this.registeredHooks.set(hookName, new Map());
      }
      // Hook map is created above when missing; bang assertion is safe
      /* type-coverage:ignore-next-line */
      this.registeredHooks.get(hookName)!.set(result.value, callback);

      // Support multiple registrations of the same callback
      const existing = this.callbackToIdMap.get(callback) || [];
      existing.push({ hookName, id: result.value });
      this.callbackToIdMap.set(callback, existing);
    }

    return result;
  }

  once(hookName: string, callback: FoundryHookCallback): Result<number, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;

    // once() hooks are automatically deregistered by Foundry after firing
    // No tracking needed - they clean themselves up
    return portResult.value.once(hookName, callback);
  }

  off(hookName: string, callbackOrId: FoundryHookCallback | number): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;

    const result = portResult.value.off(hookName, callbackOrId);

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
  dispose(): void {
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
